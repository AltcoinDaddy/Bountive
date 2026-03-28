import { Database, ServerCog } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { SurfaceCard } from "@/components/surface-card";

type RuntimeProfileCardProps = {
  profile: {
    databaseProvider: string;
    redisConfigured: boolean;
    workerConcurrency: number;
    workerPollMs: number;
    workerLeaseMs: number;
  };
};

export function RuntimeProfileCard({ profile }: RuntimeProfileCardProps) {
  return (
    <SurfaceCard>
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          title="Runtime Infrastructure"
          description="Current persistence, queue coordination, and worker runtime settings for this deployment."
        />
        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-2">
            <Database className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-2">
            <ServerCog className="h-5 w-5 text-[var(--primary)]" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Database</div>
          <div className="mt-2"><StatusBadge value={profile.databaseProvider} /></div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Redis Coordination</div>
          <div className="mt-2"><StatusBadge value={profile.redisConfigured ? "approved" : "pending"} /></div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Worker Concurrency</div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{profile.workerConcurrency}</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Poll Interval</div>
          <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{profile.workerPollMs}ms</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Lease Window</div>
          <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{profile.workerLeaseMs}ms</div>
        </div>
      </div>
    </SurfaceCard>
  );
}
