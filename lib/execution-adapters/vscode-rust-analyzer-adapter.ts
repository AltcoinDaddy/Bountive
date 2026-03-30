import { access, readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { listChangedFiles } from "@/lib/repo-workspace";
import type { ExecutionAdapter } from "@/lib/execution-adapters/types";

async function pathExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function mentionsVsCodeRustAnalyzer(text: string) {
  const normalized = text.toLowerCase();
  return (
    normalized.includes("vscode") &&
    (normalized.includes("rust analyzer") || normalized.includes("rust-analyzer"))
  );
}

async function findCargoTomls(root: string, current = root, depth = 0): Promise<string[]> {
  if (depth > 3) {
    return [];
  }

  const entries = await readdir(current, { withFileTypes: true }).catch(() => []);
  const manifests: string[] = [];

  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") {
      continue;
    }

    const entryPath = join(current, entry.name);

    if (entry.isFile() && entry.name === "Cargo.toml") {
      manifests.push(entryPath);
      continue;
    }

    if (entry.isDirectory()) {
      manifests.push(...(await findCargoTomls(root, entryPath, depth + 1)));
    }
  }

  return manifests;
}

export const vscodeRustAnalyzerAdapter: ExecutionAdapter = {
  id: "vscode-rust-analyzer",
  label: "VS Code Rust Analyzer settings patch",
  taskCategory: "developer-experience copy",
  assessCandidate(candidate) {
    const combined = `${candidate.issueTitle}\n${candidate.issueBody}`;

    if (!mentionsVsCodeRustAnalyzer(combined)) {
      return {
        supported: false,
        reason: "Issue does not request VS Code Rust Analyzer workspace settings."
      };
    }

    return {
      supported: true,
      reason: "Issue title/body match the bounded VS Code Rust Analyzer settings adapter."
    };
  },
  async match(candidate, workspace) {
    if (!workspace.repositoryPath) {
      return {
        matches: false,
        reason: "Repository path is unavailable, so VS Code settings patching cannot start."
      };
    }

    const combined = `${candidate.issueTitle}\n${candidate.issueBody}`;

    if (!mentionsVsCodeRustAnalyzer(combined)) {
      return {
        matches: false,
        reason: "Issue does not request VS Code Rust Analyzer settings."
      };
    }

    const settingsPath = join(workspace.repositoryPath, ".vscode", "settings.json");

    if (!(await pathExists(settingsPath))) {
      return {
        matches: false,
        reason: "Repository does not already contain .vscode/settings.json."
      };
    }

    const cargoTomls = await findCargoTomls(workspace.repositoryPath);

    if (cargoTomls.length === 0) {
      return {
        matches: false,
        reason: "Repository does not contain a Cargo.toml workspace to link."
      };
    }

    return {
      matches: true,
      reason: `Repository contains ${cargoTomls.length} Cargo manifest${cargoTomls.length === 1 ? "" : "s"} and an editable VS Code settings file.`
    };
  },
  async apply(_candidate, workspace) {
    const settingsPath = join(workspace.repositoryPath!, ".vscode", "settings.json");
    const cargoTomls = await findCargoTomls(workspace.repositoryPath!);
    const settings = JSON.parse(await readFile(settingsPath, "utf8")) as Record<string, unknown>;
    const linkedProjects = cargoTomls.map((cargoToml) => relative(workspace.repositoryPath!, cargoToml).replaceAll("\\", "/"));

    settings["rust-analyzer.linkedProjects"] = linkedProjects;

    await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");

    return {
      changedFiles: await listChangedFiles(workspace.repositoryPath!),
      notes: [
        "Applied bounded VS Code Rust Analyzer settings patch.",
        `Linked ${linkedProjects.length} Cargo manifest${linkedProjects.length === 1 ? "" : "s"} for editor indexing.`
      ],
      summary: "VS Code workspace settings updated for Rust Analyzer linked projects.",
      taskCategory: "developer-experience copy"
    };
  }
};
