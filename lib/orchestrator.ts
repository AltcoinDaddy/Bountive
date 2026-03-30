import { CandidateStatus, MissionStage, MissionStatus, QADecision, SubmissionStatus } from "@prisma/client";
import { DeveloperAgent } from "@/agents/developer";
import { PlannerAgent } from "@/agents/planner";
import { QAAgent } from "@/agents/qa";
import { ScoutAgent } from "@/agents/scout";
import { SubmitterAgent } from "@/agents/submitter";
import { ensureArtifactDirectories, writeArtifact } from "@/lib/artifacts";
import { env } from "@/lib/env";
import { assertLiveMissionConfigured } from "@/lib/live-submission-readiness";
import { createQueueCoordinator } from "@/lib/queue-coordinator";
import { claimNextQueuedMission, getMissionRunState, recoverStaleRunningMissions, touchMissionHeartbeat } from "@/lib/mission-queue";
import { createMission, finalizeMissionArtifacts, getMissionById, logMissionEvent, readMissionConfig, updateMissionState } from "@/lib/mission-store";
import { ensureIdentityRecord, syncAgentManifest } from "@/lib/identity-module";
import { prisma } from "@/lib/prisma";
import { assertBudgets, assertLiveSubmissionAllowed, getGuardrails } from "@/lib/safety-engine";
import type { DiscoveryCandidate, GuardrailsSnapshot, MissionInput, VerificationResult, VerificationSnapshot, WorkspacePreparation } from "@/lib/types";
import { createProofRecord } from "@/lib/proof-record-generator";

const scoutAgent = new ScoutAgent();
const plannerAgent = new PlannerAgent();
const developerAgent = new DeveloperAgent();
const qaAgent = new QAAgent();
const submitterAgent = new SubmitterAgent();
const defaultWorkerId = "inline-operator";

async function assertMissionStillRunnable(missionId: string) {
  const mission = await getMissionRunState(missionId);

  if (mission?.status === MissionStatus.ABORTED) {
    throw new Error("Mission aborted by operator.");
  }
}

function incrementMetrics(current: { modelCallsUsed: number; toolCallsUsed: number }, next: { modelCalls?: number; toolCalls?: number }) {
  return {
    modelCallsUsed: current.modelCallsUsed + (next.modelCalls ?? 0),
    toolCallsUsed: current.toolCallsUsed + (next.toolCalls ?? 0)
  };
}

