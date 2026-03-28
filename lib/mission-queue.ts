import { MissionStage, MissionStatus, type Mission } from "@prisma/client";
import { env } from "@/lib/env";
import { createQueueCoordinator } from "@/lib/queue-coordinator";
import { logMissionEvent } from "@/lib/mission-store";
import { prisma } from "@/lib/prisma";

function getStaleHeartbeatCutoff() {
  return new Date(Date.now() - env.missionWorkerLeaseMs);
}

export async function claimNextQueuedMission(workerId: string): Promise<Mission | null> {
  const nextMission = await prisma.mission.findFirst({
    where: {
      status: MissionStatus.QUEUED
    },
    orderBy: {
      queuedAt: "asc"
    }
  });

  if (!nextMission) {
    return null;
  }

  const claimResult = await prisma.mission.updateMany({
    where: {
      id: nextMission.id,
      status: MissionStatus.QUEUED
    },
    data: {
      status: MissionStatus.RUNNING,
      startedAt: new Date(),
      workerId,
      lastHeartbeatAt: new Date(),
      failureReason: null
    }
  });

  if (claimResult.count === 0) {
    return null;
  }

  return prisma.mission.findUniqueOrThrow({
    where: {
      id: nextMission.id
    }
  });
}

export async function touchMissionHeartbeat(missionId: string) {
  await prisma.mission.update({
    where: {
      id: missionId
    },
    data: {
      lastHeartbeatAt: new Date()
    }
  });
}

export async function abortMission(missionId: string) {
  const mission = await prisma.mission.findUnique({
    where: {
      id: missionId
    }
  });

  if (!mission) {
    return null;
  }

  const settledStatuses: MissionStatus[] = [MissionStatus.COMPLETED, MissionStatus.FAILED, MissionStatus.ABORTED];

  if (settledStatuses.includes(mission.status)) {
    return mission;
  }

  const updatedMission = await prisma.mission.update({
    where: {
      id: missionId
    },
    data: {
      status: MissionStatus.ABORTED,
      currentStage: MissionStage.HALTED,
      completedAt: mission.status === MissionStatus.QUEUED ? new Date() : undefined,
      failureReason: "Mission aborted by operator."
    }
  });

  await logMissionEvent({
    missionId,
    agentName: "Orchestrator",
    stage: "halted",
    action: "mission_aborted",
    toolName: "queue_control",
    inputSummary: mission.title,
    outputSummary: "Mission was aborted by an operator control.",
    success: false,
    errorMessage: "Mission aborted by operator."
  });

  const coordinator = await createQueueCoordinator();
  await coordinator.publish({
    type: "mission_aborted",
    missionId
  });
  await coordinator.close();

  return updatedMission;
}

export async function getMissionRunState(missionId: string) {
  return prisma.mission.findUnique({
    where: {
      id: missionId
    },
    select: {
      id: true,
      status: true,
      currentStage: true,
      workerId: true,
      lastHeartbeatAt: true
    }
  });
}

export async function recoverStaleRunningMissions() {
  const staleCutoff = getStaleHeartbeatCutoff();
  const staleMissions = await prisma.mission.findMany({
    where: {
      status: MissionStatus.RUNNING,
      OR: [
        {
          lastHeartbeatAt: {
            lt: staleCutoff
          }
        },
        {
          lastHeartbeatAt: null
        }
      ]
    },
    select: {
      id: true
    }
  });

  if (staleMissions.length === 0) {
    return [];
  }

  const staleIds = staleMissions.map((mission) => mission.id);

  await prisma.mission.updateMany({
    where: {
      id: {
        in: staleIds
      },
      status: MissionStatus.RUNNING
    },
    data: {
      status: MissionStatus.FAILED,
      currentStage: MissionStage.HALTED,
      completedAt: new Date(),
      failureReason: "Worker lease expired before the mission finished."
    }
  });

  await Promise.all(
    staleIds.map((missionId) =>
      logMissionEvent({
        missionId,
        agentName: "Orchestrator",
        stage: "halted",
        action: "lease_expired",
        toolName: "worker_lease",
        inputSummary: missionId,
        outputSummary: "Running mission was marked failed because the worker lease expired.",
        success: false,
        errorMessage: "Worker lease expired before the mission finished."
      })
    )
  );

  const coordinator = await createQueueCoordinator();
  await coordinator.publish({
    type: "mission_recovered",
    missionIds: staleIds
  });
  await coordinator.close();

  return staleIds;
}

export async function getQueueMetrics() {
  const staleCutoff = getStaleHeartbeatCutoff();
  const [queued, running, completed, failed, latestQueuedMission, latestRunningMission, staleRunning] = await Promise.all([
    prisma.mission.count({
      where: {
        status: MissionStatus.QUEUED
      }
    }),
    prisma.mission.count({
      where: {
        status: MissionStatus.RUNNING
      }
    }),
    prisma.mission.count({
      where: {
        status: MissionStatus.COMPLETED
      }
    }),
    prisma.mission.count({
      where: {
        status: MissionStatus.FAILED
      }
    }),
    prisma.mission.findFirst({
      where: {
        status: MissionStatus.QUEUED
      },
      orderBy: {
        queuedAt: "asc"
      }
    }),
    prisma.mission.findFirst({
      where: {
        status: MissionStatus.RUNNING
      },
      orderBy: {
        startedAt: "asc"
      }
    }),
    prisma.mission.count({
      where: {
        status: MissionStatus.RUNNING,
        OR: [
          {
            lastHeartbeatAt: {
              lt: staleCutoff
            }
          },
          {
            lastHeartbeatAt: null
          }
        ]
      }
    })
  ]);

  return {
    queued,
    running,
    completed,
    failed,
    nextMissionId: latestQueuedMission?.id ?? null,
    nextMissionTitle: latestQueuedMission?.title ?? null,
    oldestRunningMissionId: latestRunningMission?.id ?? null,
    oldestRunningMissionTitle: latestRunningMission?.title ?? null,
    oldestRunningWorkerId: latestRunningMission?.workerId ?? null,
    staleRunning
  };
}
