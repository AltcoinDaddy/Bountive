import { CandidateStatus, MissionStage, MissionStatus } from "@prisma/client";
import { DeveloperAgent } from "@/agents/developer";
import { PlannerAgent } from "@/agents/planner";
import { QAAgent } from "@/agents/qa";
import { ScoutAgent } from "@/agents/scout";
import { SubmitterAgent } from "@/agents/submitter";
import { ensureArtifactDirectories, writeArtifact } from "@/lib/artifacts";
import { env } from "@/lib/env";
import { createMission, finalizeMissionArtifacts, logMissionEvent, updateMissionState } from "@/lib/mission-store";
import { ensureIdentityRecord, syncAgentManifest } from "@/lib/identity-module";
import { prisma } from "@/lib/prisma";
import { assertBudgets, assertLiveSubmissionAllowed, getGuardrails } from "@/lib/safety-engine";
import type { MissionInput } from "@/lib/types";
import { createProofRecord } from "@/lib/proof-record-generator";

const scoutAgent = new ScoutAgent();
const plannerAgent = new PlannerAgent();
const developerAgent = new DeveloperAgent();
const qaAgent = new QAAgent();
const submitterAgent = new SubmitterAgent();

function incrementMetrics(current: { modelCallsUsed: number; toolCallsUsed: number }, next: { modelCalls?: number; toolCalls?: number }) {
  return {
    modelCallsUsed: current.modelCallsUsed + (next.modelCalls ?? 0),
    toolCallsUsed: current.toolCallsUsed + (next.toolCalls ?? 0)
  };
}