async function executeAndVerify(input: {
  missionId: string;
  candidate: DiscoveryCandidate;
  mission: MissionInput;
  guardrails: GuardrailsSnapshot;
  startedAt: number;
  modelCallsUsed: number;
  toolCallsUsed: number;
  candidateTasksScanned: number;
}) {
  let retriesUsed = 0;
  let modelCallsUsed = input.modelCallsUsed;
  let toolCallsUsed = input.toolCallsUsed;
  let changedFilesCount = 0;
  let workspace: WorkspacePreparation | null = null;
  let verification: VerificationResult | null = null;
  let baselineVerification: VerificationSnapshot | null = null;

  while (retriesUsed <= input.guardrails.maxRetries) {
    await assertMissionStillRunnable(input.missionId);
    await touchMissionHeartbeat(input.missionId);

    const preparedWorkspace = await developerAgent.prepare({
      missionId: input.missionId,
      candidate: input.candidate,
      retryIndex: retriesUsed
    });

    ({ modelCallsUsed, toolCallsUsed } = incrementMetrics(
      { modelCallsUsed, toolCallsUsed },
      { modelCalls: 1, toolCalls: preparedWorkspace.cloneSucceeded ? 2 : 1 }
    ));

    await logMissionEvent({
      missionId: input.missionId,
      agentName: developerAgent.name,
      stage: "execute",
      action: retriesUsed === 0 ? "prepare_workspace" : "retry_prepare_workspace",
      toolName: "git clone",
      inputSummary: input.candidate.cloneUrl ?? input.candidate.repoUrl,
      outputSummary: preparedWorkspace.cloneSucceeded
        ? `Workspace prepared on ${preparedWorkspace.branchName ?? "detached branch"} before mutation.`
        : "Workspace clone failed; mission remains blocked before baseline verification.",
      success: preparedWorkspace.cloneSucceeded,
      errorMessage: preparedWorkspace.cloneSucceeded ? undefined : preparedWorkspace.executionNotes.join(" "),
      retryIndex: retriesUsed
    });

    baselineVerification = await qaAgent.captureBaseline({
      workspace: preparedWorkspace
    });

    ({ modelCallsUsed, toolCallsUsed } = incrementMetrics(
      { modelCallsUsed, toolCallsUsed },
      { toolCalls: 1 }
    ));

    await logMissionEvent({
      missionId: input.missionId,
      agentName: qaAgent.name,
      stage: "verify",
      action: retriesUsed === 0 ? "capture_baseline" : "retry_capture_baseline",
      toolName: "verification_engine",
      inputSummary: "baseline install/build/lint/test",
      outputSummary: baselineVerification.summary,
      success: baselineVerification.failedChecks.length === 0,
      retryIndex: retriesUsed
    });

    workspace = await developerAgent.apply({
      missionId: input.missionId,
      candidate: input.candidate,
      workspace: preparedWorkspace,
      retryIndex: retriesUsed,
      previousQaNotes: verification?.qaNotes
    });

    changedFilesCount = workspace.changedFiles.length;
    ({ modelCallsUsed, toolCallsUsed } = incrementMetrics(
      { modelCallsUsed, toolCallsUsed },
      { modelCalls: 1, toolCalls: workspace.cloneSucceeded ? 1 : 0 }
    ));

    await logMissionEvent({
      missionId: input.missionId,
      agentName: developerAgent.name,
      stage: "execute",
      action: retriesUsed === 0 ? "apply_execution_strategy" : "retry_execution",
      toolName: workspace.appliedAdapterId ?? "execution_engine",
      inputSummary: input.candidate.cloneUrl ?? input.candidate.repoUrl,
      outputSummary: workspace.cloneSucceeded
        ? workspace.appliedAdapterId
          ? `Applied ${workspace.appliedAdapterId} and detected ${workspace.changedFiles.length} changed files.`
          : `No deterministic adapter matched; ${workspace.changedFiles.length} changed files detected.`
        : "Workspace clone failed; mission remains blocked before verification.",
      success: workspace.cloneSucceeded,
      errorMessage: workspace.cloneSucceeded ? undefined : workspace.executionNotes.join(" "),
      retryIndex: retriesUsed
    });

    await updateMissionState(input.missionId, {
      currentStage: MissionStage.VERIFY,
      retriesUsed,
      modelCallsUsed,
      toolCallsUsed,
      changedFilesCount,
      lastHeartbeatAt: new Date()
    });

    verification = await qaAgent.run({
      workspace,
      guardrails: input.guardrails,
      baselineVerification
    });

    await assertMissionStillRunnable(input.missionId);
    await touchMissionHeartbeat(input.missionId);

    ({ modelCallsUsed, toolCallsUsed } = incrementMetrics(
      { modelCallsUsed, toolCallsUsed },
      { modelCalls: 1, toolCalls: 1 }
    ));

    await prisma.verificationReport.upsert({
      where: {
        missionId: input.missionId
      },
      create: {
        missionId: input.missionId,
        installStatus: verification.installStatus,
        buildStatus: verification.buildStatus,
        lintStatus: verification.lintStatus,
        testStatus: verification.testStatus,
        baselineInstallStatus: verification.baselineInstallStatus,
        baselineBuildStatus: verification.baselineBuildStatus,
        baselineLintStatus: verification.baselineLintStatus,
        baselineTestStatus: verification.baselineTestStatus,
        baselineSummary: verification.baselineSummary,
        regressionDetected: verification.regressionDetected,
        criteriaMet: verification.criteriaMet,
        qaDecision: verification.qaDecision,
        qaNotes: verification.qaNotes
      },
      update: {
        installStatus: verification.installStatus,
        buildStatus: verification.buildStatus,
        lintStatus: verification.lintStatus,
        testStatus: verification.testStatus,
        baselineInstallStatus: verification.baselineInstallStatus,
        baselineBuildStatus: verification.baselineBuildStatus,
        baselineLintStatus: verification.baselineLintStatus,
        baselineTestStatus: verification.baselineTestStatus,
        baselineSummary: verification.baselineSummary,
        regressionDetected: verification.regressionDetected,
        criteriaMet: verification.criteriaMet,
        qaDecision: verification.qaDecision,
        qaNotes: verification.qaNotes
      }
    });

    await logMissionEvent({
      missionId: input.missionId,
      agentName: qaAgent.name,
      stage: "verify",
      action: retriesUsed === 0 ? "run_verification" : "retry_verification",
      toolName: "verification_engine",
      inputSummary: "install/build/lint/test",
      outputSummary: verification.summary,
      success: verification.criteriaMet,
      retryIndex: retriesUsed
    });

    assertBudgets({
      modelCallsUsed,
      toolCallsUsed,
      durationMs: Date.now() - input.startedAt,
      retriesUsed,
      changedFilesCount,
      candidateTasksScanned: input.candidateTasksScanned,
      guardrails: input.guardrails
    });

    if (verification.qaDecision !== QADecision.RETRY_REQUIRED || retriesUsed === input.guardrails.maxRetries) {
      return {
        workspace,
        verification,
        retriesUsed,
        modelCallsUsed,
        toolCallsUsed,
        changedFilesCount
      };
    }

    retriesUsed += 1;

    await logMissionEvent({
      missionId: input.missionId,
      agentName: "Orchestrator",
      stage: "verify",
      action: "retry_requested",
      toolName: "orchestrator",
      inputSummary: input.mission.title,
      outputSummary: `Verification requested retry ${retriesUsed} of ${input.guardrails.maxRetries}.`,
      success: true,
      retryIndex: retriesUsed
    });

    await updateMissionState(input.missionId, {
      currentStage: MissionStage.EXECUTE,
      retriesUsed,
      modelCallsUsed,
      toolCallsUsed,
      changedFilesCount,
      lastHeartbeatAt: new Date()
    });
  }

  throw new Error("Mission verification loop terminated unexpectedly.");
}

