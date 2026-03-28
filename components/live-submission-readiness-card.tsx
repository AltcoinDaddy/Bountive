import { Activity, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { SurfaceCard } from "@/components/surface-card";
import { getLiveSubmissionReadiness } from "@/lib/live-submission-readiness";

type LiveSubmissionReadinessCardProps = {
  missionConfig?: Record<string, unknown> | null;
  selectedRepo?: string | null;
};

function normalizeAllowlist(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function mapStatusValue(value: "ready" | "blocked" | "inactive") {
  if (value === "ready") {
    return "passed";
  }

  if (value === "blocked") {
    return "blocked";
  }

  return "dry_run";
}

export function LiveSubmissionReadinessCard({
  missionConfig,
  selectedRepo
}: LiveSubmissionReadinessCardProps) {
  const readiness = getLiveSubmissionReadiness({
    mode: missionConfig?.mode === "live" ? "live" : "dry_run",
    liveSubmissionEnabled: missionConfig?.liveSubmissionEnabled === true,
    allowlistedRepos: normalizeAllowlist(missionConfig?.allowlistedRepos),
    selectedRepo: selectedRepo ?? null
  });

  return (
    <SurfaceCard>
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          title="Live Submission Readiness"
          description="This preflight view shows whether the current mission can move beyond draft artifacts and publish a guarded GitHub draft pull request."
        />
        <div className="flex items-center gap-3">
          <StatusBadge value={mapStatusValue(readiness.status)} />
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-2">
            <ShieldCheck className="h-5 w-5 text-[var(--primary)]" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
          <Activity className="h-4 w-4 text-[var(--primary)]" />
          {readiness.headline}
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{readiness.summary}</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {readiness.checks.map((check) => (
          <div key={check.key} className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-medium text-[var(--foreground)]">{check.label}</div>
              <StatusBadge value={mapStatusValue(check.state)} />
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{check.detail}</p>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
