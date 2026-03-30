import { env } from "@/lib/env";
import { createOctokit } from "@/lib/github/client";

export type WritableGithubRepo = {
  fullName: string;
  defaultBranch: string;
  private: boolean;
  allowlisted: boolean;
};

export async function getWritableGithubRepos(limit = 8): Promise<WritableGithubRepo[]> {
  if (!env.githubToken) {
    return [];
  }

  try {
    const octokit = createOctokit();
    const repositories = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
      affiliation: "owner,collaborator,organization_member",
      per_page: 100,
      sort: "updated"
    });

    return repositories
      .filter((repository) => repository.permissions?.push || repository.permissions?.admin || repository.permissions?.maintain)
      .slice(0, limit)
      .map((repository) => ({
        fullName: repository.full_name,
        defaultBranch: repository.default_branch,
        private: repository.private,
        allowlisted: env.allowlistedRepos.includes(repository.full_name)
      }));
  } catch {
    return [];
  }
}
