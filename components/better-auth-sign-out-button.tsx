"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function BetterAuthSignOutButton({ next = "/auth/sign-in" }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await authClient.signOut();

            if (result.error) {
              setError(result.error.message ?? "Sign-out failed.");
              return;
            }

            router.push(next as never);
            router.refresh();
          });
        }}
        className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Signing out..." : "Sign out"}
      </button>
      {error ? (
        <div className="rounded-2xl border border-[rgba(180,35,24,0.2)] bg-[rgba(180,35,24,0.06)] px-4 py-3 text-sm text-[var(--foreground)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
