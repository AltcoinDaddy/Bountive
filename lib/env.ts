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
  databaseProvider: process.env.DATABASE_PROVIDER ?? "sqlite",
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  githubToken: process.env.GITHUB_TOKEN ?? "",
  githubOwner: process.env.GITHUB_OWNER ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  authMode: process.env.AUTH_MODE ?? "better-auth",
  betterAuthSecret: process.env.BETTER_AUTH_SECRET ?? "bountive-local-better-auth-secret-please-change",
  betterAuthUrl: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  betterAuthTrustedOrigins: readList(process.env.BETTER_AUTH_TRUSTED_ORIGINS, []),
  sandboxProfile: process.env.SANDBOX_PROFILE === "docker" ? "docker" : "local",
  dockerSandboxImage: process.env.DOCKER_SANDBOX_IMAGE ?? "node:24-bookworm-slim",
  sandboxMemoryMb: readNumber(process.env.SANDBOX_MEMORY_MB, 1024),
  sandboxCpuLimit: process.env.SANDBOX_CPU_LIMIT ?? "1.5",
  allowlistedRepos: readList(process.env.ALLOWLISTED_REPOS, []),
  defaultMissionMode: process.env.DEFAULT_MISSION_MODE === "live" ? "live" : "dry_run",
  enableLiveSubmissions: readBoolean(process.env.ENABLE_LIVE_SUBMISSIONS, false),
  allowApproveWithFailedChecks: readBoolean(process.env.ALLOW_APPROVE_WITH_FAILED_CHECKS, false),
  operatorWallet: process.env.BOUNTIVE_OPERATOR_WALLET ?? "0x0000000000000000000000000000000000000000",
  operatorEmail: process.env.BOUNTIVE_OPERATOR_EMAIL ?? "operator@bountive.local",
  network: process.env.BOUNTIVE_NETWORK ?? "base-sepolia",
  identityReference: process.env.BOUNTIVE_IDENTITY_REFERENCE ?? "bountive-operator-dev",
  registrationTxHash: process.env.BOUNTIVE_REGISTRATION_TX_HASH ?? "",
  manifestUri: process.env.BOUNTIVE_MANIFEST_URI ?? "artifacts/generated/agent.json",
  proofSigningKey: process.env.BOUNTIVE_PROOF_SIGNING_KEY ?? "",
  enableProofPublishing: readBoolean(process.env.ENABLE_PROOF_PUBLISHING, false),
  chainRpcUrl: process.env.BOUNTIVE_CHAIN_RPC_URL ?? "",
  proofRegistryAddress: process.env.BOUNTIVE_PROOF_REGISTRY_ADDRESS ?? "",
  maxModelCalls: readNumber(process.env.MAX_MODEL_CALLS, 20),
  maxToolCalls: readNumber(process.env.MAX_TOOL_CALLS, 40),
  maxRetries: readNumber(process.env.MAX_RETRIES, 2),
  maxChangedFiles: readNumber(process.env.MAX_CHANGED_FILES, 8),
  maxCandidatesScanned: readNumber(process.env.MAX_CANDIDATES_SCANNED, 12),
  missionTimeoutMs: readNumber(process.env.MISSION_TIMEOUT_MS, 15 * 60 * 1000),
  missionWorkerPollMs: readNumber(process.env.MISSION_WORKER_POLL_MS, 3000),
  missionWorkerLeaseMs: readNumber(process.env.MISSION_WORKER_LEASE_MS, 60 * 1000),
  missionWorkerConcurrency: readNumber(process.env.MISSION_WORKER_CONCURRENCY, 1)
} as const;
