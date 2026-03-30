import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { listChangedFiles } from "@/lib/repo-workspace";
import type { ExecutionAdapter } from "@/lib/execution-adapters/types";

const COMMITLINT_CONFIG_FILE = "commitlint.config.cjs";
const MAX_PACKAGE_JSON_BYTES = 64_000;

type PackageJsonDocument = {
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

async function pathExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function mentionsCommitlint(text: string) {
  const normalized = text.toLowerCase();
  return (
    normalized.includes("commit message lint") ||
    normalized.includes("commitlint") ||
    normalized.includes("conventional commit")
  );
}

export const commitlintConventionalAdapter: ExecutionAdapter = {
  id: "commitlint-conventional",
  label: "Commitlint conventional commits setup",
  taskCategory: "configuration",
  assessCandidate(candidate) {
    const combined = `${candidate.issueTitle}\n${candidate.issueBody}`;

    if (!mentionsCommitlint(combined)) {
      return {
        supported: false,
        reason: "Issue does not request conventional commit message linting."
      };
    }

    return {
      supported: true,
      reason: "Issue title/body match the bounded commitlint setup adapter."
    };
  },
  async match(candidate, workspace) {
    if (!workspace.repositoryPath) {
      return {
        matches: false,
        reason: "Repository path is unavailable, so commitlint setup cannot start."
      };
    }

    const combined = `${candidate.issueTitle}\n${candidate.issueBody}`;

    if (!mentionsCommitlint(combined)) {
      return {
        matches: false,
        reason: "Issue does not request conventional commit linting."
      };
    }

    const packageJsonPath = join(workspace.repositoryPath, "package.json");

    if (!(await pathExists(packageJsonPath))) {
      return {
        matches: false,
        reason: "Repository does not define a package.json, so commitlint setup is out of scope."
      };
    }

    const configPath = join(workspace.repositoryPath, COMMITLINT_CONFIG_FILE);

    if (await pathExists(configPath)) {
      return {
        matches: false,
        reason: "Repository already contains a commitlint config file."
      };
    }

    return {
      matches: true,
      reason: "Repository has a package.json and no existing commitlint config."
    };
  },
  async apply(_candidate, workspace) {
    const packageJsonPath = join(workspace.repositoryPath!, "package.json");
    const configPath = join(workspace.repositoryPath!, COMMITLINT_CONFIG_FILE);
    const packageJsonSource = await readFile(packageJsonPath, "utf8");

    if (Buffer.byteLength(packageJsonSource, "utf8") > MAX_PACKAGE_JSON_BYTES) {
      throw new Error("package.json exceeds the safe size limit for bounded commitlint setup.");
    }

    const packageJson = JSON.parse(packageJsonSource) as PackageJsonDocument;

    packageJson.scripts = {
      ...(packageJson.scripts ?? {}),
      commitlint: packageJson.scripts?.commitlint ?? "commitlint --from=HEAD~1 --to=HEAD"
    };

    packageJson.devDependencies = {
      ...(packageJson.devDependencies ?? {}),
      "@commitlint/cli": packageJson.devDependencies?.["@commitlint/cli"] ?? "^19.8.0",
      "@commitlint/config-conventional": packageJson.devDependencies?.["@commitlint/config-conventional"] ?? "^19.8.0"
    };

    await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
    await writeFile(
      configPath,
      "module.exports = {\n  extends: ['@commitlint/config-conventional']\n};\n",
      "utf8"
    );

    return {
      changedFiles: await listChangedFiles(workspace.repositoryPath!),
      notes: [
        "Applied bounded conventional commit linting setup.",
        "Added commitlint config and package.json entries without modifying install scripts or git hooks."
      ],
      summary: "Commitlint configuration added for conventional commit enforcement.",
      taskCategory: "configuration"
    };
  }
};
