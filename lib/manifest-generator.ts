import type { IdentityRecord } from "@prisma/client";
import { getRegisteredExecutionAdapters } from "@/lib/execution-adapters";
import { env } from "@/lib/env";
import type { AgentManifest } from "@/lib/types";

export function buildAgentManifest(identity: IdentityRecord): AgentManifest {
  const supportedTaskCategories = Array.from(new Set(getRegisteredExecutionAdapters().map((adapter) => adapter.taskCategory)));

  return {
    agent_name: identity.agentName,
    description: "Autonomous GitHub-first task bounty operator for safe, budget-aware software missions.",
    operator_wallet: identity.operatorWallet,
    network: identity.network,
    identity_reference: identity.identityReference,
    registration_tx_hash: identity.registrationTxHash,
    manifest_uri: identity.manifestUri,
    supported_tools: ["github", "git", "npm", "pnpm", "yarn", "prisma", "sqlite", "postgresql", "redis"],
    supported_task_categories: supportedTaskCategories,
    compute_budget: {
      max_model_calls: env.maxModelCalls,
      max_tool_calls: env.maxToolCalls,
      max_retries: env.maxRetries,
      max_changed_files: env.maxChangedFiles
    },
    guardrails: {
      default_mode: env.defaultMissionMode,
      live_submission: env.enableLiveSubmissions,
      destructive_shell_commands_blocked: true,
      allowlisted_live_repos_only: true,
      approval_requires_passing_checks: !env.allowApproveWithFailedChecks
    },
    execution_modes: ["dry_run", "live"],
    proof_format_version: "bountive-proof/v1",
    version: "0.1.0"
  };
}
