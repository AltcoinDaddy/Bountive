import { Github } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { SurfaceCard } from "@/components/surface-card";
import type { LiveRepoValidation } from "@/lib/github/live-validation";

export function LiveRepoValidationCard({
  validation
}: {
  validation: LiveRepoValidation;
}) {
  return (
    <SurfaceCard>
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          title="GitHub Live Validation"
          description="Repository access, token readiness, and allowlist status for guarded live pull request submission."
        />
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-2">
          <Github className="h-5 w-5 text-[var(--primary)]" />
        </div>
      </div>

      <div className="mb-4">
        <StatusBadge value={validation.status} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {validation.checks.map((check) => (
          <div key={check.label} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-medium text-[var(--foreground)]">{check.label}</div>
              <StatusBadge value={check.status} />
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{check.detail}</p>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
