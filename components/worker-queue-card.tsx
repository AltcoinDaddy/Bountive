import { Cpu, PlayCircle } from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { SectionHeading } from "@/components/section-heading";
import { SurfaceCard } from "@/components/surface-card";

type WorkerQueueCardProps = {
  queue: {
    queued: number;
    running: number;
    completed: number;
    failed: number;
    nextMissionId: string | null;
    nextMissionTitle: string | null;
    oldestRunningMissionId: string | null;
    oldestRunningMissionTitle: string | null;
    oldestRunningWorkerId: string | null;
    staleRunning: number;
  };
  processAction: () => void;
  recoverAction: () => void;
};

export function WorkerQueueCard({ queue, processAction, recoverAction }: WorkerQueueCardProps) {
  return (
    <SurfaceCard>
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          title="Worker Queue"
          description="Missions launched from the app are queued first. Process them with a worker loop in production, or run the next queued mission manually from this panel while operating locally."
        />
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-2">
          <Cpu className="h-5 w-5 text-[var(--primary)]" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Queued</div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{queue.queued}</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Running</div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{queue.running}</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Completed</div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{queue.completed}</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Failed</div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{queue.failed}</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Stale Running</div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{queue.staleRunning}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Next queued mission</div>
          <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
            {queue.nextMissionTitle ?? "No mission is waiting in the queue."}
          </div>
          <div className="mt-2 text-sm text-[var(--muted-foreground)]">
            {queue.nextMissionId ?? "Start by queueing a mission from the launcher above."}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Oldest running mission</div>
          <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
            {queue.oldestRunningMissionTitle ?? "No mission is currently running."}
          </div>
          <div className="mt-2 text-sm text-[var(--muted-foreground)]">
            {queue.oldestRunningMissionId ?? "Worker activity will appear here once a mission is claimed."}
          </div>
          <div className="mt-2 text-sm text-[var(--muted-foreground)]">
            {queue.oldestRunningWorkerId ? `Worker: ${queue.oldestRunningWorkerId}` : "No worker assigned."}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
            <PlayCircle className="h-4 w-4 text-[var(--primary)]" />
            Local worker options
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            For a dedicated worker loop, run <code className="rounded bg-[var(--panel-muted)] px-1.5 py-0.5 text-xs text-[var(--foreground)]">npm run mission:worker</code>. For a one-off local drain, run the next queued mission directly from this panel.
          </p>
          <form action={processAction} className="mt-4">
            <FormSubmitButton label="Run next queued mission" pendingLabel="Processing queue..." />
          </form>
          <form action={recoverAction} className="mt-3">
            <FormSubmitButton
              label="Recover stale missions"
              pendingLabel="Recovering stale missions..."
              disabled={queue.staleRunning === 0}
            />
          </form>
        </div>
      </div>
    </SurfaceCard>
  );
}
