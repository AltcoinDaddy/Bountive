import type { Mission, Submission, VerificationReport } from "@prisma/client";
import { SurfaceCard } from "@/components/surface-card";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatDuration } from "@/lib/utils";

type MissionHistoryRow = Mission & {
  verificationReport: VerificationReport | null;
  submission: Submission | null;
};

export function MissionHistoryTable({ missions }: { missions: MissionHistoryRow[] }) {
  return (
    <SurfaceCard>
      <SectionHeading title="Mission History" description="Past mission runs with stage, verification, compute usage, and submission readiness." />
      {missions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)] text-left">
            <thead>
              <tr className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                <th className="px-3 py-3 font-semibold">Mission</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Mode</th>
                <th className="px-3 py-3 font-semibold">Stage</th>
                <th className="px-3 py-3 font-semibold">Verification</th>
                <th className="px-3 py-3 font-semibold">Compute</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {missions.map((mission) => (
                <tr key={mission.id} className="align-top">
                  <td className="px-3 py-4">
                    <div className="text-sm font-semibold text-[var(--foreground)]">{mission.title}</div>
                    <div className="mt-1 text-sm text-[var(--muted-foreground)]">{mission.selectedRepo ?? "No repository selected yet."}</div>
                  </td>
                  <td className="px-3 py-4"><StatusBadge value={mission.status} /></td>
                  <td className="px-3 py-4"><StatusBadge value={mission.mode} /></td>
                  <td className="px-3 py-4"><StatusBadge value={mission.currentStage} /></td>
                  <td className="px-3 py-4">
                    <StatusBadge value={mission.verificationReport?.qaDecision ?? "pending"} />
                  </td>
                  <td className="px-3 py-4 text-sm leading-6 text-[var(--muted-foreground)]">
                    {mission.modelCallsUsed} model / {mission.toolCallsUsed} tool
                    <br />
                    {formatDuration(mission.durationMs)}
                  </td>
                  <td className="px-3 py-4 text-sm text-[var(--muted-foreground)]">{formatDate(mission.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-sm text-[var(--muted-foreground)]">No mission history yet.</div>
      )}
    </SurfaceCard>
  );
}
