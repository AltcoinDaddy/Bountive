import { slugify } from "@/lib/utils";
import { prepareWorkspace } from "@/lib/repo-workspace";
import { writeArtifact } from "@/lib/artifacts";
import { executeCandidateWork } from "@/lib/execution-engine";
import type { DiscoveryCandidate, WorkspacePreparation } from "@/lib/types";

export class DeveloperAgent {
  readonly name = "Developer Agent";

  async prepare(input: {
    missionId: string;
    candidate: DiscoveryCandidate;
    retryIndex?: number;
  }): Promise<WorkspacePreparation> {
    return prepareWorkspace(input.missionId, input.candidate, input.retryIndex ?? 0);
  }

  async apply(input: {
    missionId: string;
    candidate: DiscoveryCandidate;
    workspace: WorkspacePreparation;
    retryIndex?: number;
    previousQaNotes?: string;
  }): Promise<WorkspacePreparation> {
    const workspace = await executeCandidateWork(input.workspace, input.candidate);

    await writeArtifact(`missions/${input.missionId}.execution-plan.md`, [
      `# Execution Plan`,
      ``,
      `Mission: ${input.missionId}`,
      `Repository: ${input.candidate.repo}`,
      `Issue: ${input.candidate.issueUrl}`,
      ``,
      `## Strategy`,
      `- Keep execution within deterministic MVP-safe strategies.`,
      `- Prepare an isolated workspace and inspect the repository for build, lint, and test scripts.`,
      `- Apply a bounded patch only when the selected task matches a supported local execution strategy.`,
      `- Draft or create a local branch and commit artifact without pushing live changes unless explicitly enabled.`,
      `- Generate verification and submission artifacts for operator review.`,
      ``,
      `## Proposed branch`,
      `- bountive/${slugify(input.candidate.issueTitle)}`,
      ``,
      `## Retry index`,
      `- ${input.retryIndex ?? 0}`,
      ``,
      `## Previous QA notes`,
      `- ${input.previousQaNotes ?? "No prior QA feedback recorded."}`,
      ``,
      `## Execution notes`,
      ...workspace.executionNotes.map((note) => `- ${note}`),
      ``,
      `## Selected adapter`,
      `- ${workspace.appliedAdapterId ?? "No adapter matched this task."}`,
      ``,
      `## Task category`,
      `- ${workspace.appliedTaskCategory ?? "Unclassified"}`,
      ``,
      `## Changed files`,
      ...(workspace.changedFiles.length > 0 ? workspace.changedFiles.map((file) => `- ${file}`) : ["- No file changes were produced in this attempt."])
    ].join("\n"));

    return workspace;
  }

  async run(input: {
    missionId: string;
    candidate: DiscoveryCandidate;
    retryIndex?: number;
    previousQaNotes?: string;
  }): Promise<WorkspacePreparation> {
    const preparedWorkspace = await this.prepare(input);
    return this.apply({
      ...input,
      workspace: preparedWorkspace
    });
  }
}
