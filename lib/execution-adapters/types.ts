import type { DiscoveryCandidate, WorkspacePreparation } from "@/lib/types";

export type ExecutionAdapterMatch = {
  matches: boolean;
  reason: string;
};

export type ExecutionAdapterCandidateAssessment = {
  supported: boolean;
  reason: string;
};

export type ExecutionAdapterApplyResult = {
  changedFiles: string[];
  notes: string[];
  summary: string;
  taskCategory: string;
};

export type ExecutionAdapter = {
  id: string;
  label: string;
  taskCategory: string;
  assessCandidate?(candidate: DiscoveryCandidate): Promise<ExecutionAdapterCandidateAssessment> | ExecutionAdapterCandidateAssessment;
  match(candidate: DiscoveryCandidate, workspace: WorkspacePreparation): Promise<ExecutionAdapterMatch> | ExecutionAdapterMatch;
  apply(candidate: DiscoveryCandidate, workspace: WorkspacePreparation): Promise<ExecutionAdapterApplyResult>;
};
