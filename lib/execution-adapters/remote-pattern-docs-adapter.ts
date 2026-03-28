import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { listChangedFiles } from "@/lib/repo-workspace";
import type { ExecutionAdapter } from "@/lib/execution-adapters/types";

const DEMO_FIXTURE_REPO = "bountive-fixtures/demo-task-repo";
const DEMO_DOC_PATH = "docs/remote-pattern-warning.md";
const BEFORE_COPY = [
  "When the remote pattern is invalid, the warning currently says the pattern does",
  "not match the configuration. It does not identify which field is malformed or",
  "show a concrete example."
].join("\n");

const AFTER_COPY = [
  "When the remote pattern is invalid, the warning should name the malformed field directly.",
  "It should explain whether the hostname, pathname, or protocol is causing the mismatch,",
  "and it should include Example: images.example.com/assets/hero.png so operators can compare",
  "their config against a valid shape immediately.",
  "",
  "Developers should be able to compare the invalid and valid forms at a glance."
].join("\n");

export const remotePatternDocsAdapter: ExecutionAdapter = {
  id: "remote-pattern-docs",
  label: "Remote pattern docs patch",
  taskCategory: "documentation",
  match(candidate, workspace) {
    if (!workspace.repositoryPath) {
      return {
        matches: false,
        reason: "Repository path is unavailable, so documentation patching cannot start."
      };
    }

    return {
      matches: candidate.repo === DEMO_FIXTURE_REPO,
      reason: candidate.repo === DEMO_FIXTURE_REPO
        ? "Matched the local remote-pattern documentation fixture."
        : "Repository does not match the remote-pattern documentation fixture."
    };
  },
  async apply(_candidate, workspace) {
    const targetPath = join(workspace.repositoryPath!, DEMO_DOC_PATH);
    const existing = await readFile(targetPath, "utf8");

    const updated = existing.includes(AFTER_COPY)
      ? existing
      : existing.includes(BEFORE_COPY)
        ? existing.replace(BEFORE_COPY, AFTER_COPY)
        : `${existing.trim()}\n\n${AFTER_COPY}\n`;

    await writeFile(targetPath, updated, "utf8");

    return {
      changedFiles: await listChangedFiles(workspace.repositoryPath!),
      notes: ["Applied deterministic documentation patch for the local remote-pattern fixture repository."],
      summary: "Documentation warning copy updated with explicit malformed-field guidance and example content.",
      taskCategory: "documentation"
    };
  }
};
