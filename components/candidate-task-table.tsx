import type { CandidateTask, Mission } from "@prisma/client";
import { SectionHeading } from "@/components/section-heading";
import { SurfaceCard } from "@/components/surface-card";
import { StatusBadge } from "@/components/status-badge";
import { safeJsonParse } from "@/lib/utils";

type CandidateTaskRow = CandidateTask & {
  mission: Mission;
};

export function CandidateTaskTable({ tasks }: { tasks: CandidateTaskRow[] }) {
  return (
    <SurfaceCard>
      <SectionHeading title="Candidate Tasks" description="Discovered issues with score, confidence, selection state, and explicit rationale." />
      {tasks.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)] text-left">
            <thead>
              <tr className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                <th className="px-3 py-3 font-semibold">Issue</th>
                <th className="px-3 py-3 font-semibold">Score</th>
                <th className="px-3 py-3 font-semibold">Confidence</th>
                <th className="px-3 py-3 font-semibold">Execution</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {tasks.map((task) => {
                const labels = safeJsonParse<string[]>(task.labels, []);

                return (
                  <tr key={task.id} className="align-top">
                    <td className="px-3 py-4">
                      <div className="text-sm font-semibold text-[var(--foreground)]">{task.repo}#{task.issueNumber}</div>
                      <a href={task.issueUrl} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-[var(--primary)] hover:underline">
                        {task.issueTitle}
                      </a>
                      <div className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">{labels.join(" · ")}</div>
                    </td>
                    <td className="px-3 py-4 text-sm font-semibold text-[var(--foreground)]">{task.score.toFixed(0)}</td>
                    <td className="px-3 py-4 text-sm font-semibold text-[var(--foreground)]">{task.confidence.toFixed(2)}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-col gap-2">
                        <StatusBadge value={task.executionSupported ? "supported" : "unsupported"} />
                        <div className="text-xs leading-5 text-[var(--muted-foreground)]">
                          {task.executionAdapterId ?? "No adapter matched"}
                        </div>
                        <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                          {task.taskCategory ?? "Unclassified"}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4"><StatusBadge value={task.status} /></td>
                    <td className="px-3 py-4 text-sm leading-6 text-[var(--muted-foreground)]">
                      {task.reasonSelected ?? task.reasonRejected ?? "No rationale recorded."}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-sm text-[var(--muted-foreground)]">No candidate tasks recorded yet.</div>
      )}
    </SurfaceCard>
  );
}
