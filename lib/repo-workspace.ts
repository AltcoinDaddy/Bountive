import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { assertSafeCommand } from "@/lib/safety-engine";
import { workspacePath } from "@/lib/artifacts";
import type { DiscoveryCandidate, WorkspacePreparation } from "@/lib/types";

type SafeExecResult = {
  code: number;
  stdout: string;
  stderr: string;
};

async function runCommand(command: string, args: string[], cwd: string): Promise<SafeExecResult> {
  assertSafeCommand([command, ...args].join(" "));

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: process.env });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr
      });
    });
  });
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

export async function prepareWorkspace(missionId: string, candidate: DiscoveryCandidate): Promise<WorkspacePreparation> {
  const root = workspacePath(missionId);
  const repoPath = join(root, "repo");

  await mkdir(root, { recursive: true });

  const clone = await runCommand("git", ["clone", "--depth", "1", candidate.repoUrl, repoPath], root).catch((error) => ({
    code: 1,
    stdout: "",
    stderr: error instanceof Error ? error.message : "Unknown clone failure"
  }));

  if (clone.code !== 0) {
    return {
      workspaceRoot: root,
      repositoryPath: null,
      cloneSucceeded: false,
      repoUrl: candidate.repoUrl,
      availableScripts: {},
      packageManager: "npm",
      changedFiles: [],
      executionNotes: [
        "Repository clone failed in the current environment.",
        clone.stderr || "No stderr output captured."
      ]
    };
  }

  const packageJsonPath = join(repoPath, "package.json");
  let scripts: Record<string, string> = {};
  let packageManager: "npm" | "pnpm" | "yarn" = "npm";

  try {
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as { scripts?: Record<string, string>; packageManager?: string };
    scripts = packageJson.scripts ?? {};
    packageManager = packageJson.packageManager?.startsWith("pnpm")
      ? "pnpm"
      : packageJson.packageManager?.startsWith("yarn")
        ? "yarn"
        : "npm";
  } catch {
    const locks = await runCommand("find", [repoPath, "-maxdepth", "2", "-type", "f"], root);
    packageManager = detectPackageManager(locks.stdout.split("\n").filter(Boolean).map((line) => line.split("/").pop() ?? ""));
  }

  return {
    workspaceRoot: root,
    repositoryPath: repoPath,
    cloneSucceeded: true,
    repoUrl: candidate.repoUrl,
    availableScripts: {
      build: scripts.build,
      lint: scripts.lint,
      test: scripts.test
    },
    packageManager,
    changedFiles: [],
    executionNotes: [
      "Workspace prepared successfully.",
      "Developer agent remains conservative in MVP mode and does not mutate repositories without a deterministic high-confidence patch strategy."
    ]
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
