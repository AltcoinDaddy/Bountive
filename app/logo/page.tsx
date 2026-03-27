import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "@/components/brand-logo";

const assetLinks = [
  { label: "Full logo", href: "/brand/bountive-logo.svg" },
  { label: "Full logo (light)", href: "/brand/bountive-logo-light.svg" },
  { label: "Wordmark", href: "/brand/bountive-wordmark.svg" },
  { label: "Wordmark (light)", href: "/brand/bountive-wordmark-light.svg" },
  { label: "Icon mark", href: "/brand/bountive-mark.svg" },
  { label: "Icon mark (light)", href: "/brand/bountive-mark-light.svg" },
  { label: "Favicon", href: "/brand/favicon.svg" }
] as const;

const applications = [
  "Built from stacked bars and rounded nodes so the mark reads as a structured B and a controlled execution pipeline.",
  "Monochrome-first with a restrained navy accent that fits the existing dashboard and landing-page system.",
  "Optimized for product chrome, documentation, favicon usage, and white or dark backgrounds without effects or gradients."
] as const;

function LogoSurface({
  title,
  description,
  dark = false,
  children
}: {
  title: string;
  description: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={[
        "rounded-[28px] border p-6 shadow-[var(--shadow)]",
        dark ? "border-slate-800 bg-slate-950 text-slate-50" : "border-[var(--border)] bg-white text-[var(--foreground)]"
      ].join(" ")}
    >
      <div className="mb-6">
        <div className={dark ? "text-sm font-semibold uppercase tracking-[0.2em] text-slate-400" : "text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]"}>
          {title}
        </div>
        <p className={dark ? "mt-2 max-w-2xl text-sm leading-7 text-slate-300" : "mt-2 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]"}>
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

export default function LogoPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Brand system
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-5xl">
              Bountive logo suite
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted-foreground)]">
              A minimal identity designed to feel operational, trustworthy, and product-grade. The mark uses a geometric
              B assembled from pipeline-like segments to reflect discovery, execution, verification, and submission.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              Back to landing
            </Link>
            <a
              href="/brand/bountive-logo.svg"
              className="inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Open master SVG
            </a>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <LogoSurface
            title="Primary lockup"
            description="The default full logo for app headers, the landing page, and product documentation on light backgrounds."
          >
            <div className="flex min-h-[200px] items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--panel-muted)] p-8">
              <BrandLogo variant="full" className="w-[320px] max-w-full" />
            </div>
          </LogoSurface>

          <div className="grid gap-8 lg:grid-cols-2">
            <LogoSurface
              title="Icon mark"
              description="Use for favicons, compact navigation spaces, and square product surfaces."
            >
              <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--panel-muted)] p-8">
                <BrandLogo variant="mark" className="w-24" />
              </div>
            </LogoSurface>

            <LogoSurface
              title="Wordmark"
              description="Use when the product name needs to stand alone without the symbol."
            >
              <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--panel-muted)] p-8">
                <BrandLogo variant="wordmark" className="w-[220px] max-w-full" />
              </div>
            </LogoSurface>
          </div>

          <LogoSurface
            title="Dark background compatibility"
            description="The light-tone variants preserve the same geometry and hierarchy on darker surfaces without introducing glows or gradients."
            dark
          >
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="flex min-h-[180px] items-center justify-center rounded-[22px] border border-slate-800 bg-slate-900 p-8">
                <BrandLogo variant="mark" tone="light" className="w-20" />
              </div>
              <div className="flex min-h-[180px] items-center justify-center rounded-[22px] border border-slate-800 bg-slate-900 p-8">
                <BrandLogo variant="wordmark" tone="light" className="w-[220px] max-w-full" />
              </div>
              <div className="flex min-h-[180px] items-center justify-center rounded-[22px] border border-slate-800 bg-slate-900 p-8">
                <BrandLogo variant="full" tone="light" className="w-[260px] max-w-full" />
              </div>
            </div>
          </LogoSurface>
        </div>

        <div className="space-y-8">
          <section className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow)]">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Design intent</div>
            <div className="mt-4 space-y-4">
              {applications.map((item) => (
                <p key={item} className="text-sm leading-7 text-[var(--muted-foreground)]">
                  {item}
                </p>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow)]">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Asset bundle</div>
            <div className="mt-4 space-y-3">
              {assetLinks.map((asset) => (
                <a
                  key={asset.href}
                  href={asset.href}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  <span>{asset.label}</span>
                  <span className="text-[var(--muted-foreground)]">SVG</span>
                </a>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow)]">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Favicon preview</div>
            <div className="mt-5 flex min-h-[168px] items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--panel-muted)] p-8">
              <Image src="/brand/favicon.svg" alt="Bountive favicon" width={64} height={64} className="h-16 w-16" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
