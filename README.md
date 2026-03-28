# Bountive

Bountive is a production-style MVP for an autonomous GitHub-first task bounty system. It discovers candidate issues, scores and selects one task, prepares an isolated execution workspace, applies a bounded execution strategy, verifies repository checks, drafts a submission artifact, and writes mission logs plus identity-linked proof metadata with minimal human intervention.

The product is built as a serious SaaS-style operations console rather than a demo landing page. The current implementation prioritizes one reliable, auditable mission flow end to end:

`discover -> plan -> execute -> verify -> submit`

## What It Includes

- Next.js App Router application with TypeScript and Tailwind
- SQLite + Prisma data layer
- Environment-driven SQLite or Postgres Prisma datasource
- GitHub issue discovery via Octokit with offline fallback fixtures
- Modular agents:
  - `Scout Agent`
  - `Planner Agent`
  - `Developer Agent`
  - `QA Agent`
  - `Submitter Agent`
- Central orchestrator with safety and compute budgets
- Queue-first mission launch path with a local worker runner
- Optional Redis-backed worker wake-up coordination for multi-worker deployments
- Guarded sandbox runner abstraction for workspace-only command execution
- Optional Docker sandbox profile for stronger command isolation
- File-based artifacts and structured logs
- Local operator session management and workspace approval policy editing
- Health and monitoring surfaces plus a `/api/health` endpoint
- Identity and proof metadata layer using wallet, signed proof hashes, and optional onchain publication
- Premium light-mode operations dashboard for:
  - Dashboard
  - Missions
  - Candidate Tasks
  - Execution Timeline
  - Logs
  - Monitoring
  - Identity
  - Submission

## Architecture Overview

### Core loop

1. `queue`
   Accept mission configuration, persist it, and wait for a worker claim before execution begins.
2. `discover`
   Search GitHub issues by configured labels such as `good first issue`, `help wanted`, `bug`, and `documentation`.
3. `plan`
   Score candidates for clarity, complexity, and buildability, then reject vague or oversized work.
4. `execute`
   Clone the selected repository into an isolated workspace, create an isolated branch, and apply a deterministic patch when a supported execution strategy matches.
5. `verify`
   Install dependencies in guarded mode, run `build`, `lint`, and `test` when available, and compute a QA decision.
6. `submit`
   Produce branch, commit, and PR draft artifacts, block unshippable missions, and attach proof metadata.

### Main modules

- [app/dashboard/page.tsx](/Users/daddy/Desktop/Bountive/app/dashboard/page.tsx)
- [app/missions/page.tsx](/Users/daddy/Desktop/Bountive/app/missions/page.tsx)
- [app/tasks/page.tsx](/Users/daddy/Desktop/Bountive/app/tasks/page.tsx)
- [app/timeline/page.tsx](/Users/daddy/Desktop/Bountive/app/timeline/page.tsx)
- [app/logs/page.tsx](/Users/daddy/Desktop/Bountive/app/logs/page.tsx)
- [app/monitoring/page.tsx](/Users/daddy/Desktop/Bountive/app/monitoring/page.tsx)
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
- Creates an isolated mission branch inside the workspace
- Detects package manager and available scripts
- Selects from registered deterministic execution adapters for supported tasks
- Can use a local guarded sandbox or a Docker-backed sandbox profile, depending on env config
- Writes an execution plan artifact
- Avoids destructive shell behavior

### QA Agent

- Runs guarded dependency installation before project scripts
- Runs build, lint, and test only if those scripts exist
- Produces a `VerificationReport`
- Converts check results into `approved`, `retry_required`, or `rejected`

### Submitter Agent

- Generates:
  - branch name
  - commit message
  - local commit hash when a real patch exists
  - PR title
  - PR body
  - submission status
- Blocks submission when verification fails or no repository changes were produced
- Keeps the MVP in draft mode unless live mode is explicitly enabled
- Can publish a real GitHub draft PR when live mode is enabled, the repo is allowlisted, and `GITHUB_TOKEN` has write access

## Safety Model

Bountive includes real guardrails:

- defaults to dry-run mode
- blocks live submission unless explicitly enabled
- preflights live missions against config, token, and allowlist requirements before execution continues
- exposes operator abort controls for queued and running missions
- requires repository allowlisting for live mode
- enforces retry limits
- enforces model and tool call budgets
- enforces changed-file budget
- aborts on timeout
- blocks destructive shell command patterns
- blocks approval on failed checks unless policy explicitly loosens it
- blocks draft-ready submission when no repository diff exists

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
- `artifacts/proof-records/<proof-id>.bundle.json`

