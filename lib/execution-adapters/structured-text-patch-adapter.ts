import { readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { listChangedFiles } from "@/lib/repo-workspace";
import type { ExecutionAdapter } from "@/lib/execution-adapters/types";
import type { DiscoveryCandidate } from "@/lib/types";

const MAX_TARGET_FILE_BYTES = 32_000;
const allowedExtensions = [".md", ".txt", ".json", ".yml", ".yaml"];

function readDirective(issueBody: string, key: string) {
  const match = issueBody.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? null;
}

function readBlock(issueBody: string, key: string) {
  const match = issueBody.match(new RegExp(`^${key}:\\s*([\\s\\S]+?)(?:\\n[A-Z_]+:|$)`, "m"));
  return match?.[1]?.trim() ?? null;
}

function hasAllowedExtension(targetPath: string) {
  return allowedExtensions.some((extension) => targetPath.endsWith(extension));
}

function getStructuredPatch(candidate: DiscoveryCandidate) {
  const target = readDirective(candidate.issueBody, "BOUNTIVE_PATCH_TARGET");
  const before = readBlock(candidate.issueBody, "BOUNTIVE_REPLACE");
  const after = readBlock(candidate.issueBody, "BOUNTIVE_WITH");

  if (!target || !before || !after) {
    return null;
  }

  return { target, before, after };
}

export const structuredTextPatchAdapter: ExecutionAdapter = {
  id: "structured-text-patch",
  label: "Structured text patch adapter",
  taskCategory: "documentation",
  assessCandidate(candidate) {
    const patch = getStructuredPatch(candidate);

    return {
      supported: Boolean(patch?.target && patch.before && patch.after),
      reason: patch
        ? `Issue body supplied a bounded text patch contract for ${patch.target}.`
        : "Issue body does not provide the structured text patch directives required by this adapter."
    };
  },
  match(candidate, workspace) {
    if (!workspace.repositoryPath) {
      return {
        matches: false,
        reason: "Repository path is unavailable, so structured patch execution cannot start."
      };
    }

    const patch = getStructuredPatch(candidate);

    if (!patch) {
      return {
        matches: false,
        reason: "Issue body does not provide structured Bountive patch directives."
      };
    }

    if (patch.target.includes("..") || patch.target.startsWith("/")) {
      return {
        matches: false,
        reason: "Patch target escapes the repository root, which is blocked."
      };
    }

    if (!hasAllowedExtension(patch.target)) {
      return {
        matches: false,
        reason: "Patch target extension is outside the allowed bounded text formats."
      };
    }

    return {
      matches: true,
      reason: `Issue body supplied a bounded patch contract for ${patch.target}.`
    };
  },
  async apply(candidate, workspace) {
    const patch = getStructuredPatch(candidate);

    if (!patch) {
      throw new Error("Structured patch directives were missing at apply time.");
    }

    const targetPath = join(workspace.repositoryPath!, patch.target);
    const targetStat = await stat(targetPath);

    if (targetStat.size > MAX_TARGET_FILE_BYTES) {
      throw new Error(`Structured patch target exceeds the safe file-size limit: ${patch.target}`);
    }

    const existing = await readFile(targetPath, "utf8");

    if (!existing.includes(patch.before)) {
      throw new Error(`Structured patch could not find the expected source block in ${patch.target}.`);
    }

    const updated = existing.replace(patch.before, patch.after);
    await writeFile(targetPath, updated, "utf8");

    return {
      changedFiles: await listChangedFiles(workspace.repositoryPath!),
      notes: [
        `Applied structured bounded text patch to ${patch.target}.`,
        "The adapter required an explicit target path plus before/after content blocks in the issue body."
      ],
      summary: `Structured text patch completed for ${patch.target}.`,
      taskCategory: "documentation"
    };
  }
};
