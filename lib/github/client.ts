import { Octokit } from "@octokit/rest";
import { env } from "@/lib/env";
import { mockIssues } from "@/lib/github/mock-issues";
import type { DiscoveryCandidate } from "@/lib/types";

export function createOctokit() {
  return new Octokit({
    auth: env.githubToken || undefined
  });
}

export async function discoverGithubIssues(labels: string[], maxCandidates: number, repoAllowlist?: string[]): Promise<DiscoveryCandidate[]> {
  if (!env.githubToken) {
    const normalizedLabels = labels.map((label) => label.toLowerCase());
    const normalizedAllowlist = repoAllowlist?.map((repo) => repo.toLowerCase()) ?? [];

    return mockIssues
      .filter((issue) =>
        normalizedLabels.length === 0 ||
        issue.labels.some((label) => normalizedLabels.includes(label.toLowerCase()))
      )
      .filter((issue) => normalizedAllowlist.length === 0 || normalizedAllowlist.includes(issue.repo.toLowerCase()))
      .slice(0, maxCandidates);
  }

  const octokit = createOctokit();
  const repoQuery = repoAllowlist?.length
    ? `(${repoAllowlist.map((repo) => `repo:${repo}`).join(" OR ")})`
    : "";
  const labelQuery = labels.map((label) => `label:"${label}"`).join(" OR ");
  const query = [repoQuery, labelQuery, "state:open archived:false no:assignee"].filter(Boolean).join(" ");

  const result = await octokit.search.issuesAndPullRequests({
    q: query,
    per_page: Math.min(maxCandidates, 20),
    sort: "updated",
    order: "desc"
  });

  const candidates = await Promise.all(
    result.data.items
      .filter((item) => !("pull_request" in item))
      .slice(0, maxCandidates)
      .map(async (issue) => {
        const repoPath = issue.repository_url.replace("https://api.github.com/repos/", "");
        const [owner, repo] = repoPath.split("/");
        const repository = await octokit.repos.get({
          owner,
          repo
        });

        return {
          repo: `${owner}/${repo}`,
          repoUrl: repository.data.html_url,
          issueNumber: issue.number,
          issueTitle: issue.title,
          issueUrl: issue.html_url,
          issueBody: issue.body ?? "",
          labels: issue.labels.map((label) => (typeof label === "string" ? label : label.name ?? "unknown")),
          repoDescription: repository.data.description ?? "",
          defaultBranch: repository.data.default_branch,
          language: repository.data.language ?? undefined,
          stars: repository.data.stargazers_count
        } satisfies DiscoveryCandidate;
      })
  );

  return repoAllowlist?.length
    ? candidates.filter((candidate) => repoAllowlist.includes(candidate.repo))
    : candidates;
}
