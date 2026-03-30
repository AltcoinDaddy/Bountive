import { listChangedFiles } from "@/lib/repo-workspace";
import type { DiscoveryCandidate, WorkspacePreparation } from "@/lib/types";
import { commitlintConventionalAdapter } from "@/lib/execution-adapters/commitlint-conventional-adapter";
import { structuredJsonPatchAdapter } from "@/lib/execution-adapters/structured-json-patch-adapter";
import { structuredTextPatchAdapter } from "@/lib/execution-adapters/structured-text-patch-adapter";
import { vscodeRustAnalyzerAdapter } from "@/lib/execution-adapters/vscode-rust-analyzer-adapter";
import type { ExecutionAdapter } from "@/lib/execution-adapters/types";

const registeredAdapters: ExecutionAdapter[] = [
  vscodeRustAnalyzerAdapter,
  commitlintConventionalAdapter,
  structuredJsonPatchAdapter,
  structuredTextPatchAdapter
];

export function getRegisteredExecutionAdapters() {
  return registeredAdapters;
}

export async function assessCandidateExecutionSupport(candidate: DiscoveryCandidate) {
  for (const adapter of registeredAdapters) {
    const assessment = adapter.assessCandidate ? await adapter.assessCandidate(candidate) : null;

    if (assessment?.supported) {
      return {
        supported: true,
        adapterId: adapter.id,
        adapterLabel: adapter.label,
        taskCategory: adapter.taskCategory,
        reason: assessment.reason
      } as const;
    }
  }

  return {
    supported: false,
    adapterId: null,
    adapterLabel: null,
    taskCategory: null,
    reason: "No registered execution adapter currently supports this candidate from issue metadata alone."
  } as const;
}

export async function applyExecutionAdapter(
  workspace: WorkspacePreparation,
  candidate: DiscoveryCandidate
): Promise<WorkspacePreparation> {
  if (!workspace.cloneSucceeded || !workspace.repositoryPath) {
    return workspace;
  }

  const adapterDiagnostics: string[] = [];

  for (const adapter of registeredAdapters) {
    const match = await adapter.match(candidate, workspace);
    adapterDiagnostics.push(`${adapter.label}: ${match.reason}`);

    if (!match.matches) {
      continue;
    }

    const result = await adapter.apply(candidate, workspace);

    return {
      ...workspace,
      appliedAdapterId: adapter.id,
      appliedTaskCategory: result.taskCategory,
      changedFiles: result.changedFiles,
      executionNotes: [
        ...workspace.executionNotes,
        `Execution adapter selected: ${adapter.label}.`,
        ...result.notes,
        `Adapter outcome: ${result.summary}`
      ]
    };
  }

  return {
    ...workspace,
    changedFiles: await listChangedFiles(workspace.repositoryPath),
    executionNotes: [
      ...workspace.executionNotes,
      ...adapterDiagnostics,
      "No deterministic execution adapter matched the selected task, so the mission stayed in non-mutating execution mode."
    ]
  };
}
