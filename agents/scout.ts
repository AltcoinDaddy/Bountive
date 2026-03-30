import type { DiscoveryCandidate, MissionInput } from "@/lib/types";
import { discoverGithubIssues } from "@/lib/github/client";

export class ScoutAgent {
  readonly name = "Scout Agent";

  async run(input: MissionInput): Promise<DiscoveryCandidate[]> {
    return discoverGithubIssues(
      input.labels,
      input.maxCandidates,
      input.allowlistedRepos.length > 0 ? input.allowlistedRepos : undefined
    );
  }
}
