import type { VerificationReport } from "@prisma/client";
import { SectionHeading } from "@/components/section-heading";
import { SurfaceCard } from "@/components/surface-card";
import { StatusBadge } from "@/components/status-badge";

export function VerificationPanel({ report }: { report: VerificationReport | null | undefined }) {
  return (
    <SurfaceCard>
      <SectionHeading
        title="Verification"
        description="Bountive treats install, build, lint, and test outcomes as approval gates unless policy explicitly loosens them."
      />
      {report ? (
        <div className="grid gap-3 md:grid-cols-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Install</div>
            <div className="mt-2"><StatusBadge value={report.installStatus} /></div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Build</div>
            <div className="mt-2"><StatusBadge value={report.buildStatus} /></div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Lint</div>
            <div className="mt-2"><StatusBadge value={report.lintStatus} /></div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Test</div>
            <div className="mt-2"><StatusBadge value={report.testStatus} /></div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Decision</div>
            <div className="mt-2"><StatusBadge value={report.qaDecision} /></div>
          </div>
          <div className="md:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Baseline</div>
            <div className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{report.baselineSummary || "No baseline snapshot recorded."}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Regression</div>
            <div className="mt-2"><StatusBadge value={report.regressionDetected ? "failed" : "passed"} /></div>
          </div>
          <div className="md:col-span-4 rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
            {report.qaNotes}
          </div>
        </div>
      ) : (
        <div className="text-sm text-[var(--muted-foreground)]">No verification report has been produced yet.</div>
      )}
    </SurfaceCard>
  );
}
