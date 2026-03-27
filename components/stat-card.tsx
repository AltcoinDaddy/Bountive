import { SurfaceCard } from "@/components/surface-card";

export function StatCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <SurfaceCard className="p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{value}</div>
      <div className="mt-2 text-sm text-[var(--muted-foreground)]">{detail}</div>
    </SurfaceCard>
  );
}
