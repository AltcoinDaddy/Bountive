import { SurfaceCard } from "@/components/surface-card";

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <SurfaceCard className="border-dashed">
      <div className="text-base font-semibold text-[var(--foreground)]">{title}</div>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
    </SurfaceCard>
  );
}
