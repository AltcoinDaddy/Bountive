import type { CandidateStatus, CheckStatus, MissionMode, MissionStage, MissionStatus, QADecision, SubmissionStatus } from "@prisma/client";

export type DiscoveryCandidate = {
  repo: string;
  repoUrl: string;
  cloneUrl?: string;
  issueNumber: number;
  issueTitle: string;
  issueUrl: string;
  issueBody: string;
  labels: string[];
  repoDescription?: string;
  defaultBranch?: string;
  language?: string;
  stars?: number;
};

export type CandidateScore = {
  total: number;
  confidence: number;
  clarity: number;
  complexity: number;
  buildability: number;
  selectedReason?: string;
  rejectedReason?: string;
};

export type GuardrailsSnapshot = {
  mode: "dry_run" | "live";
  liveSubmission: boolean;
  allowlistedRepos: string[];
  maxRetries: number;
  maxModelCalls: number;
  maxToolCalls: number;
  maxChangedFiles: number;
  allowApproveWithFailedChecks: boolean;
  missionTimeoutMs: number;
};

export type MissionInput = {
  title: string;
  mode: "dry_run" | "live";
  labels: string[];
  maxCandidates: number;
  retries: number;
  toolCallLimit: number;
  modelCallLimit: number;
  confidenceThreshold: number;
  allowlistedRepos: string[];
  allowApproveOnFailure: boolean;
  liveSubmissionEnabled: boolean;
};

export type WorkspacePreparation = {
  workspaceRoot: string;
  repositoryPath: string | null;
  cloneSucceeded: boolean;
  repoUrl: string;
  cloneUrl: string;
  branchName: string | null;
  defaultBranch: string | null;
  appliedAdapterId: string | null;
  appliedTaskCategory: string | null;
  availableScripts: {
    build?: string;
    lint?: string;
    test?: string;
  };
  packageManager: "npm" | "pnpm" | "yarn";
  changedFiles: string[];
  executionNotes: string[];
};

export type VerificationResult = {
  installStatus: CheckStatus;
  buildStatus: CheckStatus;
  lintStatus: CheckStatus;
  testStatus: CheckStatus;
  criteriaMet: boolean;
  qaDecision: QADecision;
  qaNotes: string;
  summary: string;
};

export type SubmissionArtifact = {
  branchName: string;
  commitHash: string | null;
  commitMessage: string;
  executionAdapterId: string | null;
  taskCategory: string | null;
  prTitle: string;
  prBody: string;
  prUrl: string | null;
  submissionStatus: SubmissionStatus;
  changedFiles: string[];
  verificationSummary: string;
};

export type StageSummary = {
  missionStatus: MissionStatus;
  stage: MissionStage;
  retryIndex: number;
  summary: string;
};

export type MissionSnapshot = {
  missionId: string;
  title: string;
  mode: MissionMode;
  currentStage: MissionStage;
  status: MissionStatus;
  selectedRepo: string | null;
  selectedIssueUrl: string | null;
  retriesUsed: number;
  modelCallsUsed: number;
  toolCallsUsed: number;
  durationMs: number;
  candidateTasksScanned: number;
  changedFilesCount: number;
};

export type CandidateRow = {
  id: string;
  repo: string;
  issueTitle: string;
  issueUrl: string;
  labels: string[];
  score: number;
  confidence: number;
  status: CandidateStatus;
  selectedReason: string | null;
  rejectedReason: string | null;
};

export type AgentManifest = {
  agent_name: string;
  description: string;
  operator_wallet: string;
  network: string;
  identity_reference: string;
  registration_tx_hash: string | null;
  manifest_uri: string | null;
  supported_tools: string[];
  supported_task_categories: string[];
  compute_budget: {
    max_model_calls: number;
    max_tool_calls: number;
    max_retries: number;
    max_changed_files: number;
  };
  guardrails: {
    default_mode: string;
    live_submission: boolean;
    destructive_shell_commands_blocked: boolean;
    allowlisted_live_repos_only: boolean;
    approval_requires_passing_checks: boolean;
  };
  execution_modes: string[];
  proof_format_version: string;
  version: string;
};
