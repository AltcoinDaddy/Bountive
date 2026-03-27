import { ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { SurfaceCard } from "@/components/surface-card";
import { StatusBadge } from "@/components/status-badge";
import { safeJsonParse } from "@/lib/utils";

export function SafetyPanel({ guardrailsJson }: { guardrailsJson: string | null | undefined }) {
  const guardrails = safeJsonParse<Record<string, unknown>>(guardrailsJson, {});
  const allowlist = Array.isArray(guardrails.allowlistedRepos) ? (guardrails.allowlistedRepos as string[]) : [];

  return (
    <SurfaceCard>
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          title="Safety Model"
          description="Execution is constrained by mission-specific compute budgets, repository allowlists, and dry-run-first defaults."
        />
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-2">
          <ShieldCheck className="h-5 w-5 text-[var(--primary)]" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Mode</div>
          <div className="mt-2">
            <StatusBadge value={String(guardrails.mode ?? "dry_run")} />
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Live Submission</div>
          <div className="mt-2">
            <StatusBadge value={String(Boolean(guardrails.liveSubmission) ? "live_pending" : "draft_ready")} />
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Budgets</div>
          <div className="mt-2 text-sm leading-6 text-[var(--foreground)]">
            {String(guardrails.maxModelCalls ?? "—")} model calls, {String(guardrails.maxToolCalls ?? "—")} tool calls, {String(guardrails.maxRetries ?? "—")} retries
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Allowlist</div>
          <div className="mt-2 text-sm leading-6 text-[var(--foreground)]">
            {allowlist.length > 0 ? allowlist.join(", ") : "No repositories configured."}
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}
