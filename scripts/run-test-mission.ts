import { defaultMissionInput, runMission } from "@/lib/orchestrator";

async function main() {
  const missionId = await runMission({
    ...defaultMissionInput(),
    title: "Verification summary test repair mission",
    labels: ["tests"]
  });

  console.log(`mission_id=${missionId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
