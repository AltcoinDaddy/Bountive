import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { SurfaceCard } from "@/components/surface-card";
import type { ProofPublishingStatus } from "@/lib/proof-publisher";

function mapValue(status: ProofPublishingStatus["status"]) {
  if (status === "published" || status === "ready") {
    return "passed";
  }

  if (status === "inactive") {
    return "pending";
  }

  return "blocked";
}

export function ProofPublishingCard({
  status
}: {
  status: ProofPublishingStatus;
}) {
  return (
    <SurfaceCard>
      <SectionHeading
        title="Signed And Onchain Proofs"
        description="Proof hashes can be signed locally and optionally anchored onchain through a guarded registry contract."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Publication status</div>
          <div className="mt-2">
            <StatusBadge value={mapValue(status.status)} />
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Network</div>
          <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{status.network}</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4 md:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Registry</div>
          <div className="mt-2 break-all text-sm font-medium text-[var(--foreground)]">{status.registryAddress ?? "No proof registry configured."}</div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-[var(--border)] bg-white p-4 text-sm leading-6 text-[var(--muted-foreground)]">
        {status.note}
        {status.txHash ? (
          <div className="mt-3 break-all font-medium text-[var(--foreground)]">{status.txHash}</div>
        ) : null}
      </div>
    </SurfaceCard>
  );
}
