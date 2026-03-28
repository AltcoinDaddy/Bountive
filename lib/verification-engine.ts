import { CheckStatus, QADecision } from "@prisma/client";
import { executeProjectScript, installWorkspaceDependencies } from "@/lib/repo-workspace";
import type { GuardrailsSnapshot, VerificationResult, WorkspacePreparation } from "@/lib/types";

function summarizeChecks(installStatus: CheckStatus, buildStatus: CheckStatus, lintStatus: CheckStatus, testStatus: CheckStatus) {
  return `install=${installStatus.toLowerCase()}, build=${buildStatus.toLowerCase()}, lint=${lintStatus.toLowerCase()}, test=${testStatus.toLowerCase()}`;
}

export async function verifyWorkspace(workspace: WorkspacePreparation, guardrails: GuardrailsSnapshot): Promise<VerificationResult> {
  if (!workspace.cloneSucceeded || !workspace.repositoryPath) {
    return {
      installStatus: CheckStatus.SKIPPED,
      buildStatus: CheckStatus.SKIPPED,
      lintStatus: CheckStatus.SKIPPED,
      testStatus: CheckStatus.SKIPPED,
      criteriaMet: false,
      qaDecision: QADecision.REJECTED,
      qaNotes: "Verification was blocked because the repository could not be cloned.",
      summary: "Verification blocked"
    };
  }

  const statuses: {
    installStatus: CheckStatus;
    buildStatus: CheckStatus;
    lintStatus: CheckStatus;
    testStatus: CheckStatus;
  } = {
    installStatus: CheckStatus.SKIPPED,
    buildStatus: CheckStatus.SKIPPED,
    lintStatus: CheckStatus.SKIPPED,
    testStatus: CheckStatus.SKIPPED
  };

  const notes: string[] = [];
  const installResult = await installWorkspaceDependencies(workspace);

  statuses.installStatus = installResult.status;
  notes.push(installResult.note);

  if (installResult.status === CheckStatus.FAILED) {
    const criteriaMet = guardrails.allowApproveWithFailedChecks;

    return {
      ...statuses,
      criteriaMet,
      qaDecision: criteriaMet ? QADecision.APPROVED : QADecision.RETRY_REQUIRED,
      qaNotes: notes.join(" "),
      summary: summarizeChecks(statuses.installStatus, statuses.buildStatus, statuses.lintStatus, statuses.testStatus)
    };
  }

  for (const scriptName of ["build", "lint", "test"] as const) {
    if (!workspace.availableScripts[scriptName]) {
      notes.push(`${scriptName} skipped because the script is not defined.`);
      continue;
    }

    const result = await executeProjectScript(workspace.repositoryPath, workspace.packageManager, scriptName).catch((error) => ({
      code: 1,
      stdout: "",
      stderr: error instanceof Error ? error.message : "Unknown script execution failure"
    }));

    const status = result.code === 0 ? CheckStatus.PASSED : CheckStatus.FAILED;

    if (scriptName === "build") {
      statuses.buildStatus = status;
    }

    if (scriptName === "lint") {
      statuses.lintStatus = status;
    }

    if (scriptName === "test") {
      statuses.testStatus = status;
    }

    notes.push(`${scriptName} ${status === CheckStatus.PASSED ? "passed" : "failed"}${result.stderr ? `: ${result.stderr.split("\n")[0]}` : ""}`);
  }

  const failedChecks = [statuses.installStatus, statuses.buildStatus, statuses.lintStatus, statuses.testStatus].filter((status) => status === CheckStatus.FAILED).length;
  const criteriaMet = failedChecks === 0 || guardrails.allowApproveWithFailedChecks;

  return {
    ...statuses,
    criteriaMet,
    qaDecision: criteriaMet
      ? QADecision.APPROVED
      : failedChecks > 0
        ? QADecision.RETRY_REQUIRED
        : QADecision.REJECTED,
    qaNotes: notes.join(" "),
    summary: summarizeChecks(statuses.installStatus, statuses.buildStatus, statuses.lintStatus, statuses.testStatus)
  };
}
