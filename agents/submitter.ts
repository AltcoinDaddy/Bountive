import { SubmissionStatus } from "@prisma/client";
import { slugify } from "@/lib/utils";
import { createLocalCommit, listChangedFiles } from "@/lib/repo-workspace";
import { createLiveDraftSubmission } from "@/lib/github/live-submission";
import type { DiscoveryCandidate, SubmissionArtifact, VerificationResult, WorkspacePreparation } from "@/lib/types";

export class SubmitterAgent {
  readonly name = "Submitter Agent";

  async run(input: {
    missionId: string;
    candidate: DiscoveryCandidate;
    verification: VerificationResult;
    workspace: WorkspacePreparation;
    liveMode: boolean;
  }): Promise<SubmissionArtifact> {
    const slug = slugify(input.candidate.issueTitle);
    const liveBranchName = `bountive/${slug}-${input.missionId.slice(-6)}`;
    const branchName = input.liveMode ? liveBranchName : input.workspace.branchName ?? `bountive/${slug}`;
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

    const changedFiles = input.workspace.repositoryPath
      ? await listChangedFiles(input.workspace.repositoryPath)
      : input.workspace.changedFiles;

    const shouldBlockSubmission = !input.verification.criteriaMet || changedFiles.length === 0;
    const localCommit = input.workspace.repositoryPath && changedFiles.length > 0
      ? await createLocalCommit(input.workspace.repositoryPath, commitMessage)
      : { commitHash: null, changedFiles };

    let commitHash = localCommit.commitHash;
    let prUrl: string | null = null;
    let submissionStatus: SubmissionStatus = shouldBlockSubmission
      ? SubmissionStatus.BLOCKED
      : input.liveMode
        ? SubmissionStatus.LIVE_PENDING
        : SubmissionStatus.DRAFT_READY;

    if (!shouldBlockSubmission && input.liveMode) {
      if (!input.workspace.repositoryPath) {
        throw new Error("Live submission requires a prepared repository workspace.");
      }

      const liveSubmission = await createLiveDraftSubmission({
        repo: input.candidate.repo,
        branchName,
        commitMessage,
        prTitle,
        prBody,
        changedFiles: localCommit.changedFiles,
        repositoryPath: input.workspace.repositoryPath,
        defaultBranch: input.candidate.defaultBranch
      });

      commitHash = liveSubmission.commitHash;
      prUrl = liveSubmission.prUrl;
      submissionStatus = liveSubmission.submissionStatus;
    }

    const notesSection = shouldBlockSubmission
      ? [
          "",
          "## Submission status",
          !input.verification.criteriaMet
            ? "- blocked because verification did not satisfy the configured policy"
            : "- blocked because no repository changes were produced"
        ].join("\n")
      : "";

    return {
      branchName,
      commitHash,
      commitMessage,
      executionAdapterId: input.workspace.appliedAdapterId,
      taskCategory: input.workspace.appliedTaskCategory,
      prTitle,
      prBody: `${prBody}${notesSection}`,
      prUrl,
      submissionStatus,
      changedFiles: localCommit.changedFiles,
      verificationSummary: input.verification.summary
    };
  }
}
