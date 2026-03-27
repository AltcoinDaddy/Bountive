import type { GuardrailsSnapshot, MissionInput } from "@/lib/types";
import { env } from "@/lib/env";

const blockedTokens = ["rm ", "sudo ", "git reset", "git clean", "mkfs", ":(){", "chmod -R 777"];

export function getGuardrails(input: MissionInput): GuardrailsSnapshot {
  return {
    mode: input.mode,
    liveSubmission: input.mode === "live" && input.liveSubmissionEnabled,
    allowlistedRepos: input.allowlistedRepos,
    maxRetries: input.retries,
    maxModelCalls: input.modelCallLimit,
    maxToolCalls: input.toolCallLimit,
    maxChangedFiles: env.maxChangedFiles,
    allowApproveWithFailedChecks: input.allowApproveOnFailure,
    missionTimeoutMs: env.missionTimeoutMs
  };
}

export function assertLiveSubmissionAllowed(repo: string, guardrails: GuardrailsSnapshot) {
  if (guardrails.mode !== "live" || !guardrails.liveSubmission) {
    return;
  }

  if (!guardrails.allowlistedRepos.includes(repo)) {
    throw new Error(`Live submissions are blocked for ${repo}. Repository is not in the allowlist.`);
  }
}

export function assertBudgets(input: {
  modelCallsUsed: number;
  toolCallsUsed: number;
  durationMs: number;
  retriesUsed: number;
  changedFilesCount: number;
  candidateTasksScanned: number;
  guardrails: GuardrailsSnapshot;
}) {
  if (input.modelCallsUsed > input.guardrails.maxModelCalls) {
    throw new Error("Mission aborted because the model call budget was exceeded.");
  }

  if (input.toolCallsUsed > input.guardrails.maxToolCalls) {
    throw new Error("Mission aborted because the tool call budget was exceeded.");
  }

  if (input.retriesUsed > input.guardrails.maxRetries) {
    throw new Error("Mission aborted because the retry budget was exceeded.");
  }

  if (input.durationMs > input.guardrails.missionTimeoutMs) {
    throw new Error("Mission aborted because the mission timeout was exceeded.");
  }

  if (input.changedFilesCount > input.guardrails.maxChangedFiles) {
    throw new Error("Mission aborted because the patch-size limit was exceeded.");
  }

  if (input.candidateTasksScanned > env.maxCandidatesScanned) {
    throw new Error("Mission aborted because the candidate scan budget was exceeded.");
  }
}

export function assertSafeCommand(command: string) {
  const lower = command.toLowerCase();

  if (blockedTokens.some((token) => lower.includes(token))) {
    throw new Error(`Blocked unsafe command: ${command}`);
  }
}
