import { env } from "@/lib/env";

export type LiveReadinessState = "ready" | "blocked" | "inactive";

export type LiveReadinessCheck = {
  key: string;
  label: string;
  state: LiveReadinessState;
  detail: string;
};

export type LiveSubmissionReadiness = {
  status: LiveReadinessState;
  headline: string;
  summary: string;
  liveRequested: boolean;
  canSubmitLive: boolean;
  allowlistedRepos: string[];
  selectedRepo: string | null;
  selectedRepoAllowed: boolean | null;
  checks: LiveReadinessCheck[];
};

type LiveReadinessInput = {
  mode?: "dry_run" | "live";
  liveSubmissionEnabled?: boolean;
  allowlistedRepos?: string[];
  selectedRepo?: string | null;
};

export function getLiveSubmissionReadiness(input: LiveReadinessInput = {}): LiveSubmissionReadiness {
  const mode = input.mode ?? "dry_run";
  const liveSubmissionEnabled = input.liveSubmissionEnabled ?? false;
  const allowlistedRepos = input.allowlistedRepos ?? env.allowlistedRepos;
  const selectedRepo = input.selectedRepo ?? null;
  const liveRequested = mode === "live" && liveSubmissionEnabled;
  const featureEnabled = env.enableLiveSubmissions;
  const githubTokenConfigured = Boolean(env.githubToken);
  const allowlistConfigured = allowlistedRepos.length > 0;
  const selectedRepoAllowed = selectedRepo ? allowlistedRepos.includes(selectedRepo) : null;

  const checks: LiveReadinessCheck[] = [
    {
      key: "mission-mode",
      label: "Mission mode",
      state: liveRequested ? "ready" : "inactive",
      detail: liveRequested
        ? "This mission is requesting a live draft pull request after verification passes."
        : "Dry-run remains the active mode until both Live mode and live submission are enabled."
    },
    {
      key: "feature-flag",
      label: "Live submission control",
      state: featureEnabled ? "ready" : liveRequested ? "blocked" : "inactive",
      detail: featureEnabled
        ? "ENABLE_LIVE_SUBMISSIONS is enabled."
        : "ENABLE_LIVE_SUBMISSIONS is off, so Bountive will not open real pull requests."
    },
    {
      key: "github-token",
      label: "GitHub credentials",
      state: githubTokenConfigured ? "ready" : liveRequested ? "blocked" : "inactive",
      detail: githubTokenConfigured
        ? "GITHUB_TOKEN is configured for GitHub discovery and submission APIs."
        : "Configure GITHUB_TOKEN with branch, commit, and pull request permissions."
    },
    {
      key: "allowlist",
      label: "Live repo allowlist",
      state: allowlistConfigured ? "ready" : liveRequested ? "blocked" : "inactive",
      detail: allowlistConfigured
        ? `${allowlistedRepos.length} repositories are approved for live mode.`
        : "Add at least one repository to ALLOWLISTED_REPOS before enabling live missions."
    },
    {
      key: "selected-repo",
      label: "Selected repository",
      state: selectedRepo
        ? selectedRepoAllowed
          ? "ready"
          : "blocked"
        : "inactive",
      detail: selectedRepo
        ? selectedRepoAllowed
          ? `${selectedRepo} is approved for live submission.`
          : `${selectedRepo} is not present in the current live allowlist.`
        : "A planned repository will be checked here after candidate selection."
    }
  ];

  const canSubmitLive =
    liveRequested &&
    featureEnabled &&
    githubTokenConfigured &&
    allowlistConfigured &&
    (selectedRepo ? selectedRepoAllowed === true : true);

  if (!liveRequested) {
    return {
      status: "inactive",
      headline: "Dry-run remains the default operating mode.",
      summary: "Bountive will still discover, plan, execute, verify, and prepare submission artifacts, but it will not publish a real pull request.",
      liveRequested,
      canSubmitLive,
      allowlistedRepos,
      selectedRepo,
      selectedRepoAllowed,
      checks
    };
  }

  if (!canSubmitLive) {
    return {
      status: "blocked",
      headline: "Live submission is requested, but the mission is still blocked by guardrails.",
      summary: "Bountive will not publish a real draft pull request until feature controls, credentials, and repository allowlists are all satisfied.",
      liveRequested,
      canSubmitLive,
      allowlistedRepos,
      selectedRepo,
      selectedRepoAllowed,
      checks
    };
  }

  return {
    status: "ready",
    headline: "Live draft pull request submission is available for this mission.",
    summary: "If execution and verification succeed, Bountive can publish a guarded draft pull request to the selected repository.",
    liveRequested,
    canSubmitLive,
    allowlistedRepos,
    selectedRepo,
    selectedRepoAllowed,
    checks
  };
}

export function assertLiveMissionConfigured(input: LiveReadinessInput) {
  const readiness = getLiveSubmissionReadiness(input);

  if (!readiness.liveRequested) {
    return;
  }

  const blockingCheck = readiness.checks.find((check) => check.state === "blocked");

  if (blockingCheck) {
    throw new Error(`${blockingCheck.label}: ${blockingCheck.detail}`);
  }
}
