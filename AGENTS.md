# AGENTS.md

This document is the operating guide for Codex and other autonomous contributors working in this repository.

It exists to keep future runs consistent with Bountive’s product direction, code quality bar, safety model, and visual standard.

## Project Intent

Bountive is a serious, production-style MVP for an autonomous GitHub-first task bounty system.

It is not a toy demo, a speculative concept site, or an AI-themed landing page.

The product should feel like a premium developer operations tool with a real execution loop:

`discover -> plan -> execute -> verify -> submit`

Every meaningful change should strengthen one of these outcomes:

- reliability of the mission loop
- clarity of operator visibility
- enforcement of safety and budget guardrails
- auditability through logs, artifacts, and proof records
- readiness for future live submission support

## Core Product Rules

These are non-negotiable unless the human user explicitly changes them.

- No purple.
- No green as the main brand color.
- No cyberpunk effects.
- No neon glow.
- No AI icons.
- No robot icons.
- No emojis in product UI or documentation unless explicitly requested.
- No gimmicky futuristic styling.
- No “agent hype” visuals that undermine trust.
- Keep the product visually aligned with a premium devtool / serious SaaS product.

## Design Direction

The design system should remain restrained, clean, and credible.

### Visual tone

- Light mode is the primary experience.
- Use white or soft off-white backgrounds.
- Use charcoal or near-black typography.
- Use navy, slate, or steel-blue accents.
- Prefer subtle borders over loud fills.
- Prefer restrained shadows over dramatic depth.
- Favor dense but readable information layouts.
- Tables, timelines, logs, and status panels should feel elegant and operational.

### Preferred palette

- background: `#F8FAFC` or `#FCFCFD`
- card background: `#FFFFFF`
- text primary: `#111827`
- text secondary: `#475467`
- border: `#E5E7EB`
- accent primary: `#1F3A5F`
- accent secondary: `#D6E4F0`
- warning: `#B45309`
- error: `#B42318`

### UI constraints

- Avoid flashy gradients, glow effects, lens flares, glassmorphism-heavy surfaces, or novelty motion.
- Motion should be minimal and purposeful.
- The interface should load cleanly on desktop first, but remain fully usable on mobile.
- Use spacing, hierarchy, typography, and contrast to create polish rather than decoration.
- Default to clarity and trust over visual cleverness.

## Product Scope

The MVP priority is one reliable end-to-end mission flow.

Build and preserve these surfaces:

- Dashboard
- Missions
- Candidate Tasks
- Execution Timeline
- Logs
- Identity
- Submission

These surfaces should reflect the real backend state wherever practical, not disconnected mock UI.

## Architecture Rules

Bountive should remain modular. Do not collapse responsibilities into a single large file or route.

### Required module boundaries

- `agents/*`
  Purpose: specialized mission actors
- `lib/orchestrator.ts`
  Purpose: central mission lifecycle control
- `lib/github/*`
  Purpose: GitHub discovery and normalization
- `lib/scoring-engine.ts`
  Purpose: candidate evaluation
- `lib/safety-engine.ts`
  Purpose: guardrails and budget enforcement
- `lib/repo-workspace.ts`
  Purpose: isolated repo preparation and safe command execution
- `lib/verification-engine.ts`
  Purpose: build/lint/test execution and QA outcome shaping
- `lib/identity-module.ts`
  Purpose: identity metadata and proof linkage
- `lib/manifest-generator.ts`
  Purpose: `agent.json` generation
- `lib/proof-record-generator.ts`
  Purpose: proof record creation
- `lib/mission-store.ts`
  Purpose: mission persistence and query helpers

### Agent responsibilities

- Scout Agent
  Finds GitHub issues and basic repository metadata.
- Planner Agent
  Scores candidates, rejects weak tasks, selects the best safe candidate.
- Developer Agent
  Prepares an isolated workspace and performs execution-oriented repo analysis. Extend carefully.
- QA Agent
  Runs verification and converts outcomes into approval or retry decisions.
- Submitter Agent
  Produces branch, commit, and PR artifacts. Live GitHub submission should remain guarded.
- Orchestrator
  Owns lifecycle transitions, retries, budgets, artifacts, and failure handling.

Do not blur these roles unless there is a strong architectural reason.

## Coding Standards

### General

- Use TypeScript everywhere practical.
- Prefer strong typing over loose objects.
- Favor small, focused modules with clear responsibilities.
- Keep code readable and production-style.
- Prefer explicit names over clever abstractions.
- Add comments only when they explain non-obvious intent.
- Avoid dead code, placeholder hacks, and speculative abstractions.

### Next.js

- Use the App Router.
- Prefer server components by default.
- Use server actions only where they genuinely simplify the flow.
- Keep route files light; push logic into `lib/*` and `components/*`.
- Preserve route-level loading, error, and empty-state behavior where needed.

### UI components

