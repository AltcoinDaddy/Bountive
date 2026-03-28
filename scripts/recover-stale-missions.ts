import { recoverStaleRunningMissions } from "@/lib/mission-queue";

async function main() {
  const recovered = await recoverStaleRunningMissions();
  console.log(`recovered_count=${recovered.length}`);

  if (recovered.length > 0) {
    console.log(`recovered_mission_ids=${recovered.join(",")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
