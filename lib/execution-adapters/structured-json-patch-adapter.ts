import { readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { listChangedFiles } from "@/lib/repo-workspace";
import type { ExecutionAdapter } from "@/lib/execution-adapters/types";
import type { DiscoveryCandidate } from "@/lib/types";

const MAX_TARGET_FILE_BYTES = 32_000;

function readDirective(issueBody: string, key: string) {
  const match = issueBody.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? null;
}

function parseJsonValue(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function getStructuredJsonPatch(candidate: DiscoveryCandidate) {
  const target = readDirective(candidate.issueBody, "BOUNTIVE_JSON_TARGET");
  const path = readDirective(candidate.issueBody, "BOUNTIVE_JSON_PATH");
  const value = readDirective(candidate.issueBody, "BOUNTIVE_JSON_VALUE");

  if (!target || !path || value === null) {
    return null;
  }

  return {
    target,
    path: path.split(".").map((segment) => segment.trim()).filter(Boolean),
    value: parseJsonValue(value)
  };
}

function setNestedValue(root: Record<string, unknown>, path: string[], value: unknown) {
  let current: Record<string, unknown> = root;

  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    const next = current[key];

    if (typeof next === "object" && next !== null && !Array.isArray(next)) {
      current = next as Record<string, unknown>;
      continue;
    }

    const created: Record<string, unknown> = {};
    current[key] = created;
    current = created;
  }

  current[path[path.length - 1]] = value;
}

export const structuredJsonPatchAdapter: ExecutionAdapter = {
  id: "structured-json-patch",
  label: "Structured JSON patch adapter",
  taskCategory: "configuration",
  assessCandidate(candidate) {
    const patch = getStructuredJsonPatch(candidate);

    return {
      supported: Boolean(patch?.target && patch.path.length > 0),
      reason: patch
        ? `Issue body supplied a bounded JSON patch contract for ${patch.target}.`
        : "Issue body does not provide the structured JSON patch directives required by this adapter."
    };
  },
  match(candidate, workspace) {
    if (!workspace.repositoryPath) {
      return {
        matches: false,
        reason: "Repository path is unavailable, so structured JSON patching cannot start."
      };
    }

    const patch = getStructuredJsonPatch(candidate);

    if (!patch) {
      return {
        matches: false,
        reason: "Issue body does not provide structured JSON patch directives."
      };
    }

    if (!patch.target.endsWith(".json")) {
      return {
        matches: false,
        reason: "Structured JSON patching only supports .json targets."
      };
    }

    if (patch.target.includes("..") || patch.target.startsWith("/")) {
      return {
        matches: false,
        reason: "Patch target escapes the repository root, which is blocked."
      };
    }

    return {
      matches: true,
      reason: `Issue body supplied a bounded JSON patch contract for ${patch.target}.`
    };
  },
  async apply(candidate, workspace) {
    const patch = getStructuredJsonPatch(candidate);

    if (!patch) {
      throw new Error("Structured JSON patch directives were missing at apply time.");
    }

    const targetPath = join(workspace.repositoryPath!, patch.target);
    const targetStat = await stat(targetPath);

    if (targetStat.size > MAX_TARGET_FILE_BYTES) {
      throw new Error(`Structured JSON patch target exceeds the safe file-size limit: ${patch.target}`);
    }

    const document = JSON.parse(await readFile(targetPath, "utf8")) as Record<string, unknown>;
    setNestedValue(document, patch.path, patch.value);
    await writeFile(targetPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");

    return {
      changedFiles: await listChangedFiles(workspace.repositoryPath!),
      notes: [
        `Applied structured bounded JSON patch to ${patch.target}.`,
        `Updated JSON path ${patch.path.join(".")} with an explicit issue-defined value.`
      ],
      summary: `Structured JSON patch completed for ${patch.target}.`,
      taskCategory: "configuration"
    };
  }
};
