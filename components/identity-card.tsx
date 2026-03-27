import type { IdentityRecord } from "@prisma/client";
import { SectionHeading } from "@/components/section-heading";
import { SurfaceCard } from "@/components/surface-card";
import { StatusBadge } from "@/components/status-badge";

export function IdentityCard({ identity }: { identity: IdentityRecord | null | undefined }) {
  return (
    <SurfaceCard>
      <SectionHeading title="Operator Identity" description="Wallet, network, manifest, and registration metadata for the current autonomous operator." />
      {identity ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Agent Name</div>
            <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{identity.agentName}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Current Mode</div>
            <div className="mt-2"><StatusBadge value="dry_run" /></div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Operator Wallet</div>
            <div className="mt-2 break-all text-sm font-medium text-[var(--foreground)]">{identity.operatorWallet}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Network</div>
            <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{identity.network}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Identity Reference</div>
            <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{identity.identityReference}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Registration Tx Hash</div>
            <div className="mt-2 break-all text-sm font-medium text-[var(--foreground)]">{identity.registrationTxHash ?? "Not registered yet."}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4 md:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Manifest URI</div>
            <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{identity.manifestUri ?? "No manifest URI recorded."}</div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-[var(--muted-foreground)]">No identity record is configured yet.</div>
      )}
    </SurfaceCard>
  );
}
