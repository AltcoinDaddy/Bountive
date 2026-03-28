import { access } from "node:fs/promises";
import { join } from "node:path";
import { MissionStatus, SubmissionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getQueueMetrics } from "@/lib/mission-queue";
import { env } from "@/lib/env";

function getMonitoringRoot() {
  return join(process.cwd(), "artifacts");
}

async function getArtifactHealth() {
  try {
    await access(getMonitoringRoot());
    return {
      status: "passed" as const,
      detail: "Artifact root is writable and present."
    };
  } catch {
    return {
      status: "blocked" as const,
      detail: "Artifact root is missing or inaccessible."
    };
  }
}

async function getDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "passed" as const,
      detail: `Database reachable through ${env.databaseProvider}.`
    };
  } catch (error) {
    return {
      status: "blocked" as const,
      detail: error instanceof Error ? error.message : "Database connectivity check failed."
    };
  }
}

export async function getAlertSummary() {
  const [staleRunning, failedRecent, blockedSubmissions, abortedRecent] = await Promise.all([
    prisma.mission.count({
      where: {
        status: MissionStatus.RUNNING
      }
    }),
    prisma.mission.count({
      where: {
        status: MissionStatus.FAILED
      }
    }),
    prisma.submission.count({
      where: {
        submissionStatus: SubmissionStatus.BLOCKED
      }
    }),
    prisma.mission.count({
      where: {
        status: MissionStatus.ABORTED
      }
    })
  ]);

  const alerts = [
    {
      label: "Failed missions",
      tone: failedRecent > 0 ? "blocked" : "passed",
      detail: `${failedRecent} failed mission${failedRecent === 1 ? "" : "s"} recorded.`
    },
    {
      label: "Blocked submissions",
      tone: blockedSubmissions > 0 ? "blocked" : "passed",
      detail: `${blockedSubmissions} blocked submission artifact${blockedSubmissions === 1 ? "" : "s"} recorded.`
    },
    {
      label: "Running missions",
      tone: staleRunning > 0 ? "pending" : "passed",
      detail: `${staleRunning} mission${staleRunning === 1 ? "" : "s"} currently running.`
    },
    {
      label: "Aborted missions",
      tone: abortedRecent > 0 ? "pending" : "passed",
      detail: `${abortedRecent} mission${abortedRecent === 1 ? "" : "s"} aborted by operator.`
    }
  ];

  return {
    alerts
  };
}

export async function getMonitoringSnapshot() {
  const [database, artifacts, queue, latestMission, latestSubmission, failedMissions, recentEvents] = await Promise.all([
    getDatabaseHealth(),
    getArtifactHealth(),
    getQueueMetrics(),
    prisma.mission.findFirst({
      orderBy: {
        updatedAt: "desc"
      }
    }),
    prisma.submission.findFirst({
      orderBy: {
        updatedAt: "desc"
      }
    }),
    prisma.mission.findMany({
      where: {
        status: MissionStatus.FAILED
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 5
    }),
    prisma.agentEventLog.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 8,
      include: {
        mission: true
      }
    })
  ]);

  const checks = [
    {
      key: "database",
      label: "Database",
      ...database
    },
    {
      key: "artifacts",
      label: "Artifacts",
      ...artifacts
    },
    {
      key: "redis",
      label: "Worker coordination",
      status: env.redisUrl ? "passed" : "pending",
      detail: env.redisUrl
        ? "Redis coordination is configured for worker wake-up events."
        : "Redis coordination is not configured. Workers will rely on polling."
    },
    {
      key: "sandbox",
      label: "Sandbox runtime",
      status: env.sandboxProfile === "docker" ? "passed" : "pending",
      detail: env.sandboxProfile === "docker"
        ? `Docker sandbox enabled with image ${env.dockerSandboxImage}.`
        : "Local guarded sandbox is active. Switch SANDBOX_PROFILE to docker for stronger isolation."
    },
    {
      key: "proof-signing",
      label: "Proof signing",
      status: env.proofSigningKey ? "passed" : "pending",
      detail: env.proofSigningKey
        ? "Proof signing key is configured for signed proof artifacts."
        : "Proof signing is inactive until BOUNTIVE_PROOF_SIGNING_KEY is configured."
    }
  ];

  return {
    checks,
    queue,
    latestMission,
    latestSubmission,
    failedMissions,
    recentEvents
  };
}
