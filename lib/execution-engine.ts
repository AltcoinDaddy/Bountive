import { applyExecutionAdapter } from "@/lib/execution-adapters";
import type { DiscoveryCandidate, WorkspacePreparation } from "@/lib/types";

export async function executeCandidateWork(
  workspace: WorkspacePreparation,
  candidate: DiscoveryCandidate
): Promise<WorkspacePreparation> {
  return applyExecutionAdapter(workspace, candidate);
}
