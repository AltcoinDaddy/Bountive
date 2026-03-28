import { env } from "@/lib/env";

const queueChannel = "bountive:missions";

type QueueSignal =
  | { type: "mission_queued"; missionId: string }
  | { type: "mission_recovered"; missionIds: string[] }
  | { type: "mission_aborted"; missionId: string };

type QueueCoordinator = {
  publish: (signal: QueueSignal) => Promise<void>;
  waitForSignal: (timeoutMs: number) => Promise<void>;
  close: () => Promise<void>;
};

type RedisModule = typeof import("redis");

let redisModulePromise: Promise<RedisModule | null> | null = null;

async function loadRedisModule() {
  if (!redisModulePromise) {
    redisModulePromise = import("redis")
      .then((module) => module)
      .catch(() => null);
  }

  return redisModulePromise;
}

export async function createQueueCoordinator(): Promise<QueueCoordinator> {
  if (!env.redisUrl) {
    return {
      async publish() {},
      async waitForSignal(timeoutMs) {
        await new Promise((resolve) => setTimeout(resolve, timeoutMs));
      },
      async close() {}
    };
  }

  const redis = await loadRedisModule();

  if (!redis) {
    return {
      async publish() {},
      async waitForSignal(timeoutMs) {
        await new Promise((resolve) => setTimeout(resolve, timeoutMs));
      },
      async close() {}
    };
  }

  const publisher = redis.createClient({ url: env.redisUrl });
  const subscriber = publisher.duplicate();
  let pendingSignal: (() => void) | null = null;

  await publisher.connect();
  await subscriber.connect();

  await subscriber.subscribe(queueChannel, () => {
    if (pendingSignal) {
      const resolve = pendingSignal;
      pendingSignal = null;
      resolve();
    }
  });

  return {
    async publish(signal) {
      await publisher.publish(queueChannel, JSON.stringify(signal));
    },
    async waitForSignal(timeoutMs) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          pendingSignal = null;
          resolve();
        }, timeoutMs);

        pendingSignal = () => {
          clearTimeout(timer);
          resolve();
        };
      });
    },
    async close() {
      pendingSignal = null;
      await subscriber.unsubscribe(queueChannel);
      await Promise.all([subscriber.quit(), publisher.quit()]);
    }
  };
}
