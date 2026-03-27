import type { AgentEventLog } from "@prisma/client";
import { SectionHeading } from "@/components/section-heading";
import { SurfaceCard } from "@/components/surface-card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export function EventFeed({ events }: { events: AgentEventLog[] }) {
  return (
    <SurfaceCard>
      <SectionHeading title="Recent Events" description="Timestamped mission events with the responsible agent, action summary, and outcome." />
      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--foreground)]">{event.agentName}</div>
                  <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {event.action.replaceAll("_", " ")} · {event.stage}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={event.success ? "completed" : "failed"} />
                  <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{formatDate(event.createdAt)}</span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{event.outputSummary ?? event.errorMessage ?? "No output summary recorded."}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-[var(--muted-foreground)]">No events recorded yet.</div>
      )}
    </SurfaceCard>
  );
}