The capability manifest now includes network, registration metadata, manifest URI, and proof format version. Proof records store mission, repository, verification, and log hashes, while proof bundles package those hashes with mission, submission, and identity context for future onchain registration or attestations.

Signed proof flow additions:

- `artifacts/proof-records/<proof-id>.signature.json`
- `artifacts/proof-records/<proof-id>.onchain.json`

When `BOUNTIVE_PROOF_SIGNING_KEY` is configured, proof hashes are signed automatically. When `ENABLE_PROOF_PUBLISHING`, `BOUNTIVE_CHAIN_RPC_URL`, and `BOUNTIVE_PROOF_REGISTRY_ADDRESS` are all configured, Bountive can also attempt guarded onchain proof publication through the configured registry contract.

## Generated Artifacts

After seeding or running a mission, you will see files under:

- [artifacts/generated/agent.json](/Users/daddy/Desktop/Bountive/artifacts/generated/agent.json)
- [artifacts/generated/agent_log.json](/Users/daddy/Desktop/Bountive/artifacts/generated/agent_log.json)
- [artifacts/missions](/Users/daddy/Desktop/Bountive/artifacts/missions)
- [artifacts/proof-records](/Users/daddy/Desktop/Bountive/artifacts/proof-records)

Mission workspaces are created under:

- `artifacts/workspaces/<mission-id>`

Offline fixture repositories live under:

- [fixtures/demo-task-repo](/Users/daddy/Desktop/Bountive/fixtures/demo-task-repo)

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
- `DATABASE_PROVIDER`
- `GITHUB_TOKEN`
- `ALLOWLISTED_REPOS`
- `REDIS_URL`
- `AUTH_MODE`
- `SANDBOX_PROFILE`
- `DOCKER_SANDBOX_IMAGE`
- `SANDBOX_MEMORY_MB`
- `SANDBOX_CPU_LIMIT`
- `DEFAULT_MISSION_MODE`
- `ENABLE_LIVE_SUBMISSIONS`
- `ALLOW_APPROVE_WITH_FAILED_CHECKS`
- `BOUNTIVE_OPERATOR_WALLET`
- `BOUNTIVE_OPERATOR_EMAIL`
- `BOUNTIVE_NETWORK`
- `BOUNTIVE_IDENTITY_REFERENCE`
- `BOUNTIVE_REGISTRATION_TX_HASH`
- `BOUNTIVE_MANIFEST_URI`
- `BOUNTIVE_PROOF_SIGNING_KEY`
- `ENABLE_PROOF_PUBLISHING`
- `BOUNTIVE_CHAIN_RPC_URL`
- `BOUNTIVE_PROOF_REGISTRY_ADDRESS`
- `MAX_MODEL_CALLS`
- `MAX_TOOL_CALLS`
- `MAX_RETRIES`
- `MAX_CHANGED_FILES`
- `MAX_CANDIDATES_SCANNED`
- `MISSION_TIMEOUT_MS`
- `MISSION_WORKER_POLL_MS`
- `MISSION_WORKER_LEASE_MS`
- `MISSION_WORKER_CONCURRENCY`

### Database Setup

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

For the default local MVP, keep:

```bash
DATABASE_PROVIDER="sqlite"
DATABASE_URL="file:./dev.db"
```

For a production-style Postgres deployment, switch to:

```bash
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://user:password@host:5432/bountive?schema=public"
```

### Run The App

```bash
npm run dev
```

Then open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

### Run The Worker

Missions launched from the UI are queued first. In a separate terminal, run:

```bash
npm run mission:worker
```

For a one-off local drain of the next queued mission:

```bash
npm run mission:drain
```

The worker lease timeout is controlled by `MISSION_WORKER_LEASE_MS`. When a running mission stops heartbeating past that window, Bountive can mark it stale and let an operator recover it safely.

To sweep stale running missions manually:

```bash
npm run mission:recover
```

Set `MISSION_WORKER_CONCURRENCY` above `1` when you want a single worker process to claim multiple missions in parallel. If `REDIS_URL` is configured, workers also receive queue wake-up signals instead of relying only on polling.

### Production Compose Stack

This repo now includes [docker-compose.yml](/Users/daddy/Desktop/Bountive/docker-compose.yml) with:

- Postgres
- Redis
- web app container
- worker container

