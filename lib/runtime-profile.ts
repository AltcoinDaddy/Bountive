import { env } from "@/lib/env";

export function getRuntimeProfile() {
  return {
    databaseProvider: env.databaseProvider,
    redisConfigured: Boolean(env.redisUrl),
    workerConcurrency: env.missionWorkerConcurrency,
    workerPollMs: env.missionWorkerPollMs,
    workerLeaseMs: env.missionWorkerLeaseMs
  };
}
