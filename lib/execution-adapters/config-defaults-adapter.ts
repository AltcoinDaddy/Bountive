import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { listChangedFiles } from "@/lib/repo-workspace";
import type { ExecutionAdapter } from "@/lib/execution-adapters/types";

const CONFIG_FIXTURE_REPO = "bountive-fixtures/demo-config-repo";
const TARGET_PATH = "config/bountive.config.json";

export const configDefaultsAdapter: ExecutionAdapter = {
  id: "config-defaults",
  label: "Mission config defaults patch",
  taskCategory: "configuration",
  match(candidate, workspace) {
    if (!workspace.repositoryPath) {
      return {
        matches: false,
        reason: "Repository path is unavailable, so config repair cannot start."
      };
    }

    return {
      matches: candidate.repo === CONFIG_FIXTURE_REPO,
      reason: candidate.repo === CONFIG_FIXTURE_REPO
        ? "Matched the local mission-config fixture."
        : "Repository does not match the mission-config fixture."
    };
  },
  async apply(_candidate, workspace) {
    const targetPath = join(workspace.repositoryPath!, TARGET_PATH);
    const config = JSON.parse(await readFile(targetPath, "utf8")) as Record<string, unknown>;

    config.dryRun = true;
    config.retryLimit = 2;
    config.maxChangedFiles = 8;

    await writeFile(targetPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

    return {
      changedFiles: await listChangedFiles(workspace.repositoryPath!),
      notes: ["Applied deterministic mission-config defaults patch for the local configuration fixture repository."],
      summary: "Mission config defaults updated to an explicit dry-run posture with stable retry and patch-size limits.",
      taskCategory: "configuration"
    };
  }
};