export async function runMission(input: MissionInput) {
  const startedAt = Date.now();
  await ensureArtifactDirectories();

  const identity = await ensureIdentityRecord();
  await syncAgentManifest(identity);

  const guardrails = getGuardrails(input);
  const mission = await createMission(input, JSON.stringify(guardrails));

  let modelCallsUsed = 0;
  let toolCallsUsed = 0;
  let candidateTasksScanned = 0;
  let changedFilesCount = 0;

  try {
    await logMissionEvent({
      missionId: mission.id,
      agentName: "Orchestrator",
      stage: "discover",
      action: "mission_started",
      toolName: "orchestrator",
      inputSummary: input.title,
      outputSummary: "Mission created and guardrails initialized."
    });

    const discovered = await scoutAgent.run(input);
    candidateTasksScanned = discovered.length;
    ({ modelCallsUsed, toolCallsUsed } = incrementMetrics({ modelCallsUsed, toolCallsUsed }, { toolCalls: 1 }));

    await updateMissionState(mission.id, {
      currentStage: MissionStage.PLAN,
      candidateTasksScanned,
      toolCallsUsed
    });

    await logMissionEvent({
      missionId: mission.id,
      agentName: scoutAgent.name,
      stage: "discover",
      action: "discover_candidates",
      toolName: "github.issue_search",
      inputSummary: `labels=${input.labels.join(",")}`,
      outputSummary: `Discovered ${discovered.length} candidate issues.`,
      success: true
    });

    const ranked = plannerAgent.rankCandidates(discovered);
    ({ modelCallsUsed, toolCallsUsed } = incrementMetrics({ modelCallsUsed, toolCallsUsed }, { modelCalls: 1, toolCalls: 1 }));

    const selected = plannerAgent.chooseCandidate({
      rankedCandidates: ranked,
      mission: input,
      guardrails
    });

    for (const { candidate, score } of ranked) {
      await prisma.candidateTask.create({
        data: {
          missionId: mission.id,
          repo: candidate.repo,
          issueNumber: candidate.issueNumber,
          issueTitle: candidate.issueTitle,
          issueUrl: candidate.issueUrl,
          labels: JSON.stringify(candidate.labels),
          score: score.total,
          confidence: score.confidence,
          reasonSelected: selected?.candidate.issueUrl === candidate.issueUrl ? score.selectedReason ?? null : null,
          reasonRejected: selected?.candidate.issueUrl === candidate.issueUrl ? null : score.rejectedReason ?? "Ranked below threshold.",
          status: selected?.candidate.issueUrl === candidate.issueUrl ? CandidateStatus.SELECTED : CandidateStatus.REJECTED
        }
      });
    }

    await logMissionEvent({
      missionId: mission.id,
      agentName: plannerAgent.name,
      stage: "plan",
      action: "score_and_select",
      toolName: "scoring_engine",
      inputSummary: `confidence_threshold=${input.confidenceThreshold}`,
      outputSummary: selected
        ? `Selected ${selected.candidate.repo}#${selected.candidate.issueNumber} at ${selected.score.confidence} confidence.`
        : "No candidate met the current threshold.",
      success: Boolean(selected)
    });

    if (!selected) {
      throw new Error("No safe candidate met the current confidence threshold.");
    }

    assertLiveSubmissionAllowed(selected.candidate.repo, guardrails);

    await updateMissionState(mission.id, {
      currentStage: MissionStage.EXECUTE,
      selectedIssueUrl: selected.candidate.issueUrl,
      selectedRepo: selected.candidate.repo,
      modelCallsUsed,
      toolCallsUsed
    });

    const workspace = await developerAgent.run({
      missionId: mission.id,
      candidate: selected.candidate
    });

    changedFilesCount = workspace.changedFiles.length;
    ({ modelCallsUsed, toolCallsUsed } = incrementMetrics({ modelCallsUsed, toolCallsUsed }, { modelCalls: 1, toolCalls: workspace.cloneSucceeded ? 2 : 1 }));

    await logMissionEvent({
      missionId: mission.id,
      agentName: developerAgent.name,
      stage: "execute",
      action: "prepare_workspace",
      toolName: "git clone",
      inputSummary: selected.candidate.repoUrl,
      outputSummary: workspace.cloneSucceeded
        ? `Workspace prepared with ${Object.keys(workspace.availableScripts).filter(Boolean).length} script categories detected.`
        : "Workspace clone failed; mission remains dry-run only.",
      success: workspace.cloneSucceeded,
      errorMessage: workspace.cloneSucceeded ? undefined : workspace.executionNotes.join(" ")
    });

    await updateMissionState(mission.id, {
      currentStage: MissionStage.VERIFY,
      modelCallsUsed,
      toolCallsUsed,
      changedFilesCount
    });

    const verification = await qaAgent.run({
      workspace,
      guardrails
    });

    ({ modelCallsUsed, toolCallsUsed } = incrementMetrics({ modelCallsUsed, toolCallsUsed }, { modelCalls: 1, toolCalls: 1 }));

    await prisma.verificationReport.create({
      data: {
        missionId: mission.id,
        buildStatus: verification.buildStatus,
        lintStatus: verification.lintStatus,
        testStatus: verification.testStatus,
        criteriaMet: verification.criteriaMet,
        qaDecision: verification.qaDecision,
        qaNotes: verification.qaNotes
      }
    });

    await logMissionEvent({
      missionId: mission.id,
      agentName: qaAgent.name,
      stage: "verify",
      action: "run_verification",
      toolName: "verification_engine",
      inputSummary: "build/lint/test",
      outputSummary: verification.summary,
      success: verification.criteriaMet
    });

    assertBudgets({
      modelCallsUsed,
      toolCallsUsed,
      durationMs: Date.now() - startedAt,
      retriesUsed: mission.retriesUsed,
      changedFilesCount,
      candidateTasksScanned,
      guardrails
    });

    await updateMissionState(mission.id, {
      currentStage: MissionStage.SUBMIT,
      modelCallsUsed,
      toolCallsUsed,
      durationMs: Date.now() - startedAt
    });

    const submissionArtifact = await submitterAgent.run({
      candidate: selected.candidate,
      verification,
      workspace,
      liveMode: input.mode === "live" && input.liveSubmissionEnabled
    });

    const submission = await prisma.submission.create({
      data: {
        missionId: mission.id,
        branchName: submissionArtifact.branchName,
        commitHash: submissionArtifact.commitHash,
        commitMessage: submissionArtifact.commitMessage,
        prTitle: submissionArtifact.prTitle,
        prBody: submissionArtifact.prBody,
        prUrl: submissionArtifact.prUrl,
        changedFiles: JSON.stringify(submissionArtifact.changedFiles),
        verificationSummary: submissionArtifact.verificationSummary,
        submissionStatus: submissionArtifact.submissionStatus
      }
    });

    await logMissionEvent({
      missionId: mission.id,
      agentName: submitterAgent.name,
      stage: "submit",
      action: "prepare_submission_artifact",
      toolName: "artifact_generator",
      inputSummary: input.mode,
      outputSummary: `Prepared ${submissionArtifact.submissionStatus.toLowerCase()} submission artifact.`,
      success: true
    });

    await writeArtifact(`missions/${mission.id}.verification.json`, verification);
    await writeArtifact(`missions/${mission.id}.submission.json`, submissionArtifact);

    const persistedMission = await updateMissionState(mission.id, {
      currentStage: MissionStage.COMPLETE,
      status: MissionStatus.COMPLETED,
      modelCallsUsed,
      toolCallsUsed,
      durationMs: Date.now() - startedAt
    });

    const verificationRecord = await prisma.verificationReport.findUniqueOrThrow({
      where: {
        missionId: mission.id
      }
    });

    await createProofRecord({
      identity,
      mission: persistedMission,
      submission,
      verification: verificationRecord
    });

    await finalizeMissionArtifacts(mission.id);
    return mission.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown mission failure";

    await logMissionEvent({
      missionId: mission.id,
      agentName: "Orchestrator",
      stage: "halted",
      action: "mission_failed",
      toolName: "orchestrator",
      inputSummary: input.title,
      outputSummary: message,
      success: false,
      errorMessage: message
    });

    await updateMissionState(mission.id, {
      currentStage: MissionStage.HALTED,
      status: MissionStatus.FAILED,
      durationMs: Date.now() - startedAt,
      modelCallsUsed,
      toolCallsUsed,
      candidateTasksScanned,
      changedFilesCount
    });

    await writeArtifact(`missions/${mission.id}.error.json`, {
      missionId: mission.id,
      error: message,
      occurredAt: new Date().toISOString()
    });

    await finalizeMissionArtifacts(mission.id);
    return mission.id;
  }
}

export function defaultMissionInput(): MissionInput {
  return {
    title: "Autonomous issue mission",
    mode: env.defaultMissionMode,
    labels: ["good first issue", "help wanted", "bug", "documentation"],
    maxCandidates: env.maxCandidatesScanned,
    retries: env.maxRetries,
    toolCallLimit: env.maxToolCalls,
    modelCallLimit: env.maxModelCalls,
    confidenceThreshold: 0.68,
    allowlistedRepos: env.allowlistedRepos,
    allowApproveOnFailure: env.allowApproveWithFailedChecks,
    liveSubmissionEnabled: env.enableLiveSubmissions
  };
}