function normalizeMissionInput(config: Record<string, unknown>): MissionInput {
  const defaults = defaultMissionInput();

  return {
    title: typeof config.title === "string" ? config.title : defaults.title,
    mode: config.mode === "live" ? "live" : "dry_run",
    labels: Array.isArray(config.labels) ? config.labels.filter((value): value is string => typeof value === "string") : defaults.labels,
    maxCandidates: typeof config.maxCandidates === "number" ? config.maxCandidates : defaults.maxCandidates,
    retries: typeof config.retries === "number" ? config.retries : defaults.retries,
    toolCallLimit: typeof config.toolCallLimit === "number" ? config.toolCallLimit : defaults.toolCallLimit,
    modelCallLimit: typeof config.modelCallLimit === "number" ? config.modelCallLimit : defaults.modelCallLimit,
    confidenceThreshold: typeof config.confidenceThreshold === "number" ? config.confidenceThreshold : defaults.confidenceThreshold,
    allowlistedRepos: Array.isArray(config.allowlistedRepos)
      ? config.allowlistedRepos.filter((value): value is string => typeof value === "string")
      : defaults.allowlistedRepos,
    allowApproveOnFailure: config.allowApproveOnFailure === true,
    liveSubmissionEnabled: config.liveSubmissionEnabled === true
  };
}

