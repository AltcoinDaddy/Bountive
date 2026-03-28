import { NextResponse } from "next/server";
import { getMonitoringSnapshot } from "@/lib/monitoring";

export async function GET() {
  const snapshot = await getMonitoringSnapshot();
  const status = snapshot.checks.some((check) => check.status === "blocked")
    ? "degraded"
    : snapshot.checks.some((check) => check.status === "pending")
      ? "pending"
      : "ok";

  return NextResponse.json({
    status,
    checks: snapshot.checks,
    queue: snapshot.queue,
    latestMission: snapshot.latestMission
      ? {
          id: snapshot.latestMission.id,
          title: snapshot.latestMission.title,
          status: snapshot.latestMission.status,
          currentStage: snapshot.latestMission.currentStage
        }
      : null
  });
}
