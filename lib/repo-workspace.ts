import { access, mkdir, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { CheckStatus } from "@prisma/client";
import { workspacePath } from "@/lib/artifacts";
import { getSandboxPolicy, runSandboxedCommand } from "@/lib/sandbox-runner";
import { slugify } from "@/lib/utils";
import type { DiscoveryCandidate, WorkspacePreparation } from "@/lib/types";

type SafeExecResult = {
  code: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

type CommandOptions = {
  timeoutMs?: number;
};

type DependencyInstallResult = {
  status: CheckStatus;
  command: string | null;
  note: string;
};

const DEFAULT_COMMAND_TIMEOUT_MS = 2 * 60 * 1000;
const INSTALL_COMMAND_TIMEOUT_MS = 5 * 60 * 1000;
async function pathExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function detectPackageManager(lockfiles: string[]) {
  if (lockfiles.includes("pnpm-lock.yaml")) {
    return "pnpm" as const;
  }

  if (lockfiles.includes("yarn.lock")) {
    return "yarn" as const;
  }

  return "npm" as const;
}

export async function runCommand(command: string, args: string[], cwd: string, options: CommandOptions = {}): Promise<SafeExecResult> {
  return runSandboxedCommand(command, args, cwd, options.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS);
}

export async function listChangedFiles(repositoryPath: string) {
  const result = await runCommand("git", ["status", "--short"], repositoryPath);

  if (result.code !== 0) {
    return [];
  }

  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[A-Z?]{1,2}\s+/, "").trim());
}

async function detectScripts(repositoryPath: string) {
  const packageJsonPath = join(repositoryPath, "package.json");

  if (!(await pathExists(packageJsonPath))) {
    return {
      availableScripts: {},
      packageManager: detectPackageManager(await readdir(repositoryPath).catch(() => []))
    } as const;
  }

  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
    packageManager?: string;
  };

  const packageManager = packageJson.packageManager?.startsWith("pnpm")
    ? "pnpm"
    : packageJson.packageManager?.startsWith("yarn")
      ? "yarn"
      : detectPackageManager(await readdir(repositoryPath).catch(() => []));

  return {
    availableScripts: {
      build: packageJson.scripts?.build,
      lint: packageJson.scripts?.lint,
      test: packageJson.scripts?.test
    },
    packageManager
  } as const;
}

export async function prepareWorkspace(missionId: string, candidate: DiscoveryCandidate, retryIndex = 0): Promise<WorkspacePreparation> {
  const root = join(workspacePath(missionId), `attempt-${retryIndex}`);
  const repoPath = join(root, "repo");
  const cloneSource = candidate.cloneUrl ?? candidate.repoUrl;
  const branchName = `bountive/${slugify(candidate.issueTitle)}`;
  const sandboxPolicy = getSandboxPolicy();

  await mkdir(root, { recursive: true });

  const clone = await runCommand("git", ["clone", "--depth", "1", cloneSource, repoPath], root).catch((error) => ({
    code: 1,
    stdout: "",
    stderr: error instanceof Error ? error.message : "Unknown clone failure",
    timedOut: false
  }));

  if (clone.code !== 0) {
    return {
      workspaceRoot: root,
      repositoryPath: null,
      cloneSucceeded: false,
      repoUrl: candidate.repoUrl,
      cloneUrl: cloneSource,
      branchName: null,
      defaultBranch: candidate.defaultBranch ?? null,
      appliedAdapterId: null,
      appliedTaskCategory: null,
      availableScripts: {},
      packageManager: "npm",
      changedFiles: [],
      executionNotes: [
        "Repository clone failed in the current environment.",
        `Sandbox profile: ${sandboxPolicy.profile} with ${sandboxPolicy.networkAccess} network access.`,
        clone.stderr || "No stderr output captured."
      ]
    };
  }

  const checkout = await runCommand("git", ["checkout", "-b", branchName], repoPath).catch((error) => ({
    code: 1,
    stdout: "",
    stderr: error instanceof Error ? error.message : "Unknown branch checkout failure",
    timedOut: false
  }));

  const { availableScripts, packageManager } = await detectScripts(repoPath);

  return {
    workspaceRoot: root,
    repositoryPath: repoPath,
    cloneSucceeded: true,
    repoUrl: candidate.repoUrl,
    cloneUrl: cloneSource,
    branchName,
    defaultBranch: candidate.defaultBranch ?? null,
    appliedAdapterId: null,
    appliedTaskCategory: null,
    availableScripts,
    packageManager,
    changedFiles: await listChangedFiles(repoPath),
      executionNotes: [
      "Workspace prepared successfully.",
      `Sandbox profile: ${sandboxPolicy.profile} with ${sandboxPolicy.networkAccess} network access and ${sandboxPolicy.filesystemScope} filesystem scope.`,
      checkout.code === 0
        ? `Created isolated branch ${branchName}.`
        : `Workspace branch setup failed: ${checkout.stderr || "unknown branch error"}`,
      "Developer execution remains strategy-driven and only mutates repositories when a deterministic patch rule matches the selected task."
    ]
  };
}

