import { CheckStatus, QADecision } from "@prisma/client";
import { executeProjectScript, installWorkspaceDependencies } from "@/lib/repo-workspace";
import type { GuardrailsSnapshot, VerificationResult, VerificationSnapshot, WorkspacePreparation } from "@/lib/types";

type CheckName = "install" | "build" | "lint" | "test";

function summarizeChecks(installStatus: CheckStatus, buildStatus: CheckStatus, lintStatus: CheckStatus, testStatus: CheckStatus) {
  return `install=${installStatus.toLowerCase()}, build=${buildStatus.toLowerCase()}, lint=${lintStatus.toLowerCase()}, test=${testStatus.toLowerCase()}`;
}

function collectFailedChecks(snapshot: {
  installStatus: CheckStatus;
  buildStatus: CheckStatus;
  lintStatus: CheckStatus;
  testStatus: CheckStatus;
}) {
  const failedChecks: CheckName[] = [];

  if (snapshot.installStatus === CheckStatus.FAILED) {
    failedChecks.push("install");
  }

  if (snapshot.buildStatus === CheckStatus.FAILED) {
    failedChecks.push("build");
  }

  if (snapshot.lintStatus === CheckStatus.FAILED) {
    failedChecks.push("lint");
  }

  if (snapshot.testStatus === CheckStatus.FAILED) {
    failedChecks.push("test");
  }

  return failedChecks;
}

function blockedSnapshot(note: string): VerificationSnapshot {
  return {
    installStatus: CheckStatus.SKIPPED,
    buildStatus: CheckStatus.SKIPPED,
    lintStatus: CheckStatus.SKIPPED,
    testStatus: CheckStatus.SKIPPED,
    notes: note,
    summary: "Verification blocked",
    failedChecks: []
  };
}

async function runVerificationSnapshot(workspace: WorkspacePreparation): Promise<VerificationSnapshot> {
  if (!workspace.cloneSucceeded || !workspace.repositoryPath) {
    return blockedSnapshot("Verification was blocked because the repository could not be cloned.");
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
    return {
      ...statuses,
      notes: notes.join(" "),
      summary: summarizeChecks(statuses.installStatus, statuses.buildStatus, statuses.lintStatus, statuses.testStatus),
      failedChecks: collectFailedChecks(statuses)
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

  return {
    ...statuses,
    notes: notes.join(" "),
    summary: summarizeChecks(statuses.installStatus, statuses.buildStatus, statuses.lintStatus, statuses.testStatus),
    failedChecks: collectFailedChecks(statuses)
  };
}

function compareVerificationSnapshots(baseline: VerificationSnapshot, current: VerificationSnapshot) {
  const baselineFailures = new Set(baseline.failedChecks);
  const currentFailures = new Set(current.failedChecks);

  const newFailures = current.failedChecks.filter((check) => !baselineFailures.has(check));
  const resolvedFailures = baseline.failedChecks.filter((check) => !currentFailures.has(check));
  const preservedFailures = current.failedChecks.filter((check) => baselineFailures.has(check));

  return {
    newFailures,
    resolvedFailures,
    preservedFailures,
    regressionDetected: newFailures.length > 0
  };
}

export async function captureBaselineVerification(workspace: WorkspacePreparation): Promise<VerificationSnapshot> {
  return runVerificationSnapshot(workspace);
}

export async function verifyWorkspace(
  workspace: WorkspacePreparation,
  guardrails: GuardrailsSnapshot,
  baselineVerification?: VerificationSnapshot
): Promise<VerificationResult> {
  if (!workspace.cloneSucceeded || !workspace.repositoryPath) {
    return {
      ...blockedSnapshot("Verification was blocked because the repository could not be cloned."),
      baselineInstallStatus: CheckStatus.SKIPPED,
      baselineBuildStatus: CheckStatus.SKIPPED,
      baselineLintStatus: CheckStatus.SKIPPED,
      baselineTestStatus: CheckStatus.SKIPPED,
      baselineSummary: "Verification blocked",
      regressionDetected: false,
      newFailures: [],
      resolvedFailures: [],
      preservedFailures: [],
      criteriaMet: false,
      qaDecision: QADecision.REJECTED,
      qaNotes: "Verification was blocked because the repository could not be cloned."
    };
  }

  const baseline = baselineVerification ?? await captureBaselineVerification(workspace);
  const current = await runVerificationSnapshot(workspace);
  const comparison = compareVerificationSnapshots(baseline, current);
  const hasMeaningfulDiff = workspace.changedFiles.length > 0;
  const postPatchFailedChecks = current.failedChecks.length;

  const criteriaMet = postPatchFailedChecks === 0
    || guardrails.allowApproveWithFailedChecks
    || (hasMeaningfulDiff && !comparison.regressionDetected);

  const qaDecision = criteriaMet
    ? QADecision.APPROVED
    : postPatchFailedChecks > 0
      ? QADecision.RETRY_REQUIRED
      : QADecision.REJECTED;

  const comparisonNotes = [
    `Baseline: ${baseline.summary}.`,
    `Post-patch: ${current.summary}.`,
    comparison.regressionDetected
      ? `New failures introduced: ${comparison.newFailures.join(", ")}.`
      : baseline.failedChecks.length > 0
        ? comparison.resolvedFailures.length > 0
          ? `No new verification regressions were introduced. Resolved failures: ${comparison.resolvedFailures.join(", ")}.`
          : `No new verification regressions were introduced. Preserved baseline failures: ${comparison.preservedFailures.join(", ") || "none"}.`
        : "No new verification regressions were introduced.",
    !hasMeaningfulDiff ? "No repository diff was produced during execution." : null
  ].filter((note): note is string => Boolean(note));

  return {
    installStatus: current.installStatus,
    buildStatus: current.buildStatus,
    lintStatus: current.lintStatus,
    testStatus: current.testStatus,
    baselineInstallStatus: baseline.installStatus,
    baselineBuildStatus: baseline.buildStatus,
    baselineLintStatus: baseline.lintStatus,
    baselineTestStatus: baseline.testStatus,
    baselineSummary: baseline.summary,
    regressionDetected: comparison.regressionDetected,
    newFailures: comparison.newFailures,
    resolvedFailures: comparison.resolvedFailures,
    preservedFailures: comparison.preservedFailures,
    criteriaMet,
    qaDecision,
    qaNotes: [current.notes, ...comparisonNotes].filter(Boolean).join(" "),
    summary: `baseline[${baseline.summary}] -> patch[${current.summary}]`
  };
}
