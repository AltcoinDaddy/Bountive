const truthyValues = new Set(["1", "true", "yes", "on"]);

function readNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function readBoolean(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  return truthyValues.has(value.toLowerCase());
}

function readList(value: string | undefined, fallback: string[]) {
  if (!value) {
    return fallback;
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  githubToken: process.env.GITHUB_TOKEN ?? "",
  githubOwner: process.env.GITHUB_OWNER ?? "",
  allowlistedRepos: readList(process.env.ALLOWLISTED_REPOS, ["vercel/next.js", "tailwindlabs/tailwindcss"]),
  defaultMissionMode: process.env.DEFAULT_MISSION_MODE === "live" ? "live" : "dry_run",
  enableLiveSubmissions: readBoolean(process.env.ENABLE_LIVE_SUBMISSIONS, false),
  allowApproveWithFailedChecks: readBoolean(process.env.ALLOW_APPROVE_WITH_FAILED_CHECKS, false),
  operatorWallet: process.env.BOUNTIVE_OPERATOR_WALLET ?? "0x0000000000000000000000000000000000000000",
  network: process.env.BOUNTIVE_NETWORK ?? "base-sepolia",
  identityReference: process.env.BOUNTIVE_IDENTITY_REFERENCE ?? "bountive-operator-dev",
  registrationTxHash: process.env.BOUNTIVE_REGISTRATION_TX_HASH ?? "",
  manifestUri: process.env.BOUNTIVE_MANIFEST_URI ?? "artifacts/generated/agent.json",
  maxModelCalls: readNumber(process.env.MAX_MODEL_CALLS, 20),
  maxToolCalls: readNumber(process.env.MAX_TOOL_CALLS, 40),
  maxRetries: readNumber(process.env.MAX_RETRIES, 2),
  maxChangedFiles: readNumber(process.env.MAX_CHANGED_FILES, 8),
  maxCandidatesScanned: readNumber(process.env.MAX_CANDIDATES_SCANNED, 12),
  missionTimeoutMs: readNumber(process.env.MISSION_TIMEOUT_MS, 15 * 60 * 1000)
} as const;
