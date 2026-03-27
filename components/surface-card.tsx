import { cn } from "@/lib/utils";

export function SurfaceCard({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[24px] border border-[var(--border)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[var(--shadow)]",
        className
      )}
    >
      {children}
    </section>
  );
}
