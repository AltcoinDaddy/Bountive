import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
  {
    variants: {
      tone: {
        neutral: "border-[var(--border)] bg-white text-[var(--muted-foreground)]",
        primary: "border-[rgba(31,58,95,0.18)] bg-[var(--primary-soft)] text-[var(--primary)]",
        success: "border-[rgba(31,58,95,0.18)] bg-[#eef4fa] text-[var(--success)]",
        warning: "border-[rgba(180,83,9,0.18)] bg-[#fff7ed] text-[var(--warning)]",
        danger: "border-[rgba(180,35,24,0.18)] bg-[#fef3f2] text-[var(--error)]"
      }
    },
    defaultVariants: {
      tone: "neutral"
    }
  }
);

function inferTone(value: string) {
  const lower = value.toLowerCase();

  if (["completed", "approved", "passed", "draft_ready", "live_submitted", "selected"].includes(lower)) {
    return "success" as const;
  }

  if (["running", "pending", "verify", "submit", "retry_required", "skipped", "live_pending"].includes(lower)) {
    return "warning" as const;
  }

  if (["failed", "aborted", "rejected", "blocked", "halted"].includes(lower)) {
    return "danger" as const;
  }

  if (["dry_run", "discover", "plan", "execute", "complete", "live"].includes(lower)) {
    return "primary" as const;
  }

  return "neutral" as const;
}

export function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) {
    return <span className={badgeVariants({ tone: "neutral" })}>unknown</span>;
  }

  return (
    <span className={cn(badgeVariants({ tone: inferTone(value) }))}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
