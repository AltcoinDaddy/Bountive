import { Github, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { SurfaceCard } from "@/components/surface-card";
import type { WritableGithubRepo } from "@/lib/github/writable-repos";

export function GithubAccessCard({ repos }: { repos: WritableGithubRepo[] }) {
  return (
    <SurfaceCard>
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          title="GitHub Access"
          description="Writable repositories available to the configured token. Use one of these as the live-mode sandbox target and add it to the allowlist before publishing draft pull requests."
        />
        <div className="flex items-center gap-3">
          <StatusBadge value={repos.length > 0 ? "passed" : "blocked"} />
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-2">
            <Github className="h-5 w-5 text-[var(--primary)]" />
          </div>
        </div>
      </div>

      {repos.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {repos.map((repo) => (
            <div key={repo.fullName} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-medium text-[var(--foreground)]">{repo.fullName}</div>
                <StatusBadge value={repo.allowlisted ? "allowlisted" : "pending"} />
              </div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--muted-foreground)]">
                <div>Default branch: {repo.defaultBranch}</div>
                <div>Visibility: {repo.private ? "Private" : "Public"}</div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
                  {repo.allowlisted
                    ? "Ready to use in live-mode allowlists."
                    : "Writable, but not yet in ALLOWLISTED_REPOS."}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
          No writable repositories were detected for the current token, or GitHub access could not be validated from this environment.
        </div>
      )}
    </SurfaceCard>
  );
}