- Build reusable components in `components/*`.
- Keep components presentational when possible.
- Avoid duplicating card, badge, table, and panel patterns.
- Status rendering should remain consistent across pages.

### Data and persistence

- Prisma is the source of truth for persisted state.
- SQLite is sufficient for MVP local runtime.
- Persist mission lifecycle data rather than storing ephemeral-only state.
- Artifacts should remain file-based for MVP transparency.

### Environment and configuration

- Keep `.env.example` current whenever a new env var is introduced.
- Prefer central config readers in `lib/env.ts`.
- Do not scatter raw `process.env` access across the codebase unless there is a good reason.

## Safety Rules

These rules are central to the product and should not be weakened casually.

- Default to dry-run mode.
- Do not submit live PRs unless explicitly enabled by config.
- Do not act on repositories outside the allowlist in live mode.
- Do not continue past retry limits.
- Do not allow unlimited model calls.
- Do not allow unlimited tool calls.
- Do not exceed patch-size limits.
- Do not proceed if repo setup repeatedly fails.
- Do not approve submission when checks fail unless policy explicitly allows it.
- Do not run destructive shell commands.
- Do not leak secrets into logs, artifacts, or UI.
- Always surface the current mode and guardrails in the UI.

Any change that weakens a guardrail should be treated as high risk and should require explicit user direction.

## Compute Budget Rules

Budget awareness is part of the product, not an implementation detail.

Track and preserve:

- model calls used
- tool calls used
- retries used
- total mission duration
- changed files count
- candidate tasks scanned
- current runtime status

The orchestrator should halt or fail missions when configured budgets are exceeded.

Do not remove or hide this visibility from the UI.

## Identity and Proof Rules

The identity layer is metadata-first in the MVP.

Blockchain is not the execution engine.

It is used for:

- operator wallet association
- network and identity reference
- registration transaction metadata
- manifest linkage
- proof history and verifiable mission metadata

Preserve and extend:

- `artifacts/generated/agent.json`
- `artifacts/generated/agent_log.json`
- mission summaries
- verification artifacts
- submission artifacts
- proof records

Future onchain support should plug into these structures rather than replace them with opaque behavior.

## Implementation Priorities

When deciding what to build next, follow this order of importance:

1. Keep the core mission loop reliable.
2. Preserve and improve safety guardrails.
3. Improve real mission execution quality.
4. Improve verification depth and trustworthiness.
5. Improve operator visibility in the dashboard and logs.
6. Improve artifact and proof quality.
7. Add live submission capabilities behind explicit controls.
8. Add secondary UX enhancements only after the above are strong.

Avoid spending significant time on ornamental features before the core loop improves.

## Current MVP Constraints

Future Codex runs should respect the current intentional limits:

- The Developer Agent is conservative and does not yet perform broad autonomous code editing across arbitrary repos.
- Live PR submission is architected for future support but should remain behind config and explicit safeguards.
- GitHub discovery should remain real-data-only and require a configured token rather than falling back to local fixtures.
- The system should remain easy to run locally with minimal setup.

Do not “fake” autonomy with misleading UI claims. If a capability is partial, represent it honestly.

## Testing and Verification Expectations

After meaningful code changes, prefer to run the relevant checks.

Minimum expected verification for substantial work:

- `npm run lint`
- `npm run build`

When data-layer changes are made, also run as needed:

- `npx prisma generate`
- `npx prisma db push`
- `npm run db:seed`

If you cannot run a check, say so clearly.

## Documentation Expectations

Keep these files aligned with the implementation:

- `README.md`
- `docs/architecture.md`
- `.env.example`
- `AGENTS.md`

When introducing new behavior, update the relevant docs in the same change if the behavior materially affects setup, architecture, product rules, or agent workflow.

## How Future Codex Runs Should Work

When making changes in this repo:

1. Inspect the existing architecture first.
2. Respect the module boundaries already in place.
3. Preserve the premium SaaS visual direction.
4. Keep safety defaults conservative.
5. Prefer real backend wiring over mock-only UI.
6. Verify changes with lint/build when practical.
7. Update docs when the contract changes.

## Change Review Heuristics

Prefer changes that:

- make the mission loop more trustworthy
- make outcomes easier to audit
- reduce ambiguity in agent behavior
- improve type safety and maintainability
- strengthen the operator’s understanding of system state

Be skeptical of changes that:

- add visual gimmicks
- weaken guardrails
- bypass structured persistence
- increase complexity without improving reliability
- introduce fake or misleading “AI” presentation

## Short Project Summary For Agents

If you need the fastest possible orientation:

- Bountive is a serious GitHub-first autonomous bounty operator.
- The core loop is `discover -> plan -> execute -> verify -> submit`.
- Dry-run is the default.
- Safety and budget enforcement are product-critical.
- The UI should feel like a premium light-mode devtool.
- No purple, no green-led branding, no cyberpunk styling, no robot/AI gimmicks.
- Prioritize reliable mission execution and auditability over extra features.
