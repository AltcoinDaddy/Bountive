"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { abortMission, recoverStaleRunningMissions } from "@/lib/mission-queue";
import { enqueueMission, processNextQueuedMission } from "@/lib/orchestrator";
import { requireOperatorSession } from "@/lib/auth";
import { assertLiveMissionConfigured } from "@/lib/live-submission-readiness";
import type { MissionInput } from "@/lib/types";
import { env } from "@/lib/env";
import { updateDefaultWorkspacePolicy } from "@/lib/workspace-manager";

function readBoolean(value: FormDataEntryValue | null) {
  return value === "on";
}

function readNumber(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function revalidateMissionSurfaces() {
  revalidatePath("/dashboard");
  revalidatePath("/missions");
  revalidatePath("/tasks");
  revalidatePath("/timeline");
  revalidatePath("/logs");
  revalidatePath("/identity");
  revalidatePath("/submission");
}

export async function launchMissionAction(formData: FormData) {
  await requireOperatorSession("/missions");
  const payload: MissionInput = {
    title: String(formData.get("title") ?? "Autonomous issue mission"),
    mode: formData.get("mode") === "live" ? "live" : "dry_run",
    labels: String(formData.get("labels") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    retries: readNumber(formData.get("retries"), 2),
    toolCallLimit: readNumber(formData.get("toolCallLimit"), 40),
    modelCallLimit: readNumber(formData.get("modelCallLimit"), 20),
    confidenceThreshold: readNumber(formData.get("confidenceThreshold"), 0.68),
    allowlistedRepos: String(formData.get("allowlistedRepos") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    allowApproveOnFailure: readBoolean(formData.get("allowApproveOnFailure")),
    liveSubmissionEnabled: readBoolean(formData.get("liveSubmissionEnabled")),
    maxCandidates: 12
  };

  try {
    assertLiveMissionConfigured({
      mode: payload.mode,
      liveSubmissionEnabled: payload.liveSubmissionEnabled,
      allowlistedRepos: payload.allowlistedRepos
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mission launch blocked by live-mode guardrails.";
    redirect(`/missions?launchError=${encodeURIComponent(message)}`);
  }

  const missionId = await enqueueMission(payload);

  revalidateMissionSurfaces();

  redirect(`/missions?missionId=${missionId}`);
}

export async function updateWorkspacePolicyAction(formData: FormData) {
  const session = await requireOperatorSession("/missions");
  const operatorEmail = env.authMode === "better-auth"
    ? String(session.operatorEmail ?? "").trim().toLowerCase()
    : String(formData.get("operatorEmail") ?? session.operatorEmail ?? "").trim().toLowerCase();
  const allowedTaskCategories = String(formData.get("allowedTaskCategories") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const maxPatchFiles = Math.max(1, readNumber(formData.get("maxPatchFiles"), 8));

  if (!operatorEmail) {
    redirect("/missions?policyError=Operator%20email%20is%20required.");
  }

  await updateDefaultWorkspacePolicy({
    operatorEmail,
    requireHumanApprovalForLive: readBoolean(formData.get("requireHumanApprovalForLive")),
    allowAutoApproveDryRun: readBoolean(formData.get("allowAutoApproveDryRun")),
    allowApproveFailedChecks: readBoolean(formData.get("allowApproveFailedChecks")),
    maxPatchFiles,
    allowedTaskCategories
  });

  revalidateMissionSurfaces();
  redirect("/missions?policyUpdated=1");
}

export async function processQueuedMissionAction() {
  const missionId = await processNextQueuedMission("manual-operator");

  revalidateMissionSurfaces();

  if (missionId) {
    redirect(`/missions?missionId=${missionId}`);
  }

  redirect("/missions");
}

export async function recoverStaleMissionsAction() {
  await recoverStaleRunningMissions();
  revalidateMissionSurfaces();
  redirect("/missions");
}

export async function abortMissionAction(formData: FormData) {
  const missionId = String(formData.get("missionId") ?? "");

  if (!missionId) {
    redirect("/missions");
  }

  await abortMission(missionId);
  revalidateMissionSurfaces();
  redirect(`/missions?missionId=${missionId}`);
}
