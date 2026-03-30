import type { CandidateScore, DiscoveryCandidate, GuardrailsSnapshot, MissionInput } from "@/lib/types";
import { assessCandidateExecutionSupport } from "@/lib/execution-adapters";
import { applyExecutionSupportBias, scoreCandidate } from "@/lib/scoring-engine";

export class PlannerAgent {
  readonly name = "Planner Agent";

  async rankCandidates(candidates: DiscoveryCandidate[]) {
    const ranked = await Promise.all(
      candidates.map(async (candidate) => {
        const support = await assessCandidateExecutionSupport(candidate);
        return {
          candidate,
          support,
          score: applyExecutionSupportBias(scoreCandidate(candidate), support)
        };
      })
    );

    return ranked.sort((left, right) => right.score.total - left.score.total);
  }

  chooseCandidate(input: {
    rankedCandidates: Array<{
      candidate: DiscoveryCandidate;
      score: CandidateScore;
      support: {
        supported: boolean;
        adapterId: string | null;
        adapterLabel: string | null;
        taskCategory: string | null;
        reason: string;
      };
    }>;
    mission: MissionInput;
    guardrails: GuardrailsSnapshot;
  }) {
    const safeCandidates = input.rankedCandidates.filter(
      ({ candidate, score }) =>
        score.confidence >= input.mission.confidenceThreshold &&
        (input.guardrails.mode === "dry_run" || input.guardrails.allowlistedRepos.includes(candidate.repo))
    );

    const supportedCandidate = safeCandidates.find(({ support }) => support.supported);
    return supportedCandidate ?? safeCandidates[0];
  }
}
