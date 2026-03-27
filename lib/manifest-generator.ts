import type { IdentityRecord } from "@prisma/client";
import { env } from "@/lib/env";
import type { AgentManifest } from "@/lib/types";

export function buildAgentManifest(identity: IdentityRecord): AgentManifest {
  return {
    agent_name: identity.agentName,
    description: "Autonomous GitHub-first task bounty operator for safe, budget-aware software missions.",
    operator_wallet: identity.operatorWallet,
    identity_reference: identity.identityReference,
    supported_tools: ["github", "git", "npm", "pnpm", "yarn", "prisma", "sqlite"],
    supported_task_categories: ["bug", "documentation", "tests", "small refactors"],
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
    version: "0.1.0"
  };
}
