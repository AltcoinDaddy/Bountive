import { defaultMissionInput, enqueueMission } from "@/lib/orchestrator";

async function main() {
  const missionId = await enqueueMission({
    ...defaultMissionInput(),
    labels: ["documentation", "good first issue"]
  });

  console.log(`queued_mission_id=${missionId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
