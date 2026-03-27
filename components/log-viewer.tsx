import type { AgentEventLog, Mission } from "@prisma/client";
import { SectionHeading } from "@/components/section-heading";
import { SurfaceCard } from "@/components/surface-card";
import { formatDate } from "@/lib/utils";

type LogRow = AgentEventLog & {
  mission: Mission;
};

export function LogViewer({ logs }: { logs: LogRow[] }) {
  return (
    <SurfaceCard>
      <SectionHeading title="Structured Logs" description="Execution records rendered in human-readable form and as raw JSON for debugging and auditability." />
      {logs.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
                <div className="flex flex-col gap-1 text-sm">
                  <div className="font-semibold text-[var(--foreground)]">{log.agentName}</div>
                  <div className="text-[var(--muted-foreground)]">{log.stage} · {log.action.replaceAll("_", " ")}</div>
                  <div className="text-[var(--muted-foreground)]">{formatDate(log.createdAt)} · mission {log.mission.title}</div>
                </div>
                <div className="mt-3 text-sm leading-6 text-[var(--foreground)]">{log.outputSummary ?? log.errorMessage ?? "No output summary recorded."}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[#f7f9fc] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Raw JSON</div>
            <pre className="mt-3 max-h-[700px] overflow-auto text-xs leading-6 text-[var(--foreground)]">
              {JSON.stringify(logs, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <div className="text-sm text-[var(--muted-foreground)]">No logs have been captured yet.</div>
      )}
    </SurfaceCard>
  );
}
