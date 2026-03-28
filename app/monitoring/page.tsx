import { unstable_noStore as noStore } from "next/cache";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { SurfaceCard } from "@/components/surface-card";
import { getMonitoringSnapshot } from "@/lib/monitoring";
import { formatDate } from "@/lib/utils";

export default async function MonitoringPage() {
  noStore();
  const snapshot = await getMonitoringSnapshot();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Monitoring and alerting"
        description="Track runtime health, queue coordination, proof-signing readiness, and recent operational signals before expanding public production usage."
      />

      <SurfaceCard>
        <SectionHeading title="Runtime health" description="Core system checks covering persistence, artifacts, worker coordination, sandboxing, and proof readiness." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {snapshot.checks.map((check) => (
            <div key={check.key} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-medium text-[var(--foreground)]">{check.label}</div>
                <StatusBadge value={check.status} />
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{check.detail}</p>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
        <SurfaceCard>
          <SectionHeading title="Queue state" description="Current worker-visible mission backlog and latest lifecycle state." />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Queued missions</div>
              <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{snapshot.queue.queued}</div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Running missions</div>
              <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{snapshot.queue.running}</div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4 sm:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Latest mission</div>
              <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{snapshot.latestMission?.title ?? "No mission recorded yet."}</div>
              <div className="mt-2 text-sm text-[var(--muted-foreground)]">
                {snapshot.latestMission
                  ? `${snapshot.latestMission.status.replaceAll("_", " ")} • ${snapshot.latestMission.currentStage.replaceAll("_", " ")}`
                  : "Seed or launch a mission to begin tracking runtime health."}
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading title="Recent events" description="Latest orchestrator, worker, and agent events recorded through the control plane." />
          <div className="space-y-3">
            {snapshot.recentEvents.length > 0 ? (
              snapshot.recentEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-[var(--foreground)]">
                        {event.agentName} · {event.action.replaceAll("_", " ")}
                      </div>
                      <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {event.mission?.title ?? event.missionId} · {event.stage}
                      </div>
                    </div>
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{formatDate(event.createdAt)}</div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{event.outputSummary ?? event.inputSummary ?? "No summary recorded."}</p>
                </div>
              ))
            ) : (
              <div className="text-sm text-[var(--muted-foreground)]">No recent events recorded yet.</div>
            )}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <SectionHeading title="Failure review" description="Recent failed missions and blocked submissions that still need operator attention." />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Latest submission</div>
            <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{snapshot.latestSubmission?.prTitle ?? "No submission recorded yet."}</div>
            <div className="mt-2 text-sm text-[var(--muted-foreground)]">
              {snapshot.latestSubmission ? snapshot.latestSubmission.submissionStatus.replaceAll("_", " ") : "Submission artifacts will appear here after mission completion."}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Failed missions</div>
            <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{snapshot.failedMissions.length}</div>
            <div className="mt-2 text-sm text-[var(--muted-foreground)]">
              {snapshot.failedMissions.length > 0
                ? snapshot.failedMissions.map((mission) => mission.title).join(", ")
                : "No failed missions recorded in the current workspace."}
            </div>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
