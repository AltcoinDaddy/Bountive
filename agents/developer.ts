import { slugify } from "@/lib/utils";
import { prepareWorkspace } from "@/lib/repo-workspace";
import { writeArtifact } from "@/lib/artifacts";
import type { DiscoveryCandidate, WorkspacePreparation } from "@/lib/types";

export class DeveloperAgent {
  readonly name = "Developer Agent";

  async run(input: { missionId: string; candidate: DiscoveryCandidate }): Promise<WorkspacePreparation> {
    const workspace = await prepareWorkspace(input.missionId, input.candidate);

    await writeArtifact(`missions/${input.missionId}.execution-plan.md`, [
      `# Execution Plan`,
      ``,
      `Mission: ${input.missionId}`,
      `Repository: ${input.candidate.repo}`,
      `Issue: ${input.candidate.issueUrl}`,
      ``,
      `## Strategy`,
      `- Keep execution in conservative MVP mode.`,
      `- Prepare an isolated workspace and inspect the repository for build, lint, and test scripts.`,
      `- Draft a branch and commit plan without pushing live changes unless explicitly enabled.`,
      `- Generate verification and submission artifacts for operator review.`,
      ``,
      `## Proposed branch`,
      `- bountive/${slugify(input.candidate.issueTitle)}`
    ].join("\n"));

    return workspace;
  }
}
