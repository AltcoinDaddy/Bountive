import type { Mission } from "@prisma/client";
import { Ban, GaugeCircle } from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { SurfaceCard } from "@/components/surface-card";
import { formatDate } from "@/lib/utils";

type MissionOperationsCardProps = {
  mission: Mission;
  abortAction: (formData: FormData) => void;
};

export function MissionOperationsCard({
  mission,
  abortAction
}: MissionOperationsCardProps) {
  const canAbort = mission.status === "QUEUED" || mission.status === "RUNNING";

  return (
    <SurfaceCard>
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          title="Mission Operations"
          description="Operator controls for the selected mission, including current worker assignment, heartbeat state, and abort handling."
        />
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-2">
          <GaugeCircle className="h-5 w-5 text-[var(--primary)]" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Status</div>
          <div className="mt-2"><StatusBadge value={mission.status} /></div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Worker</div>
          <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{mission.workerId ?? "Not claimed yet."}</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Queued At</div>
          <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{formatDate(mission.queuedAt)}</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Last Heartbeat</div>
          <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
            {mission.lastHeartbeatAt ? formatDate(mission.lastHeartbeatAt) : "No heartbeat recorded yet."}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
          <Ban className="h-4 w-4 text-[var(--error)]" />
          Abort control
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          Abort queued missions immediately, or signal running missions to stop at the next safe lifecycle boundary.
        </p>
        <form action={abortAction} className="mt-4">
          <input type="hidden" name="missionId" value={mission.id} />
          <FormSubmitButton
            label={canAbort ? "Abort selected mission" : "Mission already settled"}
            pendingLabel="Aborting mission..."
            disabled={!canAbort}
          />
        </form>
      </div>
    </SurfaceCard>
  );
}
