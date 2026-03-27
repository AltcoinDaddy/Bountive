import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

const ROOT = process.cwd();
const ARTIFACT_ROOT = join(ROOT, "artifacts");

export async function ensureArtifactDirectories() {
  await mkdir(join(ARTIFACT_ROOT, "generated"), { recursive: true });
  await mkdir(join(ARTIFACT_ROOT, "missions"), { recursive: true });
  await mkdir(join(ARTIFACT_ROOT, "proof-records"), { recursive: true });
  await mkdir(join(ARTIFACT_ROOT, "workspaces"), { recursive: true });
}

export async function writeArtifact(relativePath: string, data: unknown) {
  await ensureArtifactDirectories();
  const path = join(ARTIFACT_ROOT, relativePath);
  const content = typeof data === "string" ? `${data}\n` : `${JSON.stringify(data, null, 2)}\n`;
  const folder = path.split("/").slice(0, -1).join("/");
  await mkdir(folder, { recursive: true });
  await writeFile(path, content, "utf8");
  return path;
}

export async function appendGeneratedAgentLog(entry: unknown) {
  const target = join(ARTIFACT_ROOT, "generated", "agent_log.json");

  try {
    const existing = JSON.parse(await readFile(target, "utf8")) as unknown[];
    existing.push(entry);
    await writeFile(target, `${JSON.stringify(existing, null, 2)}\n`, "utf8");
  } catch {
    await writeFile(target, `${JSON.stringify([entry], null, 2)}\n`, "utf8");
  }
}

export function hashPayload(data: unknown) {
  const content = typeof data === "string" ? data : JSON.stringify(data);
  return `0x${createHash("sha256").update(content).digest("hex")}`;
}

export function workspacePath(missionId: string) {
  return join(ARTIFACT_ROOT, "workspaces", missionId);
}
