import type { DiscoveryCandidate, MissionInput } from "@/lib/types";
import { discoverGithubIssues } from "@/lib/github/client";

export class ScoutAgent {
  readonly name = "Scout Agent";

  async run(input: MissionInput): Promise<DiscoveryCandidate[]> {
    return discoverGithubIssues(
      input.labels,
      input.maxCandidates,
      input.mode === "live" ? input.allowlistedRepos : undefined
    );
  }
}
