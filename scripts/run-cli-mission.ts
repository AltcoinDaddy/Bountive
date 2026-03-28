import { defaultMissionInput, runMission } from "@/lib/orchestrator";

async function main() {
  const missionId = await runMission({
    ...defaultMissionInput(),
    title: "CLI config repair mission",
    labels: ["bug", "help wanted"]
  });

  console.log(`mission_id=${missionId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
