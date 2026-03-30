# Bountive Production Checklist

This document tracks what is already working in Bountive, what still needs to be finished, and how the product currently works end to end.

It is intended to be the fastest operational status reference for maintainers and future Codex runs.

## Current Status

Bountive is now a serious working MVP with:

- a real product UI
- a real mission lifecycle
- real persistence
- real GitHub discovery
- bounded real repository mutation for supported task classes
- real verification
- submission artifacts
- identity and proof artifacts
- Better Auth-backed operator authentication

It is not yet fully public-production ready for arbitrary third-party repository execution.

## Done

### Product UI

- landing page at `/`
- app dashboard at `/dashboard`
- missions page
- candidate tasks page
- execution timeline
- logs page
- monitoring page
- identity page
- submission page
- premium light-mode design system
- logo system and favicon assets

### Platform and Data

- Next.js App Router application
- TypeScript codebase
- Prisma data model
- SQLite support for local MVP use
- Postgres-ready runtime and schema support
- file-based mission artifacts and logs
- queue-first mission persistence
- local worker scripts
- optional Redis coordination hooks

### Mission System

- orchestrator for `discover -> plan -> execute -> verify -> submit`
- Scout Agent
- Planner Agent
- Developer Agent
- QA Agent
- Submitter Agent
- mission retries
- mission abort handling
- stale worker recovery hooks
- compute budget tracking
- changed-file budget tracking

### GitHub and Execution

- real GitHub issue discovery via Octokit
- allowlist-aware discovery
- writable GitHub repository visibility for live-target selection
- execution-support-aware planning
- isolated repo clone and branch creation
- guarded workspace command execution
- Docker sandbox profile scaffolding

### Deterministic Execution Adapters

- structured text patching from issue contracts
- structured JSON patching from issue contracts
- VS Code Rust Analyzer workspace settings repair
- commitlint conventional commits setup

### Verification and Submission

- guarded dependency installation
- baseline-aware verification with pre-patch and post-patch comparison
- build/lint/test execution when scripts exist
- QA approval / retry / reject outcome shaping
- local commit artifact generation
- draft submission artifact generation
- guarded live draft-PR architecture
- blocked submission when verification fails
- blocked submission when no meaningful diff exists

### Identity and Proof

- `agent.json` generation
- mission summary artifacts
- verification artifacts
- submission artifacts
- proof records
- proof bundles
- optional proof signing scaffolding
- optional onchain publication scaffolding

### Authentication

- Better Auth integration
- Prisma-backed auth models
- `/api/auth/[...all]` route
- Better Auth sign-in / sign-up UI
- Better Auth sign-out flow
- protected app routes
- local auth fallback still available behind `AUTH_MODE=local`

## Partially Done

### Live GitHub Submission

Implemented:

- guarded live mode
- allowlist enforcement
- token checks
- draft PR creation path in architecture

Still needed:

- full end-to-end validation on a sandbox repo you control
- webhook/state sync polish

### Sandboxed Execution

Implemented:

- guarded local command runner
- Docker execution profile scaffold
- command allowlist and env scrubbing

Still needed:

- real hosted Docker-capable worker runtime
- stronger network and filesystem isolation in production
- operational rollout and monitoring

### Real Repository Mutation

Implemented:

- bounded deterministic mutation for supported issue classes

Still needed:

- broader adapter coverage
- stronger repo-aware selection
- safer generalization across more repository shapes

### Verification Quality

Implemented:

- baseline verification before mutation
- pre-patch versus post-patch failure comparison
- regression detection for newly introduced failing checks
- real install/build/lint/test execution
- truthful block on failed verification

Still needed:

- distinguish repo-baseline failures from patch-caused failures
- changed-file relevance checks

## Left To Do

### Highest Priority

- add more high-yield deterministic adapters
- run one real live draft PR against a safe sandbox repo

### Execution Expansion

- CI workflow repair adapters
- lint/config adapters
- package and toolchain configuration adapters
- editor and developer-experience adapters
- more docs/config patch types

### Production Runtime Hardening

- deploy worker outside the web process
- run sandboxed execution on Docker-capable infrastructure
- use hosted Postgres and Redis in deployment
- add production monitoring and alerting

### Productization

- org/workspace roles
- approval workflow UX
- billing and quota controls
- admin and audit tooling

### Identity / Proof Maturity

- real signing key management
- real proof registry integration if needed
- operator-facing proof verification UI improvements

## How The App Works

### 1. Operator Access

- The operator signs in at `/auth/sign-in`.
- Better Auth creates and manages the operator session.
- Protected app routes require an active operator session before rendering.

### 2. Mission Launch

- The operator opens `/missions`.
- A mission configuration is submitted with labels, retries, thresholds, mode, and repo allowlist.
- The mission is persisted in the database and enters `QUEUED`.

### 3. Queue and Worker

- A worker claims the queued mission.
- The orchestrator becomes the source of truth for lifecycle progression.

### 4. Discover

- Scout Agent finds GitHub issues using configured labels and repo constraints.
- Candidates are normalized into a common structure with repository metadata.

### 5. Plan

- Planner Agent scores each candidate for clarity, complexity, and buildability.
- Execution support is considered during ranking.
- Each candidate is persisted with score, confidence, execution support, and explicit rationale.

### 6. Execute

- Developer Agent creates an isolated repo workspace.
- The target repository is cloned and a mission branch is created.
- Registered execution adapters are evaluated.
- If a safe adapter matches, a bounded patch is applied.

### 7. Verify

- QA Agent installs dependencies in guarded mode when needed.
- It runs build, lint, and test if those scripts exist.
- QA returns `APPROVED`, `RETRY_REQUIRED`, or `REJECTED`.

### 8. Retry or Submit

- If verification fails and retries remain, the mission is retried.
- If verification passes, the Submitter Agent prepares commit and PR artifacts.
- If verification does not satisfy policy, submission is explicitly blocked.

### 9. Identity and Proof

- Mission artifacts are written to disk.
- Identity and proof modules generate machine-readable proof metadata.
- Optional signing/publishing paths can extend that metadata later.

## Key Files

- [orchestrator.ts](/Users/daddy/Desktop/Bountive/lib/orchestrator.ts)
- [github client](/Users/daddy/Desktop/Bountive/lib/github/client.ts)
- [verification engine](/Users/daddy/Desktop/Bountive/lib/verification-engine.ts)
- [repo workspace](/Users/daddy/Desktop/Bountive/lib/repo-workspace.ts)
- [auth](/Users/daddy/Desktop/Bountive/lib/auth.ts)
- [better auth config](/Users/daddy/Desktop/Bountive/lib/better-auth.ts)
- [tasks page](/Users/daddy/Desktop/Bountive/app/tasks/page.tsx)
- [missions page](/Users/daddy/Desktop/Bountive/app/missions/page.tsx)

## Recommended Next Build Order

1. Baseline-aware verification
2. Two or three more high-value deterministic adapters
3. One real live draft PR test on a sandbox repo
4. Worker and sandbox deployment hardening
5. Org roles, approval workflows, and billing controls
