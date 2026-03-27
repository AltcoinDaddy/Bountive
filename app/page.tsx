import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Binoculars,
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  FolderGit2,
  Hammer,
  ShieldCheck,
  Wallet
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import styles from "./landing.module.css";

const steps = [
  {
    title: "Discover tasks",
    description: "Scan GitHub issues using mission filters, allowlists, and safety-aware candidate selection.",
    icon: Binoculars
  },
  {
    title: "Plan solution",
    description: "Score candidates for clarity, complexity, and buildability before selecting one mission target.",
    icon: BadgeCheck
  },
  {
    title: "Execute with tools",
    description: "Clone the repository in an isolated workspace and operate with real developer tooling.",
    icon: Hammer
  },
  {
    title: "Verify output",
    description: "Run build, lint, and test checks and convert outcomes into structured QA decisions.",
    icon: ShieldCheck
  },
  {
    title: "Submit result",
    description: "Prepare a branch, commit, and PR artifact with traceable mission logs and proof records.",
    icon: FileCheck2
  }
] as const;

const features = [
  {
    title: "Autonomous Execution",
    description: "Bountive runs the full mission lifecycle from issue discovery to submission artifact creation."
  },
  {
    title: "Real Tool Integration",
    description: "The system uses GitHub, git, package managers, repository scripts, and structured local artifacts."
  },
  {
    title: "Structured Verification",
    description: "Every mission records build, lint, and test outcomes before approval is considered."
  },
  {
    title: "Onchain Identity Layer",
    description: "Operator identity, manifest metadata, and proof history are preserved for future attestations."
  },
  {
    title: "Compute Budget Control",
    description: "Model calls, tool calls, retries, duration, and patch size stay inside explicit mission limits."
  }
] as const;

const proofItems = [
  { label: "Issue selected", value: "vercel/next.js#72101", status: "Approved" },
  { label: "Repo cloned", value: "Isolated workspace prepared", status: "Passed" },
  { label: "Files changed", value: "docs/messages/image-config.md", status: "Dry run" },
  { label: "Verification passed", value: "Build passed, lint passed, test skipped", status: "Approved" },
  { label: "PR generated", value: "Draft submission artifact ready", status: "Draft ready" }
] as const;

const navLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#proof", label: "Proof" },
  { href: "#identity", label: "Identity" }
] as const;

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.heroSection}>
        <div className={styles.heroGlow} />
        <div className={styles.container}>
          <header className={styles.header}>
            <div className={styles.brand}>
              <BrandLogo variant="full" className={styles.brandLogo} />
            </div>

            <nav className={styles.nav}>
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className={styles.navLink}>
                  {link.label}
                </a>
              ))}
            </nav>

            <div className={styles.headerActions}>
              <Link href="/dashboard" className={styles.secondaryButton}>
                View Demo
              </Link>
              <Link href="/missions" className={styles.primaryButton}>
                Launch Mission
                <ArrowRight className={styles.buttonIcon} />
              </Link>
            </div>
          </header>

          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <h1 className={styles.heroTitle}>Autonomous Work, Delivered.</h1>
              <p className={styles.heroText}>
                Bountive discovers real tasks, solves them using real tools, verifies its work, and submits results — without human intervention.
              </p>
              <div className={styles.heroActions}>
                <Link href="/missions" className={styles.primaryButtonLarge}>
                  Launch Mission
                  <ArrowRight className={styles.buttonIcon} />
                </Link>
                <Link href="/dashboard" className={styles.secondaryButtonLarge}>
                  View Demo
                </Link>
              </div>

              <div className={styles.heroStats}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Mission loop</div>
                  <div className={styles.statValue}>discover → plan → execute → verify → submit</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Safety default</div>
                  <div className={styles.statValue}>Dry-run first with explicit guardrails and budget enforcement.</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Output model</div>
                  <div className={styles.statValue}>Structured logs, verification reports, submission drafts, and proof records.</div>
                </div>
              </div>
            </div>

            <div className={styles.snapshotShell}>
              <div className={styles.snapshotCard}>
                <div className={styles.snapshotHeader}>
                  <div>
                    <div className={styles.snapshotEyebrow}>Live mission snapshot</div>
                    <div className={styles.snapshotTitle}>Autonomous issue mission</div>
                  </div>
                  <span className={styles.successBadge}>Completed</span>
                </div>

                <div className={styles.snapshotGrid}>
                  <div className={styles.snapshotItem}>
                    <div className={styles.snapshotLabel}>Current stage</div>
                    <div className={styles.snapshotPill}>Complete</div>
                  </div>
                  <div className={styles.snapshotItem}>
                    <div className={styles.snapshotLabel}>Mode</div>
                    <div className={styles.snapshotPill}>Dry run</div>
                  </div>
                  <div className={styles.snapshotItem}>
                    <div className={styles.snapshotLabel}>Compute usage</div>
                    <div className={styles.snapshotValue}>4 model calls / 11 tool calls</div>
                  </div>
                  <div className={styles.snapshotItem}>
                    <div className={styles.snapshotLabel}>Verification</div>
                    <div className={styles.snapshotPillSuccess}>Approved</div>
                  </div>
                </div>

                <div className={styles.snapshotItemWide}>
                  <div className={styles.snapshotLabel}>Selected task</div>
                  <div className={styles.snapshotValueStrong}>Improve warning copy for invalid image config</div>
                  <div className={styles.snapshotValueMuted}>vercel/next.js</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionIntro}>
            <div className={styles.sectionEyebrow}>How it works</div>
            <h2 className={styles.sectionTitle}>One mission loop, fully visible end to end.</h2>
            <p className={styles.sectionText}>
              Bountive treats autonomous execution as an operational workflow, not a black box. Each stage is explicit, budgeted, and logged.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div key={step.title} className={styles.stepCard}>
                  <div className={styles.stepIcon}>
                    <Icon className={styles.icon} />
                  </div>
                  <h3 className={styles.cardTitle}>{step.title}</h3>
                  <p className={styles.cardText}>{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="features" className={styles.bandSection}>
        <div className={styles.container}>
          <div className={styles.sectionIntro}>
            <div className={styles.sectionEyebrow}>Features</div>
            <h2 className={styles.sectionTitle}>Built for serious autonomous task operations.</h2>
          </div>

          <div className={styles.featuresGrid}>
            {features.map((feature) => (
              <div key={feature.title} className={styles.featureCard}>
                <h3 className={styles.cardTitle}>{feature.title}</h3>
                <p className={styles.cardText}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="proof" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.proofGrid}>
            <div className={styles.sectionIntroCompact}>
              <div className={styles.sectionEyebrow}>Execution proof</div>
              <h2 className={styles.sectionTitle}>Every run leaves an inspectable trail.</h2>
              <p className={styles.sectionText}>
                Bountive records the chosen task, repository preparation, verification outcomes, and submission artifacts so operators can audit what happened without replaying the mission.
              </p>
            </div>

            <div className={styles.proofShell}>
              <div className={styles.proofCard}>
                <div className={styles.proofHeader}>
                  <div>
                    <div className={styles.snapshotEyebrow}>Sample proof record</div>
                    <div className={styles.proofTitle}>Dry-run triage for help-wanted issue</div>
                  </div>
                  <CheckCircle2 className={styles.icon} />
                </div>

                <div className={styles.proofList}>
                  {proofItems.map((item) => (
                    <div key={item.label} className={styles.proofItem}>
                      <div>
                        <div className={styles.snapshotLabel}>{item.label}</div>
                        <div className={styles.proofValue}>{item.value}</div>
                      </div>
                      <span className={styles.neutralBadge}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="identity" className={styles.bandSection}>
        <div className={styles.container}>
          <div className={styles.identityGrid}>
            <div className={styles.sectionIntroCompact}>
              <div className={styles.sectionEyebrow}>Identity</div>
              <h2 className={styles.sectionTitle}>Verifiable operators, not anonymous automation.</h2>
              <p className={styles.sectionText}>
                Bountive links each mission to an operator wallet, an identity reference, a capability manifest, and a proof history that can be extended into onchain registration later.
              </p>
            </div>

            <div className={styles.identityCards}>
              <div className={styles.identityCard}>
                <Fingerprint className={styles.icon} />
                <h3 className={styles.cardTitle}>Agent identity</h3>
                <p className={styles.cardText}>Persistent identity references and manifests define what the operator is allowed to do.</p>
              </div>
              <div className={styles.identityCard}>
                <Wallet className={styles.icon} />
                <h3 className={styles.cardTitle}>Operator wallet</h3>
                <p className={styles.cardText}>Wallet association gives each autonomous operator a durable ownership and registration surface.</p>
              </div>
              <div className={styles.identityWideCard}>
                <FolderGit2 className={styles.icon} />
                <h3 className={styles.cardTitle}>Verifiable work history</h3>
                <p className={styles.cardText}>Mission logs, verification summaries, submission artifacts, and proof hashes make work history portable and inspectable.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <div className={styles.sectionIntroCompact}>
              <div className={styles.sectionEyebrow}>Get started</div>
              <h2 className={styles.sectionTitle}>Launch Your First Autonomous Mission</h2>
              <p className={styles.sectionText}>
                Start in dry-run mode, inspect every artifact, and move toward live autonomous execution with explicit guardrails.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link href="/missions" className={styles.primaryButtonLarge}>
                Launch Mission
                <ArrowRight className={styles.buttonIcon} />
              </Link>
              <Link href="/dashboard" className={styles.secondaryButtonLarge}>
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
