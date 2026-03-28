import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { listChangedFiles } from "@/lib/repo-workspace";
import type { ExecutionAdapter } from "@/lib/execution-adapters/types";

const TEST_FIXTURE_REPO = "bountive-fixtures/demo-test-repo";
const TARGET_PATH = "test/fixtures/verification-summary.txt";
const BEFORE_COPY = "build=passed, lint=passed, test=passed";
const AFTER_COPY = "install=passed, build=passed, lint=passed, test=passed";

export const verificationSummaryTestAdapter: ExecutionAdapter = {
  id: "verification-summary-test",
  label: "Verification summary test fixture patch",
  taskCategory: "tests",
  match(candidate, workspace) {
    if (!workspace.repositoryPath) {
      return {
        matches: false,
        reason: "Repository path is unavailable, so test-fixture repair cannot start."
      };
    }

    return {
      matches: candidate.repo === TEST_FIXTURE_REPO,
      reason: candidate.repo === TEST_FIXTURE_REPO
        ? "Matched the local verification-summary test fixture."
        : "Repository does not match the verification-summary test fixture."
    };
  },
  async apply(_candidate, workspace) {
    const targetPath = join(workspace.repositoryPath!, TARGET_PATH);
    const content = await readFile(targetPath, "utf8");
    const updated = content.includes(AFTER_COPY) ? content : content.replace(BEFORE_COPY, AFTER_COPY);

    await writeFile(targetPath, updated, "utf8");

    return {
      changedFiles: await listChangedFiles(workspace.repositoryPath!),
      notes: ["Applied deterministic verification-summary fixture patch for the local test fixture repository."],
      summary: "Verification summary expectation updated to include install status as the leading segment.",
      taskCategory: "tests"
    };
  }
};
