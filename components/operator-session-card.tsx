import { BetterAuthSignOutButton } from "@/components/better-auth-sign-out-button";
import { FormSubmitButton } from "@/components/form-submit-button";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { SurfaceCard } from "@/components/surface-card";

type OperatorSessionCardProps = {
  session: {
    authMode: string;
    operatorName: string | null;
    operatorEmail: string | null;
    isAuthenticated: boolean;
    source: "better-auth" | "cookie" | "environment" | "none";
  };
  signOutAction?: (formData: FormData) => void;
};

export function OperatorSessionCard({ session, signOutAction }: OperatorSessionCardProps) {
  return (
    <SurfaceCard>
      <SectionHeading
        title="Operator Session"
        description="Local operator identity used for protected app access, mission launches, and workspace policy management."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Auth mode</div>
          <div className="mt-2">
            <StatusBadge value={session.authMode} />
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Session status</div>
          <div className="mt-2">
            <StatusBadge value={session.isAuthenticated ? "approved" : "blocked"} />
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Session source</div>
          <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{session.source}</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Operator</div>
          <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{session.operatorName ?? "Bountive operator"}</div>
          <div className="mt-2 break-all text-sm text-[var(--muted-foreground)]">{session.operatorEmail ?? "No operator session"}</div>
        </div>
      </div>

      <div className="mt-4">
        {session.authMode === "better-auth" ? (
          <BetterAuthSignOutButton next="/auth/sign-in" />
        ) : signOutAction ? (
          <form action={signOutAction}>
            <input type="hidden" name="next" value="/auth/sign-in" />
            <FormSubmitButton label="Clear local session" pendingLabel="Clearing session..." />
          </form>
        ) : null}
      </div>
    </SurfaceCard>
  );
}
