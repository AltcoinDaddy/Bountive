import type { CandidateScore, DiscoveryCandidate, GuardrailsSnapshot, MissionInput } from "@/lib/types";
import { scoreCandidate } from "@/lib/scoring-engine";

export class PlannerAgent {
  readonly name = "Planner Agent";

  rankCandidates(candidates: DiscoveryCandidate[]) {
    return candidates
      .map((candidate) => ({
        candidate,
        score: scoreCandidate(candidate)
      }))
      .sort((left, right) => right.score.total - left.score.total);
  }

  chooseCandidate(input: {
    rankedCandidates: Array<{ candidate: DiscoveryCandidate; score: CandidateScore }>;
    mission: MissionInput;
    guardrails: GuardrailsSnapshot;
  }) {
    return input.rankedCandidates.find(
      ({ candidate, score }) =>
        score.confidence >= input.mission.confidenceThreshold &&
        (input.guardrails.mode === "dry_run" || input.guardrails.allowlistedRepos.includes(candidate.repo))
    );
  }
}
