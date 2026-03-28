import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SubmissionStatus } from "@prisma/client";
import { createOctokit } from "@/lib/github/client";

type LiveSubmissionInput = {
  repo: string;
  branchName: string;
  commitMessage: string;
  prTitle: string;
  prBody: string;
  changedFiles: string[];
  repositoryPath: string;
  defaultBranch?: string | null;
};

type LiveSubmissionResult = {
  branchName: string;
  commitHash: string;
  prUrl: string;
  submissionStatus: SubmissionStatus;
};

function parseRepoFullName(repo: string) {
  const [owner, name] = repo.split("/");

  if (!owner || !name) {
    throw new Error(`Unable to parse repository owner/name from "${repo}".`);
  }

  return { owner, repo: name };
}

async function readChangedFileContent(repositoryPath: string, relativePath: string) {
  const absolutePath = join(repositoryPath, relativePath);
  return readFile(absolutePath, "utf8");
}

export async function createLiveDraftSubmission(input: LiveSubmissionInput): Promise<LiveSubmissionResult> {
  const octokit = createOctokit();

  if (!process.env.GITHUB_TOKEN) {
    throw new Error("Live submission requires GITHUB_TOKEN to be configured.");
  }

  const { owner, repo } = parseRepoFullName(input.repo);
  const repository = await octokit.repos.get({
    owner,
    repo
  });

  const baseBranch = input.defaultBranch ?? repository.data.default_branch;
  const baseRef = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`
  });

  const baseCommit = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: baseRef.data.object.sha
  });

  const tree = await Promise.all(
    input.changedFiles.map(async (filePath) => ({
      path: filePath,
      mode: "100644" as const,
      type: "blob" as const,
      content: await readChangedFileContent(input.repositoryPath, filePath)
    }))
  );

  const createdTree = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseCommit.data.tree.sha,
    tree
  });

  const createdCommit = await octokit.git.createCommit({
    owner,
    repo,
    message: input.commitMessage,
    tree: createdTree.data.sha,
    parents: [baseCommit.data.sha]
  });

  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${input.branchName}`,
    sha: createdCommit.data.sha
  });

  const pullRequest = await octokit.pulls.create({
    owner,
    repo,
    title: input.prTitle,
    body: input.prBody,
    head: input.branchName,
    base: baseBranch,
    draft: true
  });

  return {
    branchName: input.branchName,
    commitHash: createdCommit.data.sha,
    prUrl: pullRequest.data.html_url,
    submissionStatus: SubmissionStatus.LIVE_SUBMITTED
  };
}
