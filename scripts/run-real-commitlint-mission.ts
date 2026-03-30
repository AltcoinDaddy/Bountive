import { defaultMissionInput, runMission } from "@/lib/orchestrator";

async function main() {
  const missionId = await runMission({
    ...defaultMissionInput(),
    title: "Real GitHub commitlint mission",
    mode: "live",
    labels: ["dx", "ci/cd"],
    allowlistedRepos: ["LFGBanditLabs/Quipay"],
    liveSubmissionEnabled: false
  });

  console.log(`mission_id=${missionId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
