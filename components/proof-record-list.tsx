import type { ProofRecord } from "@prisma/client";
import { SectionHeading } from "@/components/section-heading";
import { SurfaceCard } from "@/components/surface-card";
import { formatDate } from "@/lib/utils";

export function ProofRecordList({
  proofs
}: {
  proofs: Array<ProofRecord & { mission?: { title: string } | null }>;
}) {
  return (
    <SurfaceCard>
      <SectionHeading title="Proof Records" description="Mission-linked verification hashes and identity-linked completion metadata." />
      {proofs.length > 0 ? (
        <div className="space-y-3">
          {proofs.map((proof) => (
            <div key={proof.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--foreground)]">{proof.mission?.title ?? proof.issueUrl}</div>
                  <div className="mt-1 text-sm text-[var(--muted-foreground)]">{proof.repoUrl}</div>
                </div>
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{formatDate(proof.createdAt)}</div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-white p-3 text-xs leading-6 text-[var(--foreground)]">
                  <div className="font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Verification Hash</div>
                  <div className="mt-2 break-all">{proof.verificationHash}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white p-3 text-xs leading-6 text-[var(--foreground)]">
                  <div className="font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Log Hash</div>
                  <div className="mt-2 break-all">{proof.logHash}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-[var(--muted-foreground)]">No proof records generated yet.</div>
      )}
    </SurfaceCard>
  );
}
