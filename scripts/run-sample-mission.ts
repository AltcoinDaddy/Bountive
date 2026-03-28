import { defaultMissionInput, runMission } from "@/lib/orchestrator";

async function main() {
  const missionId = await runMission({
    ...defaultMissionInput(),
    labels: ["documentation", "good first issue"]
  });
  console.log(`mission_id=${missionId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
