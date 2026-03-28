import { SectionHeading } from "@/components/section-heading";
import { SurfaceCard } from "@/components/surface-card";
import { getRegisteredExecutionAdapters } from "@/lib/execution-adapters";

export function ExecutionCapabilityCard() {
  const adapters = getRegisteredExecutionAdapters();

  return (
    <SurfaceCard>
      <SectionHeading
        title="Execution capabilities"
        description="Deterministic execution adapters Bountive can safely apply today. Tasks outside this registry remain non-mutating."
      />
      <div className="space-y-3">
        {adapters.map((adapter) => (
          <div key={adapter.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--foreground)]">{adapter.label}</div>
                <div className="mt-1 text-sm text-[var(--muted-foreground)]">{adapter.id}</div>
              </div>
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{adapter.taskCategory}</div>
            </div>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
