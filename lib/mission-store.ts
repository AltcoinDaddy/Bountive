import { MissionMode, MissionStage, MissionStatus, SubmissionStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { appendGeneratedAgentLog, writeArtifact } from "@/lib/artifacts";
import { env } from "@/lib/env";
import { safeJsonParse } from "@/lib/utils";
import type { MissionInput } from "@/lib/types";
import { ensureDefaultWorkspace } from "@/lib/workspace-manager";

export async function createMission(
  input: MissionInput,
  guardrailsJson: string,
  options?: {
    queued?: boolean;
    workerId?: string | null;
  }
) {
  const queued = options?.queued ?? false;
  const workspace = await ensureDefaultWorkspace();

  return prisma.mission.create({
    data: {
      workspaceId: workspace.id,
      title: input.title,
      mode: input.mode === "live" ? MissionMode.LIVE : MissionMode.DRY_RUN,
      status: queued ? MissionStatus.QUEUED : MissionStatus.RUNNING,
      currentStage: MissionStage.DISCOVER,
      retriesUsed: 0,
      modelCallsUsed: 0,
      toolCallsUsed: 0,
      confidenceThreshold: input.confidenceThreshold,
      toolCallLimit: input.toolCallLimit,
      modelCallLimit: input.modelCallLimit,
      allowLiveSubmission: input.liveSubmissionEnabled && input.mode === "live",
      allowApproveOnFailure: input.allowApproveOnFailure,
      maxRetries: input.retries,
      guardrailsJson,
      configJson: JSON.stringify(input),
      queuedAt: new Date(),
      startedAt: queued ? null : new Date(),
      workerId: queued ? null : options?.workerId ?? null,
      lastHeartbeatAt: queued ? null : new Date(),
      failureReason: null
    }
  });
}

export async function logMissionEvent(input: {
  missionId: string;
  agentName: string;
  stage: string;
  action: string;
  toolName?: string;
  inputSummary?: string;
  outputSummary?: string;
  success?: boolean;
  errorMessage?: string;
  retryIndex?: number;
}) {
  const event = await prisma.agentEventLog.create({
    data: {
      missionId: input.missionId,
      agentName: input.agentName,
      stage: input.stage,
      action: input.action,
      toolName: input.toolName ?? null,
      inputSummary: input.inputSummary ?? null,
      outputSummary: input.outputSummary ?? null,
      success: input.success ?? true,
      errorMessage: input.errorMessage ?? null,
      retryIndex: input.retryIndex ?? 0
    }
  });

  await appendGeneratedAgentLog(event);
  return event;
}

export async function updateMissionState(
  missionId: string,
  data: Prisma.MissionUncheckedUpdateInput
) {
  return prisma.mission.update({
    where: { id: missionId },
    data
  });
}

export async function finalizeMissionArtifacts(missionId: string) {
  const mission = await prisma.mission.findUniqueOrThrow({
    where: { id: missionId },
    include: {
      candidateTasks: true,
      eventLogs: {
        orderBy: { createdAt: "asc" }
      },
      verificationReport: true,
      submission: true,
      proofRecords: true
    }
  });

  await writeArtifact(`missions/${missionId}.summary.json`, mission);
  return mission;
}

export async function getMissionSummary(missionId: string) {
  return prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      candidateTasks: true,
      eventLogs: {
        orderBy: { createdAt: "asc" }
      },
      verificationReport: true,
      submission: true,
      proofRecords: {
        include: {
          identityRecord: true
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });
}

export async function getMissionById(missionId: string) {
  return prisma.mission.findUnique({
    where: {
      id: missionId
    }
  });
}

export async function getDashboardData() {
  const [missions, identity, latestSubmission, proofs, latestMission, queuedMissionCount, runningMissionCount, workspace] = await Promise.all([
    prisma.mission.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        verificationReport: true,
        submission: true
      }
    }),
    prisma.identityRecord.findFirst({
      orderBy: { createdAt: "desc" }
    }),
    prisma.submission.findFirst({
      orderBy: { updatedAt: "desc" }
    }),
    prisma.proofRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 6
    }),
    prisma.mission.findFirst({
      orderBy: { updatedAt: "desc" },
      include: {
        verificationReport: true,
        submission: true,
        candidateTasks: {
          where: { status: "SELECTED" }
        },
        eventLogs: {
          orderBy: { createdAt: "desc" },
          take: 8
        }
      }
    }),
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
    prisma.workspace.findFirst({
      include: {
        approvalPolicy: true
      }
    })
  ]);

  const totals = missions.reduce(
    (acc, mission) => {
      acc.modelCallsUsed += mission.modelCallsUsed;
      acc.toolCallsUsed += mission.toolCallsUsed;
      acc.durationMs += mission.durationMs;
      acc.candidateTasksScanned += mission.candidateTasksScanned;
      return acc;
    },
    {
      modelCallsUsed: 0,
      toolCallsUsed: 0,
      durationMs: 0,
      candidateTasksScanned: 0
    }
  );

  return {
    missions,
    identity,
    latestSubmission,
    proofs,
    latestMission,
    workspace,
    queue: {
      queuedMissionCount,
      runningMissionCount
    },
    totals
  };
}

export async function getMissionHistory() {
  return prisma.mission.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      verificationReport: true,
      submission: true
    }
  });
}

export async function getCandidateTasks() {
  return prisma.candidateTask.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      mission: true
    }
  });
}

export async function getTimelineEvents() {
  return prisma.agentEventLog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      mission: true
    }
  });
}

export async function getLogData() {
  return prisma.agentEventLog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      mission: true
    }
  });
}

export async function getIdentityData() {
  const [identity, proofs, latestMission] = await Promise.all([
    prisma.identityRecord.findFirst({
      orderBy: { createdAt: "desc" }
    }),
    prisma.proofRecord.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        mission: true,
        identityRecord: true
      }
    }),
    prisma.mission.findFirst({
      orderBy: { updatedAt: "desc" }
    })
  ]);

  return {
    identity,
    proofs,
    currentMode: latestMission?.mode ?? (env.defaultMissionMode === "live" ? MissionMode.LIVE : MissionMode.DRY_RUN)
  };
}

export async function getSubmissionData() {
  return prisma.submission.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      mission: true
    }
  });
}

export function readMissionConfig(configJson: string | null) {
  return safeJsonParse<Record<string, unknown>>(configJson, {});
}

export function isSubmissionReady(status: SubmissionStatus) {
  return status === SubmissionStatus.DRAFT_READY || status === SubmissionStatus.LIVE_SUBMITTED;
}