async function executeMissionRun(input: {
  missionId: string;
  mission: MissionInput;
  workerId: string;
}) {
  const startedAt = Date.now();
  await ensureArtifactDirectories();

  const identity = await ensureIdentityRecord();
  await syncAgentManifest(identity);

  const guardrails = getGuardrails(input.mission);

  let modelCallsUsed = 0;
  let toolCallsUsed = 0;
  let candidateTasksScanned = 0;
  let changedFilesCount = 0;
  let retriesUsed = 0;

  try {
    await touchMissionHeartbeat(input.missionId);
    await assertMissionStillRunnable(input.missionId);

    await logMissionEvent({
      missionId: input.missionId,
      agentName: "Orchestrator",
      stage: "discover",
      action: "mission_started",
      toolName: "orchestrator",
      inputSummary: input.mission.title,
      outputSummary: `Mission execution started on worker ${input.workerId}.`
    });

    assertLiveMissionConfigured({
      mode: input.mission.mode,
      liveSubmissionEnabled: input.mission.liveSubmissionEnabled,
      allowlistedRepos: input.mission.allowlistedRepos
    });

    const discovered = await scoutAgent.run(input.mission);
    candidateTasksScanned = discovered.length;
    ({ modelCallsUsed, toolCallsUsed } = incrementMetrics({ modelCallsUsed, toolCallsUsed }, { toolCalls: 1 }));

    await updateMissionState(input.missionId, {
      currentStage: MissionStage.PLAN,
      candidateTasksScanned,
      toolCallsUsed,
      lastHeartbeatAt: new Date()
    });

    await logMissionEvent({
      missionId: input.missionId,
      agentName: scoutAgent.name,
      stage: "discover",
      action: "discover_candidates",
      toolName: "github.issue_search",
      inputSummary: `labels=${input.mission.labels.join(",")}`,
      outputSummary: `Discovered ${discovered.length} candidate issues.`,
      success: true
    });

    const ranked = await plannerAgent.rankCandidates(discovered);
    ({ modelCallsUsed, toolCallsUsed } = incrementMetrics({ modelCallsUsed, toolCallsUsed }, { modelCalls: 1, toolCalls: 1 }));

    const selected = plannerAgent.chooseCandidate({
      rankedCandidates: ranked,
      mission: input.mission,
      guardrails
    });

    for (const rankedCandidate of ranked) {
      const { candidate, score, support } = rankedCandidate;

      await prisma.candidateTask.create({
        data: {
          missionId: input.missionId,
          repo: candidate.repo,
          issueNumber: candidate.issueNumber,
          issueTitle: candidate.issueTitle,
          issueUrl: candidate.issueUrl,
          labels: JSON.stringify(candidate.labels),
          score: score.total,
          confidence: score.confidence,
          executionSupported: support.supported,
          executionAdapterId: support.adapterId,
          taskCategory: support.taskCategory,
          reasonSelected: selected?.candidate.issueUrl === candidate.issueUrl ? score.selectedReason ?? null : null,
          reasonRejected: selected?.candidate.issueUrl === candidate.issueUrl ? null : score.rejectedReason ?? "Ranked below threshold.",
          status: selected?.candidate.issueUrl === candidate.issueUrl ? CandidateStatus.SELECTED : CandidateStatus.REJECTED
        }
      });
    }

    await logMissionEvent({
      missionId: input.missionId,
      agentName: plannerAgent.name,
      stage: "plan",
      action: "score_and_select",
      toolName: "scoring_engine",
      inputSummary: `confidence_threshold=${input.mission.confidenceThreshold}`,
      outputSummary: selected
        ? `Selected ${selected.candidate.repo}#${selected.candidate.issueNumber} at ${selected.score.confidence} confidence.`
        : "No candidate met the current threshold.",
      success: Boolean(selected)
    });

    if (!selected) {
      throw new Error("No safe candidate met the current confidence threshold.");
    }

    assertLiveSubmissionAllowed(selected.candidate.repo, guardrails);

    await updateMissionState(input.missionId, {
      currentStage: MissionStage.EXECUTE,
      selectedIssueUrl: selected.candidate.issueUrl,
      selectedRepo: selected.candidate.repo,
      modelCallsUsed,
      toolCallsUsed,
      lastHeartbeatAt: new Date()
    });

    const executionResult = await executeAndVerify({
      missionId: input.missionId,
      candidate: selected.candidate,
      mission: input.mission,
      guardrails,
      startedAt,
      modelCallsUsed,
      toolCallsUsed,
      candidateTasksScanned
    });

    modelCallsUsed = executionResult.modelCallsUsed;
    toolCallsUsed = executionResult.toolCallsUsed;
    changedFilesCount = executionResult.changedFilesCount;
    retriesUsed = executionResult.retriesUsed;

    await updateMissionState(input.missionId, {
      currentStage: MissionStage.SUBMIT,
      retriesUsed,
      modelCallsUsed,
      toolCallsUsed,
      changedFilesCount,
      durationMs: Date.now() - startedAt,
      lastHeartbeatAt: new Date()
    });

    await assertMissionStillRunnable(input.missionId);
    await touchMissionHeartbeat(input.missionId);

    const submissionArtifact = await submitterAgent.run({
      missionId: input.missionId,
      candidate: selected.candidate,
      verification: executionResult.verification,
      workspace: executionResult.workspace,
      liveMode: input.mission.mode === "live" && input.mission.liveSubmissionEnabled
    });

    const submission = await prisma.submission.create({
      data: {
        missionId: input.missionId,
        branchName: submissionArtifact.branchName,
        commitHash: submissionArtifact.commitHash,
        commitMessage: submissionArtifact.commitMessage,
        executionAdapterId: submissionArtifact.executionAdapterId,
        taskCategory: submissionArtifact.taskCategory,
        prTitle: submissionArtifact.prTitle,
        prBody: submissionArtifact.prBody,
        prUrl: submissionArtifact.prUrl,
        changedFiles: JSON.stringify(submissionArtifact.changedFiles),
        verificationSummary: submissionArtifact.verificationSummary,
        submissionStatus: submissionArtifact.submissionStatus,
        submittedAt: submissionArtifact.submissionStatus === SubmissionStatus.LIVE_SUBMITTED ? new Date() : null
      }
    });

    await logMissionEvent({
      missionId: input.missionId,
      agentName: submitterAgent.name,
      stage: "submit",
      action: "prepare_submission_artifact",
      toolName: "artifact_generator",
      inputSummary: input.mission.mode,
      outputSummary:
        submissionArtifact.submissionStatus === SubmissionStatus.BLOCKED
          ? "Prepared blocked submission artifact because the mission did not produce a shippable result."
          : `Prepared ${submissionArtifact.submissionStatus.toLowerCase()} submission artifact.`,
      success: submissionArtifact.submissionStatus !== SubmissionStatus.BLOCKED,
      errorMessage:
        submissionArtifact.submissionStatus === SubmissionStatus.BLOCKED
          ? "Submission blocked by verification policy or because no repository changes were produced."
          : undefined
    });

    await writeArtifact(`missions/${input.missionId}.verification.json`, executionResult.verification);
    await writeArtifact(`missions/${input.missionId}.submission.json`, submissionArtifact);

    const finalStatus = submissionArtifact.submissionStatus === SubmissionStatus.BLOCKED
      ? MissionStatus.FAILED
      : MissionStatus.COMPLETED;
    const finalStage = submissionArtifact.submissionStatus === SubmissionStatus.BLOCKED
      ? MissionStage.HALTED
      : MissionStage.COMPLETE;

    const persistedMission = await updateMissionState(input.missionId, {
      currentStage: finalStage,
      status: finalStatus,
      retriesUsed,
      modelCallsUsed,
      toolCallsUsed,
      changedFilesCount: submissionArtifact.changedFiles.length,
      durationMs: Date.now() - startedAt,
      completedAt: new Date(),
      lastHeartbeatAt: new Date(),
      failureReason: submissionArtifact.submissionStatus === SubmissionStatus.BLOCKED
        ? "Submission blocked by verification policy or because no repository changes were produced."
        : null
    });

    const verificationRecord = await prisma.verificationReport.findUniqueOrThrow({
      where: {
        missionId: input.missionId
      }
    });

    await createProofRecord({
      identity,
      mission: persistedMission,
      submission,
      verification: verificationRecord
    });

    if (submissionArtifact.submissionStatus === SubmissionStatus.BLOCKED) {
      await writeArtifact(`missions/${input.missionId}.blocked.json`, {
        missionId: input.missionId,
        reason: "Submission blocked by guardrails or missing code changes.",
        verification: executionResult.verification,
        submission: submissionArtifact
      });
    }

    await finalizeMissionArtifacts(input.missionId);
    return input.missionId;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown mission failure";
    const abortedByOperator = message === "Mission aborted by operator.";

    await logMissionEvent({
      missionId: input.missionId,
      agentName: "Orchestrator",
      stage: "halted",
      action: "mission_failed",
      toolName: "orchestrator",
      inputSummary: input.mission.title,
      outputSummary: message,
      success: false,
      errorMessage: message,
      retryIndex: retriesUsed
    });

    await updateMissionState(input.missionId, {
      currentStage: MissionStage.HALTED,
      status: abortedByOperator ? MissionStatus.ABORTED : MissionStatus.FAILED,
      retriesUsed,
      durationMs: Date.now() - startedAt,
      modelCallsUsed,
      toolCallsUsed,
      candidateTasksScanned,
      changedFilesCount,
      completedAt: new Date(),
      lastHeartbeatAt: new Date(),
      failureReason: message
    });

    await writeArtifact(`missions/${input.missionId}.error.json`, {
      missionId: input.missionId,
      error: message,
      occurredAt: new Date().toISOString()
    });

    await finalizeMissionArtifacts(input.missionId);
    return input.missionId;
  }
}

