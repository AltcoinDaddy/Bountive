import { defaultMissionInput, runMission } from "@/lib/orchestrator";

async function main() {
  const missionId = await runMission({
    ...defaultMissionInput(),
    title: "Structured JSON patch mission",
    labels: ["structured-json"]
  });

  console.log(`mission_id=${missionId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
