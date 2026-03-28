import { Siren } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { SurfaceCard } from "@/components/surface-card";

type AlertCenterCardProps = {
  alerts: Array<{
    label: string;
    tone: string;
    detail: string;
  }>;
};

export function AlertCenterCard({ alerts }: AlertCenterCardProps) {
  return (
    <SurfaceCard>
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          title="Alert Center"
          description="Operational alerts derived from mission failures, blocked submissions, running workload, and operator interventions."
        />
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-2">
          <Siren className="h-5 w-5 text-[var(--primary)]" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {alerts.map((alert) => (
          <div key={alert.label} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-medium text-[var(--foreground)]">{alert.label}</div>
              <StatusBadge value={alert.tone} />
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{alert.detail}</p>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