function getInstallCommand(repositoryPath: string, packageManager: "npm" | "pnpm" | "yarn") {
  const packageLockPath = join(repositoryPath, "package-lock.json");
  const detectNpmStrategy = async () => {
    const hasLockfile = await pathExists(packageLockPath);
    const changedFiles = await listChangedFiles(repositoryPath);
    const packageManifestChanged = changedFiles.includes("package.json") || changedFiles.includes("package-lock.json");

    return {
      command: "npm",
      args: hasLockfile
        ? packageManifestChanged
          ? ["install", "--ignore-scripts", "--no-audit", "--no-fund"]
          : ["ci", "--ignore-scripts", "--no-audit", "--no-fund"]
        : ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--package-lock=false"]
    } as const;
  };

  if (packageManager === "pnpm") {
    return {
      command: "pnpm",
      args: ["install", "--ignore-scripts"]
    } as const;
  }

  if (packageManager === "yarn") {
    return {
      command: "yarn",
      args: ["install", "--ignore-scripts"]
    } as const;
  }

  return detectNpmStrategy();
}

export async function installWorkspaceDependencies(workspace: WorkspacePreparation): Promise<DependencyInstallResult> {
  if (!workspace.cloneSucceeded || !workspace.repositoryPath) {
    return {
      status: CheckStatus.FAILED,
      command: null,
      note: "Dependency installation was blocked because the repository clone did not succeed."
    };
  }

  const packageJsonPath = join(workspace.repositoryPath, "package.json");

  if (!(await pathExists(packageJsonPath))) {
    return {
      status: CheckStatus.SKIPPED,
      command: null,
      note: "Dependency installation skipped because the repository does not define a package.json."
    };
  }

  if (!workspace.availableScripts.build && !workspace.availableScripts.lint && !workspace.availableScripts.test) {
    return {
      status: CheckStatus.SKIPPED,
      command: null,
      note: "Dependency installation skipped because no build, lint, or test scripts were detected."
    };
  }

  const install = await getInstallCommand(workspace.repositoryPath, workspace.packageManager);
  const result = await runCommand(install.command, [...install.args], workspace.repositoryPath, {
    timeoutMs: INSTALL_COMMAND_TIMEOUT_MS
  }).catch((error) => ({
    code: 1,
    stdout: "",
    stderr: error instanceof Error ? error.message : "Unknown install failure",
    timedOut: false
  }));

  if (result.code !== 0) {
    return {
      status: CheckStatus.FAILED,
      command: [install.command, ...install.args].join(" "),
      note: result.timedOut
        ? "Dependency installation timed out before verification could begin."
        : `Dependency installation failed: ${result.stderr || result.stdout || "unknown install error"}`
    };
  }

  return {
    status: CheckStatus.PASSED,
    command: [install.command, ...install.args].join(" "),
    note: "Dependencies installed successfully in guarded mode with lifecycle scripts disabled."
  };
}

export async function executeProjectScript(
  repositoryPath: string,
  packageManager: "npm" | "pnpm" | "yarn",
  scriptName: "build" | "lint" | "test"
) {
  const command = packageManager;
  const args = packageManager === "npm" ? ["run", scriptName] : [scriptName];
  return runCommand(command, args, repositoryPath);
}

export async function createLocalCommit(repositoryPath: string, commitMessage: string) {
  const changedFiles = await listChangedFiles(repositoryPath);

  if (changedFiles.length === 0) {
    return {
      changedFiles,
      commitHash: null
    };
  }

  await runCommand("git", ["config", "user.email", "operator@bountive.local"], repositoryPath);
  await runCommand("git", ["config", "user.name", "Bountive Operator"], repositoryPath);

  const addResult = await runCommand("git", ["add", "--all"], repositoryPath);

  if (addResult.code !== 0) {
    return {
      changedFiles,
      commitHash: null
    };
  }

  const commitResult = await runCommand("git", ["commit", "-m", commitMessage], repositoryPath).catch((error) => ({
    code: 1,
    stdout: "",
    stderr: error instanceof Error ? error.message : "Unknown commit failure",
    timedOut: false
  }));

  if (commitResult.code !== 0) {
    return {
      changedFiles,
      commitHash: null
    };
  }

  const hashResult = await runCommand("git", ["rev-parse", "HEAD"], repositoryPath);

  return {
    changedFiles,
    commitHash: hashResult.code === 0 ? hashResult.stdout.split("\n")[0] ?? null : null
  };
}

export async function readWorkspaceTextFiles(repositoryPath: string, changedFiles: string[]) {
  return Promise.all(
    changedFiles.map(async (filePath) => ({
      path: filePath,
      content: await readFile(join(repositoryPath, filePath), "utf8")
    }))
  );
}