That stack is the intended starting point for a production-like local deployment.

### Production Verification

```bash
npm run lint
npm run build
```

### Run A Sample Mission

```bash
npm run mission:sample
```

This executes the default dry-run mission against the local deterministic fixture repository and verifies the full loop end to end.

Current registered offline adapters include:

- documentation warning-copy repair
- CLI missing-config message repair
- mission configuration defaults repair
- verification summary test-fixture repair
- structured text replacement from issue-defined contracts
- structured JSON path patching from issue-defined contracts

Additional local mission runners:

- `npm run mission:enqueue-sample`
- `npm run mission:config`
- `npm run mission:structured`
- `npm run mission:structured-json`
- `npm run mission:test`

## GitHub Integration

For real issue discovery, set `GITHUB_TOKEN`.

For real live draft PR submission, `GITHUB_TOKEN` must also have permission to create branches, commits, and pull requests on the selected allowlisted repository.

Live submissions are also gated by `ENABLE_LIVE_SUBMISSIONS`; if that flag is off, Bountive will keep missions in draft-only mode even when a launch request asks for live submission.

Without a token:

- the UI still works
- missions still run
- issue discovery falls back to local sample candidates
- the top offline candidate targets a local repository that can be cloned, patched, verified, and committed entirely offline

This makes the MVP easy to run locally while preserving a real GitHub integration path.

Live-mode launches are also validated earlier now:

- launch-time live preflight blocks invalid live requests before queueing
- live discovery narrows candidate search to the configured allowlist
- selected repositories can be checked for token access and push permission from the Missions page

## Dry-Run Mode

Dry-run mode is the default and recommended local mode.

In dry-run mode Bountive will:

- queue missions for worker pickup when launched from the app
- discover and score real or fallback issues
- select one issue
- prepare an isolated workspace
- create an isolated branch
- apply a deterministic patch when a supported strategy matches
- inspect repository scripts
- install dependencies in guarded mode and run verification where possible
- draft submission artifacts
- generate logs and proof records

It will not create a live pull request unless live mode is explicitly enabled and future live submission wiring is expanded.

## Auth, Workspaces, And Policies

Bountive now includes a local operator session flow:

- protected app routes redirect to `/auth/sign-in` when there is no active operator session
- the operator session can come from a cookie-backed local sign-in or the configured fallback operator email
- the Identity page exposes session source and lets operators clear the local session

Workspace policy is now persisted and editable from the Missions page, including:

- operator email
- live-mode human approval requirement
- dry-run auto-approval posture
- failed-check approval policy
- max patch file limit
- allowed task categories

## Sandboxed Execution

Mission commands run through a bounded sandbox layer.

- default profile: `local`
  Executes only approved runtime commands inside the mission workspace with scrubbed env vars and timeouts.
- stronger profile: `docker`
  Runs commands inside a Docker container with `--network none`, explicit CPU and memory limits, and workspace-only mounting.

The Docker profile is opt-in so local development remains easy while stronger isolation is available for production-style execution hosts.

## Monitoring And Alerting

Bountive now includes:

- a Monitoring page at `/monitoring`
- runtime health checks for database, artifacts, worker coordination, sandboxing, and proof-signing readiness
- queue depth and recent event visibility
- a machine-readable health endpoint at `/api/health`

## Current MVP Gaps

- The Developer Agent is intentionally conservative and does not yet perform generalized autonomous code modification across arbitrary repositories.
- Live PR submission now has guarded draft-PR wiring, but it still needs full validation against real allowlisted GitHub repositories before broader production use.
- The worker model now includes a queue-first lifecycle, lease-based stale-run detection, and operator abort controls, but it is not yet backed by a distributed durable queue service with multi-node coordination.
- The repo now supports Postgres-mode Prisma config, Redis-assisted worker coordination, monitoring surfaces, and Docker-ready sandbox config, but a real hosted rollout still needs managed infrastructure, secrets, and deployment orchestration.
- GitHub discovery uses a simple search query and can be made smarter with repository quality and buildability profiling.
- The fully completed autonomous path is deterministic today through bounded adapters and local fixture repos; arbitrary third-party repo editing still needs stronger repo-aware execution strategies.

## Future Roadmap

- durable distributed mission job runner and lease-based queue
- stronger repo-specific execution adapters
- live branch push and pull request creation
- richer scoring heuristics and repo health checks
- signed proof publishing and onchain identity registration
- operator approvals and review workflow
