import { PageHeader } from "@/components/page-header";
import { FormSubmitButton } from "@/components/form-submit-button";
import { SurfaceCard } from "@/components/surface-card";
import { env } from "@/lib/env";
import { getOperatorSession } from "@/lib/auth";
import { signInAction } from "@/app/auth/actions";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const next = typeof params.next === "string" ? params.next : "/dashboard";
  const session = await getOperatorSession();

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <PageHeader
          eyebrow="Access"
          title="Operator sign-in"
          description="Use a local operator identity to access mission controls, update workspace policy, and launch guarded live-mode missions."
        />

        <SurfaceCard>
          <div className="grid gap-6 md:grid-cols-[1.05fr,0.95fr]">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-[var(--foreground)]">Current auth mode</div>
                <div className="mt-2 inline-flex rounded-full border border-[var(--border)] bg-[var(--panel-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  {env.authMode}
                </div>
              </div>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                Local sign-in keeps the operator identity explicit in a cookie-backed session. When no cookie is present,
                Bountive can still fall back to the configured operator email for local development.
              </p>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Current operator</div>
                <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{session.operatorEmail ?? "No operator session"}</div>
                <div className="mt-2 text-sm text-[var(--muted-foreground)]">Session source: {session.source}</div>
              </div>
            </div>

            <form action={signInAction} className="space-y-4 rounded-[24px] border border-[var(--border)] bg-white p-5">
              <input type="hidden" name="next" value={next} />
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Operator email</span>
                <input
                  name="operatorEmail"
                  type="email"
                  defaultValue={session.operatorEmail ?? env.operatorEmail}
                  placeholder="operator@company.com"
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-[rgba(180,83,9,0.3)] bg-[rgba(180,83,9,0.08)] px-4 py-3 text-sm text-[var(--foreground)]">
                  {error}
                </div>
              ) : null}

              <FormSubmitButton label="Sign in" pendingLabel="Signing in..." />
            </form>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
