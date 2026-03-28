import type { IdentityRecord, MissionMode } from "@prisma/client";
import { SectionHeading } from "@/components/section-heading";
import { SurfaceCard } from "@/components/surface-card";
import { StatusBadge } from "@/components/status-badge";

function normalizeMode(mode: MissionMode | null | undefined) {
  return mode === "LIVE" ? "live" : "dry_run";
}

function getRegistrationStatus(identity: IdentityRecord) {
  return identity.registrationTxHash ? "approved" : "pending";
}

export function IdentityCard({
  identity,
  currentMode
}: {
  identity: IdentityRecord | null | undefined;
  currentMode: MissionMode | null | undefined;
}) {
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
            <div className="mt-2"><StatusBadge value={normalizeMode(currentMode)} /></div>
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
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Registration Status</div>
            <div className="mt-2"><StatusBadge value={getRegistrationStatus(identity)} /></div>
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
