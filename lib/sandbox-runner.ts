import { spawn } from "node:child_process";
import { relative } from "node:path";
import { env } from "@/lib/env";
import { assertSafeCommand } from "@/lib/safety-engine";

const OUTPUT_LIMIT = 12_000;
const DEFAULT_COMMAND_TIMEOUT_MS = 2 * 60 * 1000;
const secretPatterns = [/token/i, /secret/i, /key/i, /password/i];
const allowedCommands = new Set(["git", "npm", "pnpm", "yarn", "node"]);

export type SandboxPolicy = {
  profile: "local-guarded" | "docker";
  networkAccess: "restricted" | "none";
  filesystemScope: "workspace-only";
  allowedCommands: string[];
  timeoutMs: number;
  memoryMb: number;
  cpuLimit: string;
};

export type SandboxedCommandResult = {
  code: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

function truncateOutput(content: string) {
  if (content.length <= OUTPUT_LIMIT) {
    return content;
  }

  return `${content.slice(0, OUTPUT_LIMIT)}\n...[truncated]`;
}

function sanitizeEnvironment() {
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !secretPatterns.some((pattern) => pattern.test(key)))
  ) as NodeJS.ProcessEnv;
}

async function spawnCommand(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
  runtimeEnv?: NodeJS.ProcessEnv
): Promise<SandboxedCommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: runtimeEnv
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({
        code: timedOut ? 124 : code ?? 1,
        stdout: truncateOutput(stdout.trim()),
        stderr: truncateOutput(stderr.trim()),
        timedOut
      });
    });
  });
}

function buildDockerArgs(command: string, args: string[], cwd: string) {
  const relativeCwd = relative(process.cwd(), cwd) || ".";

  return [
    "run",
    "--rm",
    "--network",
    "none",
    "--memory",
    `${env.sandboxMemoryMb}m`,
    "--cpus",
    env.sandboxCpuLimit,
    "--workdir",
    `/workspace/${relativeCwd}`,
    "-v",
    `${process.cwd()}:/workspace`,
    "-e",
    "CI=1",
    "-e",
    "GIT_TERMINAL_PROMPT=0",
    env.dockerSandboxImage,
    "sh",
    "-lc",
    `${command} ${args.map((value) => `'${value.replaceAll("'", `'\\''`)}'`).join(" ")}`
  ];
}

export function getSandboxPolicy(): SandboxPolicy {
  return {
    profile: env.sandboxProfile === "docker" ? "docker" : "local-guarded",
    networkAccess: env.sandboxProfile === "docker" ? "none" : "restricted",
    filesystemScope: "workspace-only",
    allowedCommands: Array.from(allowedCommands),
    timeoutMs: DEFAULT_COMMAND_TIMEOUT_MS,
    memoryMb: env.sandboxMemoryMb,
    cpuLimit: env.sandboxCpuLimit
  };
}

export async function runSandboxedCommand(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs = DEFAULT_COMMAND_TIMEOUT_MS
): Promise<SandboxedCommandResult> {
  assertSafeCommand([command, ...args].join(" "));

  if (!allowedCommands.has(command)) {
    throw new Error(`Sandbox policy blocked command "${command}".`);
  }

  const runtimeEnv = {
    ...sanitizeEnvironment(),
    CI: "1",
    GIT_TERMINAL_PROMPT: "0"
  } satisfies NodeJS.ProcessEnv;

  if (env.sandboxProfile === "docker") {
    return spawnCommand("docker", buildDockerArgs(command, args, cwd), cwd, timeoutMs, runtimeEnv);
  }

  return spawnCommand(command, args, cwd, timeoutMs, runtimeEnv);
}