export async function enqueueMission(input: MissionInput) {
  await ensureArtifactDirectories();

  const identity = await ensureIdentityRecord();
  await syncAgentManifest(identity);

  const guardrails = getGuardrails(input);
  const mission = await createMission(input, JSON.stringify(guardrails), {
    queued: true
  });

  await logMissionEvent({
    missionId: mission.id,
    agentName: "Orchestrator",
    stage: "discover",
    action: "mission_queued",
    toolName: "queue",
    inputSummary: input.title,
    outputSummary: "Mission accepted into the queue and is waiting for a worker claim."
  });

  const coordinator = await createQueueCoordinator();
  await coordinator.publish({
    type: "mission_queued",
    missionId: mission.id
  });
  await coordinator.close();

  return mission.id;
}

export async function runMissionById(missionId: string, workerId = defaultWorkerId) {
  const missionRecord = await getMissionById(missionId);

  if (!missionRecord) {
    throw new Error(`Mission ${missionId} was not found.`);
  }

  const missionInput = normalizeMissionInput(readMissionConfig(missionRecord.configJson));

  await updateMissionState(missionId, {
    status: MissionStatus.RUNNING,
    startedAt: missionRecord.startedAt ?? new Date(),
    workerId,
    lastHeartbeatAt: new Date(),
    failureReason: null
  });

  return executeMissionRun({
    missionId,
    mission: missionInput,
    workerId
  });
}

export async function processNextQueuedMission(workerId = `worker-${Date.now()}`) {
  await recoverStaleRunningMissions();

  const mission = await claimNextQueuedMission(workerId);

  if (!mission) {
    return null;
  }

  return runMissionById(mission.id, workerId);
}

export async function runMission(input: MissionInput) {
  const guardrails = getGuardrails(input);
  const mission = await createMission(input, JSON.stringify(guardrails), {
    workerId: defaultWorkerId
  });

  return executeMissionRun({
    missionId: mission.id,
    mission: input,
    workerId: defaultWorkerId
  });
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
