import type { AgentEventLog, Mission } from "@prisma/client";
import { SectionHeading } from "@/components/section-heading";
import { SurfaceCard } from "@/components/surface-card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

type TimelineRow = AgentEventLog & {
  mission: Mission;
};

export function TimelineList({ events }: { events: TimelineRow[] }) {
  return (
    <SurfaceCard>
      <SectionHeading title="Execution Timeline" description="Chronological lifecycle records for discover, plan, execute, verify, and submit." />
      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--foreground)]">{event.stage}</div>
                  <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {event.agentName} · {event.action.replaceAll("_", " ")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={event.success ? "completed" : "failed"} />
                  <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{formatDate(event.createdAt)}</span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{event.outputSummary ?? event.errorMessage ?? "No output summary recorded."}</p>
              <div className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Mission {event.mission.title} · Retry {event.retryIndex}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-[var(--muted-foreground)]">No timeline events have been logged yet.</div>
      )}
    </SurfaceCard>
  );
}
