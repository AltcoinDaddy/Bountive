"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runMission } from "@/lib/orchestrator";
import type { MissionInput } from "@/lib/types";

function readBoolean(value: FormDataEntryValue | null) {
  return value === "on";
}

function readNumber(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function launchMissionAction(formData: FormData) {
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

  const missionId = await runMission(payload);

  revalidatePath("/dashboard");
  revalidatePath("/missions");
  revalidatePath("/tasks");
  revalidatePath("/timeline");
  revalidatePath("/logs");
  revalidatePath("/identity");
  revalidatePath("/submission");

  redirect(`/missions?missionId=${missionId}`);
}
