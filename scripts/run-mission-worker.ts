import { env } from "@/lib/env";
import { createQueueCoordinator } from "@/lib/queue-coordinator";
import { processNextQueuedMission } from "@/lib/orchestrator";

const once = process.argv.includes("--once");
const pollMs = env.missionWorkerPollMs;
const concurrency = Math.max(1, env.missionWorkerConcurrency);
const workerId = `local-worker-${process.pid}`;
let stopped = false;

async function tick(slot: number) {
  const missionId = await processNextQueuedMission(`${workerId}-slot-${slot}`);

  if (missionId) {
    console.log(`processed_mission_id=${missionId}`);
    return true;
  }

  console.log("queue_empty");
  return false;
}

async function main() {
  const coordinator = await createQueueCoordinator();

  if (once) {
    await tick(0);
    await coordinator.close();
    return;
  }

  console.log(`worker_started=${workerId}`);
  console.log(`worker_concurrency=${concurrency}`);

  process.on("SIGINT", () => {
    stopped = true;
  });

  process.on("SIGTERM", () => {
    stopped = true;
  });

  while (!stopped) {
    const results = await Promise.all(
      Array.from({ length: concurrency }, (_, index) => tick(index))
    );

    if (!stopped && !results.some(Boolean)) {
      await coordinator.waitForSignal(pollMs);
    }
  }

  await coordinator.close();
  console.log(`worker_stopped=${workerId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
