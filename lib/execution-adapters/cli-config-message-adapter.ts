import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { listChangedFiles } from "@/lib/repo-workspace";
import type { ExecutionAdapter } from "@/lib/execution-adapters/types";

const CLI_FIXTURE_REPO = "bountive-fixtures/demo-cli-repo";
const TARGET_PATH = "src/messages/missing-config.txt";
const BEFORE_COPY = "Missing configuration file.";
const AFTER_COPY = [
  "Missing configuration file.",
  "Expected: bountive.config.json in the project root.",
  "Create the file or run `bountive init` before invoking the CLI again."
].join("\n");

export const cliConfigMessageAdapter: ExecutionAdapter = {
  id: "cli-config-message",
  label: "CLI missing-config message patch",
  taskCategory: "developer-experience copy",
  match(candidate, workspace) {
    if (!workspace.repositoryPath) {
      return {
        matches: false,
        reason: "Repository path is unavailable, so CLI message patching cannot start."
      };
    }

    return {
      matches: candidate.repo === CLI_FIXTURE_REPO,
      reason: candidate.repo === CLI_FIXTURE_REPO
        ? "Matched the local CLI missing-config fixture."
        : "Repository does not match the CLI missing-config fixture."
    };
  },
  async apply(_candidate, workspace) {
    const targetPath = join(workspace.repositoryPath!, TARGET_PATH);
    const existing = await readFile(targetPath, "utf8");
    const updated = existing.includes(AFTER_COPY)
      ? existing
      : existing.replace(BEFORE_COPY, AFTER_COPY);

    await writeFile(targetPath, updated, "utf8");

    return {
      changedFiles: await listChangedFiles(workspace.repositoryPath!),
      notes: ["Applied deterministic CLI error-message patch for the local config fixture repository."],
      summary: "CLI missing-config copy updated with an actionable file path and recovery step.",
      taskCategory: "developer-experience copy"
    };
  }
};
