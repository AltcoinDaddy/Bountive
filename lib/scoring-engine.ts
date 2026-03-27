import type { CandidateScore, DiscoveryCandidate } from "@/lib/types";

const oversizedKeywords = ["refactor", "architecture", "migration", "multiple", "cross-cutting", "subsystem"];
const buildFriendlyLabels = ["good first issue", "documentation", "bug", "tests"];

function normalize(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function scoreCandidate(candidate: DiscoveryCandidate): CandidateScore {
  const text = `${candidate.issueTitle} ${candidate.issueBody}`.toLowerCase();
  const labels = candidate.labels.map((label) => label.toLowerCase());

  const clarity =
    45 +
    (candidate.issueBody.length > 80 ? 18 : 0) +
    (text.includes("acceptance") || text.includes("desired") ? 12 : 0) +
    (labels.includes("documentation") ? 8 : 0) +
    (labels.includes("good first issue") ? 10 : 0);

  const complexityPenalty =
    oversizedKeywords.reduce((total, keyword) => total + (text.includes(keyword) ? 10 : 0), 0) +
    (candidate.issueBody.length > 500 ? 10 : 0);

  const buildability =
    40 +
    (candidate.language === "TypeScript" || candidate.language === "JavaScript" ? 18 : 0) +
    (candidate.defaultBranch ? 8 : 0) +
    (labels.some((label) => buildFriendlyLabels.includes(label)) ? 14 : 0);

  const complexity = normalize(100 - complexityPenalty);
  const total = normalize(Math.round(clarity * 0.4 + complexity * 0.3 + buildability * 0.3));
  const confidence = Number((normalize(total / 100, 0, 1)).toFixed(2));

  if (total >= 70) {
    return {
      total,
      confidence,
      clarity: normalize(clarity),
      complexity,
      buildability: normalize(buildability),
      selectedReason: "Clear acceptance signals, moderate scope, and a codebase likely to be buildable within dry-run constraints."
    };
  }

  return {
    total,
    confidence,
    clarity: normalize(clarity),
    complexity,
    buildability: normalize(buildability),
    rejectedReason: complexity < 55
      ? "Rejected because the task appears oversized for the current retry and patch-size limits."
      : "Rejected because the task does not provide enough clarity for a safe autonomous execution."
  };
}
