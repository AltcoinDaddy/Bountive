"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type BetterAuthFormProps = {
  next: string;
  defaultEmail: string;
};

type Mode = "sign-in" | "sign-up";

function normalizeNext(next: string) {
  return next.startsWith("/") ? next : "/dashboard";
}

export function BetterAuthForm({ next, defaultEmail }: BetterAuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const redirectTarget = normalizeNext(next);
      const result = mode === "sign-in"
        ? await authClient.signIn.email({
            email,
            password,
            rememberMe: true,
            callbackURL: redirectTarget
          })
        : await authClient.signUp.email({
            name: name.trim() || email.split("@")[0] || "Bountive Operator",
            email,
            password,
            callbackURL: redirectTarget
          });

      if (result.error) {
        setError(result.error.message ?? "Authentication failed.");
        return;
      }

      router.push(redirectTarget as never);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-[24px] border border-[var(--border)] bg-white p-5">
      <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--panel-muted)] p-1">
        <button
          type="button"
          onClick={() => setMode("sign-in")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${mode === "sign-in" ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]"}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("sign-up")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${mode === "sign-up" ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]"}`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "sign-up" ? (
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Operator name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Bountive Operator"
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
            />
          </label>
        ) : null}

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Operator email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            placeholder="operator@company.com"
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            placeholder="At least 8 characters"
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-[rgba(180,83,9,0.3)] bg-[rgba(180,83,9,0.08)] px-4 py-3 text-sm text-[var(--foreground)]">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (mode === "sign-in" ? "Signing in..." : "Creating account...") : (mode === "sign-in" ? "Sign in" : "Create operator account")}
        </button>
      </form>
    </div>
  );
}
