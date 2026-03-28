import { env } from "@/lib/env";
import { createOctokit } from "@/lib/github/client";

type LiveValidationCheck = {
  label: string;
  status: "passed" | "blocked" | "pending";
  detail: string;
};

export type LiveRepoValidation = {
  status: "passed" | "blocked" | "pending";
  checks: LiveValidationCheck[];
};

function parseRepo(repo: string) {
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    return null;
  }

  return { owner, repo: name };
}

export async function validateLiveRepoTarget(repo: string | null | undefined, allowlist: string[]) {
  const checks: LiveValidationCheck[] = [
    {
      label: "GitHub token",
      status: env.githubToken ? "passed" : "blocked",
      detail: env.githubToken
        ? "GitHub token is configured."
        : "Configure GITHUB_TOKEN before validating or publishing live pull requests."
    },
    {
      label: "Allowlist",
      status: repo && allowlist.includes(repo) ? "passed" : repo ? "blocked" : "pending",
      detail: repo
        ? allowlist.includes(repo)
          ? `${repo} is present in the current allowlist.`
          : `${repo} is not present in the current allowlist.`
        : "Select or complete a mission to validate the chosen repository."
    }
  ];

  if (!repo || !env.githubToken) {
    return {
      status: checks.some((check) => check.status === "blocked") ? "blocked" : "pending",
      checks
    } satisfies LiveRepoValidation;
  }

  const parsed = parseRepo(repo);

  if (!parsed) {
    checks.push({
      label: "Repository format",
      status: "blocked",
      detail: `Unable to parse owner/name from ${repo}.`
    });

    return {
      status: "blocked",
      checks
    } satisfies LiveRepoValidation;
  }

  try {
    const octokit = createOctokit();
    const repository = await octokit.repos.get(parsed);
    const canPush = Boolean(repository.data.permissions?.push || repository.data.permissions?.admin);

    checks.push({
      label: "Repository access",
      status: "passed",
      detail: `Repository found. Default branch: ${repository.data.default_branch}.`
    });
    checks.push({
      label: "Push permission",
      status: canPush ? "passed" : "blocked",
      detail: canPush
        ? "Authenticated token can create branches or write refs."
        : "Authenticated token does not expose push or admin permission on this repository."
    });
  } catch (error) {
    checks.push({
      label: "Repository access",
      status: "blocked",
      detail: error instanceof Error ? error.message : "GitHub validation failed."
    });
  }

  return {
    status: checks.some((check) => check.status === "blocked")
      ? "blocked"
      : checks.some((check) => check.status === "pending")
        ? "pending"
        : "passed",
    checks
  } satisfies LiveRepoValidation;
}
