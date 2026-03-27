import { SubmissionStatus } from "@prisma/client";
import { slugify } from "@/lib/utils";
import type { DiscoveryCandidate, SubmissionArtifact, VerificationResult, WorkspacePreparation } from "@/lib/types";

export class SubmitterAgent {
  readonly name = "Submitter Agent";

  async run(input: {
    candidate: DiscoveryCandidate;
    verification: VerificationResult;
    workspace: WorkspacePreparation;
    liveMode: boolean;
  }): Promise<SubmissionArtifact> {
    const slug = slugify(input.candidate.issueTitle);
    const branchName = `bountive/${slug}`;
    const commitMessage = input.candidate.labels.includes("documentation")
      ? `docs: ${input.candidate.issueTitle.toLowerCase()}`
      : `fix: ${input.candidate.issueTitle.toLowerCase()}`;

    const prTitle = commitMessage.charAt(0).toLowerCase() === "d"
      ? commitMessage
      : commitMessage;

    const verificationSummary = [
      `build: ${input.verification.buildStatus.toLowerCase()}`,
      `lint: ${input.verification.lintStatus.toLowerCase()}`,
      `test: ${input.verification.testStatus.toLowerCase()}`
    ].join("\n");

    const prBody = [
      "## Summary",
      "- prepare a safe autonomous mission draft from the selected issue",
      "- keep live submission disabled unless explicitly enabled and allowlisted",
      "- attach verification outcomes and operator proof metadata",
      "",
      "## Verification",
      verificationSummary,
      "",
      "## Notes",
      ...input.workspace.executionNotes.map((note) => `- ${note}`)
    ].join("\n");

    return {
      branchName,
      commitHash: null,
      commitMessage,
      prTitle,
      prBody,
      prUrl: null,
      submissionStatus: input.liveMode ? SubmissionStatus.LIVE_PENDING : SubmissionStatus.DRAFT_READY,
      changedFiles: input.workspace.changedFiles,
      verificationSummary: input.verification.summary
    };
  }
}
