import process from "node:process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaClient, CandidateStatus, CheckStatus, MissionMode, MissionStage, MissionStatus, QADecision, SubmissionStatus } from "@prisma/client";

process.loadEnvFile?.(".env");

const prisma = new PrismaClient();

const ARTIFACTS_DIR = join(process.cwd(), "artifacts");

async function ensureDirectories() {
  await mkdir(join(ARTIFACTS_DIR, "generated"), { recursive: true });
  await mkdir(join(ARTIFACTS_DIR, "proof-records"), { recursive: true });
  await mkdir(join(ARTIFACTS_DIR, "missions"), { recursive: true });
}

async function writeJson(path: string, data: unknown) {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  await ensureDirectories();

  await prisma.authSession.deleteMany();
  await prisma.authAccount.deleteMany();
  await prisma.authVerification.deleteMany();
  await prisma.authUser.deleteMany();
  await prisma.proofRecord.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.verificationReport.deleteMany();
  await prisma.agentEventLog.deleteMany();
  await prisma.candidateTask.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.approvalPolicy.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.identityRecord.deleteMany();

  const workspace = await prisma.workspace.create({
    data: {
      name: "Default Workspace",
      slug: "default",
      authMode: process.env.AUTH_MODE ?? "local",
      operatorEmail: process.env.BOUNTIVE_OPERATOR_EMAIL ?? "operator@bountive.local",
      approvalPolicy: {
        create: {
          requireHumanApprovalForLive: true,
          allowAutoApproveDryRun: true,
          allowApproveFailedChecks: false,
          maxPatchFiles: 8,
          allowedTaskCategories: JSON.stringify(["documentation", "developer-experience copy", "configuration", "tests"])
        }
      }
    },
    include: {
      approvalPolicy: true
    }
  });

  const identity = await prisma.identityRecord.create({
    data: {
      agentName: "Bountive Operator",
      operatorWallet: process.env.BOUNTIVE_OPERATOR_WALLET ?? "0x0000000000000000000000000000000000000000",
      network: process.env.BOUNTIVE_NETWORK ?? "base-sepolia",
      registrationTxHash: process.env.BOUNTIVE_REGISTRATION_TX_HASH || null,
      manifestUri: process.env.BOUNTIVE_MANIFEST_URI ?? "artifacts/generated/agent.json",
      identityReference: process.env.BOUNTIVE_IDENTITY_REFERENCE ?? "bountive-operator-dev"
    }
  });

  const mission = await prisma.mission.create({
    data: {
      workspaceId: workspace.id,
      title: "Dry-run triage for help-wanted issue",
      status: MissionStatus.COMPLETED,
      mode: MissionMode.DRY_RUN,
      selectedIssueUrl: "https://github.com/vercel/next.js/issues/00000",
      selectedRepo: "vercel/next.js",
      currentStage: MissionStage.COMPLETE,
      retriesUsed: 0,
      modelCallsUsed: 4,
      toolCallsUsed: 11,
      durationMs: 184000,
      candidateTasksScanned: 6,
      changedFilesCount: 0,
      allowLiveSubmission: false,
      allowApproveOnFailure: false,
      guardrailsJson: JSON.stringify({
        mode: "dry_run",
        liveSubmission: false,
        allowlistedRepos: ["vercel/next.js", "tailwindlabs/tailwindcss"],
        maxRetries: 2,
        maxModelCalls: 20,
        maxToolCalls: 40,
        maxChangedFiles: 8,
        allowApproveWithFailedChecks: false
      }),
      configJson: JSON.stringify({
        labels: ["good first issue", "help wanted", "bug", "documentation"],
        confidenceThreshold: 0.68,
        retryLimit: 2,
        dryRun: true
      })
    }
  });

  await prisma.candidateTask.createMany({
    data: [
      {
        missionId: mission.id,
        repo: "vercel/next.js",
        issueNumber: 0,
        issueTitle: "Improve warning copy for invalid image config",
        issueUrl: "https://github.com/vercel/next.js/issues/00000",
        labels: JSON.stringify(["good first issue", "documentation"]),
        score: 82,
        confidence: 0.82,
        executionSupported: true,
        executionAdapterId: "seeded-demo",
        taskCategory: "documentation",
        reasonSelected: "Scoped wording improvement with clear reproduction and no migration risk.",
        status: CandidateStatus.SELECTED
      },
      {
        missionId: mission.id,
        repo: "tailwindlabs/tailwindcss",
        issueNumber: 11111,
        issueTitle: "Refactor plugin pipeline for compatibility",
        issueUrl: "https://github.com/tailwindlabs/tailwindcss/issues/11111",
        labels: JSON.stringify(["help wanted"]),
        score: 46,
        confidence: 0.42,
        executionSupported: false,
        executionAdapterId: null,
        taskCategory: null,
        reasonRejected: "Rejected as oversized for MVP compute and patch-size policy.",
        status: CandidateStatus.REJECTED
      }
    ]
  });

  await prisma.agentEventLog.createMany({
    data: [
      {
        missionId: mission.id,
        agentName: "Scout Agent",
        stage: "discover",
        action: "search_issues",
        toolName: "github.search.issues",
        inputSummary: "labels=good first issue,help wanted,bug,documentation",
        outputSummary: "Discovered 6 candidate issues across 3 repositories.",
        success: true,
        retryIndex: 0
      },
      {
        missionId: mission.id,
        agentName: "Planner Agent",
        stage: "plan",
        action: "score_candidates",
        toolName: "scoring-engine",
        inputSummary: "Scored candidates for clarity, complexity, buildability.",
        outputSummary: "Selected vercel/next.js#00000 with 0.82 confidence.",
        success: true,
        retryIndex: 0
      },
      {
        missionId: mission.id,
        agentName: "Developer Agent",
        stage: "execute",
        action: "prepare_workspace",
        toolName: "git clone",
        inputSummary: "workspace=artifacts/workspaces/sample-mission",
        outputSummary: "Cloned repository, created an isolated branch, and prepared deterministic execution strategies.",
        success: true,
        retryIndex: 0
      },
      {
        missionId: mission.id,
        agentName: "QA Agent",
        stage: "verify",
        action: "run_checks",
        toolName: "verification-engine",
        inputSummary: "install,build,test,lint",
        outputSummary: "Install skipped for the seeded demo. Build and lint passed, tests skipped due to issue scope.",
        success: true,
        retryIndex: 0
      },
      {
        missionId: mission.id,
        agentName: "Submitter Agent",
        stage: "submit",
        action: "draft_submission",
        toolName: "artifact-generator",
        inputSummary: "dry_run=true",
        outputSummary: "Generated branch, commit, PR title, PR body, and proof record.",
        success: true,
        retryIndex: 0
      }
    ]
  });

  const verification = await prisma.verificationReport.create({
    data: {
      missionId: mission.id,
      installStatus: CheckStatus.SKIPPED,
      buildStatus: CheckStatus.PASSED,
      lintStatus: CheckStatus.PASSED,
      testStatus: CheckStatus.SKIPPED,
      baselineInstallStatus: CheckStatus.SKIPPED,
      baselineBuildStatus: CheckStatus.PASSED,
      baselineLintStatus: CheckStatus.PASSED,
      baselineTestStatus: CheckStatus.SKIPPED,
      baselineSummary: "install=skipped, build=passed, lint=passed, test=skipped",
      regressionDetected: false,
      criteriaMet: true,
      qaDecision: QADecision.APPROVED,
      qaNotes: "Dry-run mission cleared configured criteria. Submission remains draft-only because live mode is disabled."
    }
  });

  const submission = await prisma.submission.create({
    data: {
      missionId: mission.id,
      branchName: "bountive/issue-00000-warning-copy",
      commitHash: null,
      commitMessage: "docs: clarify invalid image config warning",
      executionAdapterId: "seeded-demo",
      taskCategory: "documentation",
      prTitle: "docs: clarify invalid image config warning",
      prBody: "## Summary\n- clarify the invalid image config warning copy\n- preserve existing behavior and API surface\n- include dry-run verification notes\n\n## Verification\n- build: passed\n- lint: passed\n- test: skipped",
      prUrl: null,
      changedFiles: JSON.stringify(["docs/messages/image-config.md"]),
      verificationSummary: "Build and lint passed; tests skipped.",
      submissionStatus: SubmissionStatus.DRAFT_READY
    }
  });

  const proof = await prisma.proofRecord.create({
    data: {
      missionId: mission.id,
      identityRecordId: identity.id,
      issueUrl: mission.selectedIssueUrl ?? "",
      repoUrl: "https://github.com/vercel/next.js",
      commitHash: submission.commitHash,
      prUrl: submission.prUrl,
      verificationHash: "0xverificationdemo",
      logHash: "0xloghashdemo"
    }
  });

  const agentManifest = {
    agent_name: "Bountive Operator",
    description: "Autonomous GitHub-first task bounty operator for safe, budget-aware software missions.",
    operator_wallet: identity.operatorWallet,
    network: identity.network,
    identity_reference: identity.identityReference,
    registration_tx_hash: identity.registrationTxHash,
    manifest_uri: identity.manifestUri,
    supported_tools: ["github", "git", "npm", "pnpm", "yarn", "prisma", "sqlite", "postgresql", "redis"],
    supported_task_categories: ["documentation", "developer-experience copy"],
    compute_budget: {
      max_model_calls: 20,
      max_tool_calls: 40,
      max_retries: 2,
      max_changed_files: 8
    },
    guardrails: {
      default_mode: "dry_run",
      live_submission: false,
      destructive_shell_commands_blocked: true,
      allowlisted_live_repos_only: true,
      approval_requires_passing_checks: true
    },
    execution_modes: ["dry_run", "live"],
    proof_format_version: "bountive-proof/v1",
    version: "0.1.0"
  };

  const logs = await prisma.agentEventLog.findMany({
    where: { missionId: mission.id },
    orderBy: { createdAt: "asc" }
  });

  await writeJson(join(ARTIFACTS_DIR, "generated", "agent.json"), agentManifest);
  await writeJson(join(ARTIFACTS_DIR, "generated", "agent_log.json"), logs);
  await writeJson(join(ARTIFACTS_DIR, "missions", `${mission.id}.summary.json`), {
    mission,
    verification,
    submission
  });
  await writeJson(join(ARTIFACTS_DIR, "proof-records", `${proof.id}.json`), proof);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
