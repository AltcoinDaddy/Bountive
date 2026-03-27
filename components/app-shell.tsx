"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileCode2, Fingerprint, LayoutDashboard, Logs, Rocket, ScrollText } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/missions", label: "Missions", icon: Rocket },
  { href: "/tasks", label: "Candidate Tasks", icon: FileCode2 },
  { href: "/timeline", label: "Execution Timeline", icon: Activity },
  { href: "/logs", label: "Logs", icon: Logs },
  { href: "/identity", label: "Identity", icon: Fingerprint },
  { href: "/submission", label: "Submission", icon: ScrollText }
] as const;

export function AppShell({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <aside className="hidden w-[250px] shrink-0 rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.85)] p-5 shadow-[var(--shadow)] backdrop-blur md:block">
          <div className="mb-8">
            <BrandLogo variant="full" className="w-[164px]" />
            <div className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
              Mission Control
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
              Autonomous GitHub-first bounty operations with guardrails, proof records, and dry-run safety by default.
            </p>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:bg-[var(--panel-muted)] hover:text-[var(--foreground)]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
