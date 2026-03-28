import { listChangedFiles } from "@/lib/repo-workspace";
import type { DiscoveryCandidate, WorkspacePreparation } from "@/lib/types";
import { cliConfigMessageAdapter } from "@/lib/execution-adapters/cli-config-message-adapter";
import { configDefaultsAdapter } from "@/lib/execution-adapters/config-defaults-adapter";
import { remotePatternDocsAdapter } from "@/lib/execution-adapters/remote-pattern-docs-adapter";
import { structuredJsonPatchAdapter } from "@/lib/execution-adapters/structured-json-patch-adapter";
import { structuredTextPatchAdapter } from "@/lib/execution-adapters/structured-text-patch-adapter";
import { verificationSummaryTestAdapter } from "@/lib/execution-adapters/verification-summary-test-adapter";
import type { ExecutionAdapter } from "@/lib/execution-adapters/types";

const registeredAdapters: ExecutionAdapter[] = [
  remotePatternDocsAdapter,
  structuredJsonPatchAdapter,
  structuredTextPatchAdapter,
  cliConfigMessageAdapter,
  configDefaultsAdapter,
  verificationSummaryTestAdapter
];

export function getRegisteredExecutionAdapters() {
  return registeredAdapters;
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
