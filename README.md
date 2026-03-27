# Bountive

Bountive is a production-style MVP for an autonomous GitHub-first task bounty system. It discovers candidate issues, scores and selects one task, prepares an isolated execution workspace, verifies repository checks, drafts a submission artifact, and writes mission logs plus identity-linked proof metadata with minimal human intervention.

The product is built as a serious SaaS-style operations console rather than a demo landing page. The current implementation prioritizes one reliable, auditable mission flow end to end:

`discover -> plan -> execute -> verify -> submit`

## What It Includes

- Next.js App Router application with TypeScript and Tailwind
- SQLite + Prisma data layer
- GitHub issue discovery via Octokit with offline fallback fixtures
- Modular agents:
  - `Scout Agent`
  - `Planner Agent`
  - `Developer Agent`
  - `QA Agent`
  - `Submitter Agent`
- Central orchestrator with safety and compute budgets
- File-based artifacts and structured logs
- Identity and proof metadata layer using wallet and hashable proof records
- Premium light-mode operations dashboard for:
  - Dashboard
  - Missions
  - Candidate Tasks
  - Execution Timeline
  - Logs
  - Identity
  - Submission

## Architecture Overview

### Core loop

1. `discover`
   Search GitHub issues by configured labels such as `good first issue`, `help wanted`, `bug`, and `documentation`.
2. `plan`
   Score candidates for clarity, complexity, and buildability, then reject vague or oversized work.
3. `execute`
   Clone the selected repository into an isolated workspace and prepare a conservative execution plan.
4. `verify`
   Run `build`, `lint`, and `test` when available and compute a QA decision.
5. `submit`
   Produce branch, commit, and PR draft artifacts and attach proof metadata.

### Main modules

- [app/dashboard/page.tsx](/Users/daddy/Desktop/Bountive/app/dashboard/page.tsx)
- [app/missions/page.tsx](/Users/daddy/Desktop/Bountive/app/missions/page.tsx)
- [app/tasks/page.tsx](/Users/daddy/Desktop/Bountive/app/tasks/page.tsx)
- [app/timeline/page.tsx](/Users/daddy/Desktop/Bountive/app/timeline/page.tsx)
- [app/logs/page.tsx](/Users/daddy/Desktop/Bountive/app/logs/page.tsx)
- [app/identity/page.tsx](/Users/daddy/Desktop/Bountive/app/identity/page.tsx)
- [app/submission/page.tsx](/Users/daddy/Desktop/Bountive/app/submission/page.tsx)
- [lib/orchestrator.ts](/Users/daddy/Desktop/Bountive/lib/orchestrator.ts)
- [lib/safety-engine.ts](/Users/daddy/Desktop/Bountive/lib/safety-engine.ts)
- [lib/verification-engine.ts](/Users/daddy/Desktop/Bountive/lib/verification-engine.ts)
- [lib/identity-module.ts](/Users/daddy/Desktop/Bountive/lib/identity-module.ts)
- [prisma/schema.prisma](/Users/daddy/Desktop/Bountive/prisma/schema.prisma)

More detail is available in [docs/architecture.md](/Users/daddy/Desktop/Bountive/docs/architecture.md).

## How The Agent Loop Works

### Scout Agent

- Queries GitHub issues through Octokit when `GITHUB_TOKEN` is available
- Falls back to local sample candidates when running offline
- Returns normalized issue and repository metadata

### Planner Agent

- Scores each candidate for:
  - clarity
  - complexity
  - buildability
- Rejects oversized or ambiguous tasks
- Persists explicit reasons for selection and rejection

### Developer Agent

- Creates an isolated workspace per mission
- Attempts a safe clone of the selected repository
- Detects package manager and available scripts
- Writes an execution plan artifact
- Avoids destructive shell behavior

### QA Agent

- Runs build, lint, and test only if those scripts exist
- Produces a `VerificationReport`
- Converts check results into `approved`, `retry_required`, or `rejected`

### Submitter Agent

- Generates:
  - branch name
  - commit message
  - PR title
  - PR body
  - submission status
- Keeps the MVP in draft mode unless live mode is explicitly enabled

## Safety Model

Bountive includes real guardrails:

