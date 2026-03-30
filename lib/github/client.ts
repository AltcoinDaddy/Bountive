import { Octokit } from "@octokit/rest";
import { env } from "@/lib/env";
import type { DiscoveryCandidate } from "@/lib/types";

type SearchIssueItem = Awaited<ReturnType<Octokit["search"]["issuesAndPullRequests"]>>["data"]["items"][number];
type RepositoryIssueItem = Awaited<ReturnType<Octokit["issues"]["listForRepo"]>>["data"][number];

function matchesRequestedLabels(issueLabels: string[], requestedLabels: string[]) {
  if (requestedLabels.length === 0) {
    return true;
  }

  const normalizedIssueLabels = issueLabels.map((label) => label.toLowerCase());
  return requestedLabels.some((label) => normalizedIssueLabels.includes(label.toLowerCase()));
}

async function discoverAllowlistedRepoIssues(
  octokit: Octokit,
  repoAllowlist: string[],
  requestedLabels: string[],
  maxCandidates: number
) {
  const perRepoLimit = Math.min(Math.max(maxCandidates, 20), 50);
  const repoCandidates = await Promise.all(
    repoAllowlist.map(async (repoName) => {
      const [owner, repo] = repoName.split("/");

      if (!owner || !repo) {
        return [];
      }

      const [repository, issues] = await Promise.all([
        octokit.repos.get({ owner, repo }),
        octokit.issues.listForRepo({
          owner,
          repo,
          state: "open",
          sort: "updated",
          direction: "desc",
          per_page: perRepoLimit
        })
      ]);

      return issues.data
        .filter((issue) => !("pull_request" in issue))
        .filter((issue) => !issue.assignee)
        .filter((issue) => {
          const labels = issue.labels.map((label) => (typeof label === "string" ? label : label.name ?? "unknown"));
          return matchesRequestedLabels(labels, requestedLabels);
        })
        .map((issue) => toDiscoveryCandidate(issue, repository.data));
    })
  );

  return repoCandidates
    .flat()
    .sort((left, right) => right.issueNumber - left.issueNumber)
    .slice(0, maxCandidates);
}

function toDiscoveryCandidate(
  issue: SearchIssueItem | RepositoryIssueItem,
  repository: {
    html_url: string;
    description: string | null;
    default_branch: string;
    language: string | null;
    stargazers_count: number;
  }
) {
  const repoPath = issue.repository_url.replace("https://api.github.com/repos/", "");
  const [owner, repo] = repoPath.split("/");

  return {
    repo: `${owner}/${repo}`,
    repoUrl: repository.html_url,
    issueNumber: issue.number,
    issueTitle: issue.title,
    issueUrl: issue.html_url,
    issueBody: issue.body ?? "",
    labels: issue.labels.map((label) => (typeof label === "string" ? label : label.name ?? "unknown")),
    repoDescription: repository.description ?? "",
    defaultBranch: repository.default_branch,
    language: repository.language ?? undefined,
    stars: repository.stargazers_count
  } satisfies DiscoveryCandidate;
}

export function createOctokit() {
  return new Octokit({
    auth: env.githubToken || undefined
  });
}

export async function discoverGithubIssues(
  labels: string[],
  maxCandidates: number,
  repoAllowlist?: string[]
): Promise<DiscoveryCandidate[]> {
  if (!env.githubToken) {
    throw new Error("GitHub discovery requires GITHUB_TOKEN to be configured.");
  }

  const octokit = createOctokit();
  if (repoAllowlist?.length) {
    return discoverAllowlistedRepoIssues(octokit, repoAllowlist, labels, maxCandidates);
  }

  const perPage = Math.min(maxCandidates, 20);
  const baseQuery = "state:open archived:false no:assignee is:issue";

  const searchQueries = labels.length > 0
    ? labels.map((label) => `${baseQuery} label:"${label}"`)
    : [baseQuery];

  const searchResults = await Promise.all(
    searchQueries.map((query) =>
      octokit.search.issuesAndPullRequests({
        q: query,
        per_page: perPage,
        sort: "updated",
        order: "desc"
      })
    )
  );

  const uniqueIssues = new Map<string, SearchIssueItem>();

  for (const result of searchResults) {
    for (const item of result.data.items) {
      if ("pull_request" in item) {
        continue;
      }

      const existing = uniqueIssues.get(item.html_url);

      if (!existing || new Date(item.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
        uniqueIssues.set(item.html_url, item);
      }
    }
  }

  const candidates = await Promise.all(
    Array.from(uniqueIssues.values())
      .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())
      .slice(0, maxCandidates)
      .map(async (issue) => {
        const repoPath = issue.repository_url.replace("https://api.github.com/repos/", "");
        const [owner, repo] = repoPath.split("/");
        const repository = await octokit.repos.get({
          owner,
          repo
        });

        return toDiscoveryCandidate(issue, repository.data);
      })
  );

  return candidates;
}