- defaults to dry-run mode
- blocks live submission unless explicitly enabled
- requires repository allowlisting for live mode
- enforces retry limits
- enforces model and tool call budgets
- enforces changed-file budget
- aborts on timeout
- blocks destructive shell command patterns
- blocks approval on failed checks unless policy explicitly loosens it

The active guardrails are stored per mission and surfaced in the UI.

## Compute Budget Model

The orchestrator tracks and enforces:

- model calls used
- tool calls used
- retries used
- total mission duration
- changed files count
- candidate tasks scanned
- current stage and runtime status

If a configured budget is exceeded, the mission is halted and an error artifact is written.

## Identity / Proof Layer

Blockchain is intentionally not used as the execution engine.

The MVP identity layer covers:

- operator wallet
- network
- identity reference
- registration transaction hash
- manifest URI
- proof record history

Generated machine-readable files include:

- `artifacts/generated/agent.json`
- `artifacts/generated/agent_log.json`
- `artifacts/missions/<mission-id>.summary.json`
- `artifacts/proof-records/<proof-id>.json`

Proof records store mission, repository, verification, and log hashes to create a future extension path for onchain registration or attestations.

## Generated Artifacts

After seeding or running a mission, you will see files under:

- [artifacts/generated/agent.json](/Users/daddy/Desktop/Bountive/artifacts/generated/agent.json)
- [artifacts/generated/agent_log.json](/Users/daddy/Desktop/Bountive/artifacts/generated/agent_log.json)
- [artifacts/missions](/Users/daddy/Desktop/Bountive/artifacts/missions)
- [artifacts/proof-records](/Users/daddy/Desktop/Bountive/artifacts/proof-records)

Mission workspaces are created under:

- `artifacts/workspaces/<mission-id>`

## Local Setup

### Requirements

- Node.js 24+
- npm 11+

### Install

```bash
npm install
```

### Environment

Copy `.env.example` to `.env` or use the included local `.env` defaults.

Required and important variables:

- `DATABASE_URL`
- `GITHUB_TOKEN`
- `ALLOWLISTED_REPOS`
- `DEFAULT_MISSION_MODE`
- `ENABLE_LIVE_SUBMISSIONS`
- `ALLOW_APPROVE_WITH_FAILED_CHECKS`
- `BOUNTIVE_OPERATOR_WALLET`
- `BOUNTIVE_NETWORK`
- `BOUNTIVE_IDENTITY_REFERENCE`
- `BOUNTIVE_REGISTRATION_TX_HASH`
- `BOUNTIVE_MANIFEST_URI`
- `MAX_MODEL_CALLS`
- `MAX_TOOL_CALLS`
- `MAX_RETRIES`
- `MAX_CHANGED_FILES`
- `MAX_CANDIDATES_SCANNED`
- `MISSION_TIMEOUT_MS`

### Database Setup

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### Run The App

```bash
npm run dev
```

Then open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

### Production Verification

```bash
npm run lint
npm run build
```

## GitHub Integration

For real issue discovery, set `GITHUB_TOKEN`.

Without a token:

- the UI still works
- missions still run
- issue discovery falls back to local sample candidates

This makes the MVP easy to run locally while preserving a real GitHub integration path.

## Dry-Run Mode

Dry-run mode is the default and recommended local mode.

In dry-run mode Bountive will:

- discover and score real or fallback issues
- select one issue
- prepare an isolated workspace
- inspect repository scripts
- run verification where possible
- draft submission artifacts
- generate logs and proof records

It will not create a live pull request unless live mode is explicitly enabled and future live submission wiring is expanded.

## Current MVP Gaps

- The Developer Agent is intentionally conservative and does not yet perform generalized autonomous code modification across arbitrary repositories.
- Live PR submission architecture is represented in the data model and workflow, but the final GitHub write path remains behind config and should be extended before production use.
- The worker model is currently in-process rather than a separate durable queue-backed service.
- GitHub discovery uses a simple search query and can be made smarter with repository quality and buildability profiling.

## Future Roadmap

- durable mission job runner and queue
- stronger repo-specific execution adapters
- live branch push and pull request creation
- richer scoring heuristics and repo health checks
- signed proof publishing and onchain identity registration
- operator approvals and review workflow
