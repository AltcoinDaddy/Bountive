# Bountive

Bountive is a production-style MVP for an autonomous GitHub-first task bounty system. It discovers real GitHub issues, selects a safe task, prepares an isolated execution workspace, applies a bounded fix strategy, verifies the result, and prepares submission artifacts with minimal human intervention.

The product is designed as a serious operations console, not a toy demo. The current implementation prioritizes one reliable, auditable mission flow end to end:

`discover -> plan -> execute -> verify -> submit`

## What Bountive Does

- discovers GitHub issues using configured labels and repo constraints
- scores candidates for clarity, complexity, and buildability
- selects one task within safety and compute limits
- clones the target repository into an isolated workspace
- applies a bounded execution strategy when a supported task matches
- runs verification checks before preparing a submission
- records logs, artifacts, and proof-linked metadata for auditability

## Why This Project Matters

Most autonomous coding demos stop at “generate a patch.” Bountive is built around the harder operational layer:

- mission selection
- safety guardrails
- compute budgets
- verification
- submission readiness
- operator visibility

That makes it closer to a real product for controlled autonomous software work, not just a single-shot code generation experiment.

## What’s Implemented Today

- Next.js App Router application with TypeScript and Tailwind
- Prisma-backed data layer with SQLite or Postgres runtime support
- GitHub issue discovery via Octokit
- modular agent architecture:
  - Scout Agent
  - Planner Agent
  - Developer Agent
  - QA Agent
  - Submitter Agent
- Central orchestrator with safety and compute budgets
- queue-first mission launch path with worker support
- guarded sandbox runner abstraction for workspace-only command execution
- File-based artifacts and structured logs
- Better Auth-backed operator access control
- workspace policy editing and live-mode readiness checks
- GitHub writable-repo visibility on the Missions page for live-target selection
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

## Product Surfaces

- `/` landing page
- `/dashboard` mission dashboard
- `/missions` mission launch, worker, policy, and live-readiness controls
- `/tasks` candidate task scoring and selection reasoning
- `/timeline` lifecycle event stream
- `/logs` structured execution logs
- `/monitoring` runtime health and queue state
- `/identity` operator session, identity metadata, and proof history
- `/submission` generated branch, commit, PR, and verification output

## How It Works

1. Queue
   Mission config is persisted first and claimed by a worker.
2. Discover
   Scout Agent finds GitHub issues through Octokit using labels and allowlist constraints.
3. Plan
   Planner Agent scores candidates and selects the safest supported task.
4. Execute
   Developer Agent clones the repo into an isolated workspace and applies a bounded execution adapter when a supported task matches.
5. Verify
   QA Agent runs guarded install/build/lint/test checks and compares post-patch health against the clean baseline.
6. Submit
   Submitter Agent prepares branch, commit, PR draft, and proof-linked submission artifacts.

Architecture details:
- [docs/architecture.md](/Users/daddy/Desktop/Bountive/docs/architecture.md)
- [docs/production-checklist.md](/Users/daddy/Desktop/Bountive/docs/production-checklist.md)

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

## Verification Model

Bountive does not treat “generated a patch” as success.

It verifies missions by:

- capturing a baseline repo health snapshot before mutation
- running guarded dependency install when needed
- running build, lint, and test when scripts exist
- comparing post-patch results against the baseline
- blocking submission when checks regress or no meaningful diff exists

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

Blockchain is intentionally not used as the execution engine. In Bountive, the identity layer is metadata-first.

It covers:

- operator wallet
- network
- identity reference
- registration transaction hash
- manifest URI
- proof record history

The repo generates machine-readable manifests, mission summaries, verification artifacts, submission artifacts, and proof records under `artifacts/`.

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

Most important variables:

- `DATABASE_URL`
- `DATABASE_PROVIDER`
- `GITHUB_TOKEN`
- `ALLOWLISTED_REPOS`
- `REDIS_URL`
- `AUTH_MODE`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`
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

### Optional Production-Like Local Stack

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

### Run A Real Mission Script

Use one of the bounded real-data runners:

```bash
npm run mission:real-dx
```

or:

```bash
npm run mission:real-commitlint
```

Current registered adapters include:

- structured text replacement from issue-defined contracts
- structured JSON path patching from issue-defined contracts
- VS Code Rust Analyzer workspace settings repair
- conventional commitlint setup for bounded JavaScript and TypeScript repository configuration tasks

## GitHub Integration

Set `GITHUB_TOKEN` for real issue discovery.

For real live draft PR submission, `GITHUB_TOKEN` must also have permission to create branches, commits, and pull requests on the selected allowlisted repository.

Live submissions are also gated by `ENABLE_LIVE_SUBMISSIONS`; if that flag is off, Bountive will keep missions in draft-only mode even when a launch request asks for live submission.

Set `ALLOWLISTED_REPOS` only to repositories you control and can safely use as live-mode sandboxes. The repo no longer ships with public-repository defaults for this setting.

Without a token, the UI can still render, but mission discovery and execution will not proceed because Bountive is now real-data-only.

Live-mode launches are also validated earlier now:

- launch-time live preflight blocks invalid live requests before queueing
- live discovery narrows candidate search to the configured allowlist
- selected repositories can be checked for token access and push permission from the Missions page

## Dry-Run Mode

Dry-run mode is the default and recommended local mode.

In dry-run mode Bountive will:

- queue missions for worker pickup when launched from the app
- discover and score real GitHub issues
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

Bountive now includes Better Auth as the primary operator authentication system:

- protected app routes redirect to `/auth/sign-in` when there is no active operator session
- Better Auth email/password sessions are persisted through Prisma-backed auth tables
- local cookie fallback remains available only when `AUTH_MODE=local`
- the Identity page exposes session source and lets operators sign out cleanly

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

## What Works Today

- serious product UI across all core surfaces
- Better Auth operator access control
- real GitHub discovery
- queue-first mission lifecycle with worker support
- bounded real repository mutation for supported task classes
- baseline-aware verification
- draft submission artifacts
- identity and proof metadata generation

## Current MVP Gaps

- The Developer Agent is intentionally conservative and does not yet perform generalized autonomous code modification across arbitrary repositories.
- Live PR submission now has guarded draft-PR wiring, but it still needs full validation against real allowlisted GitHub repositories before broader production use.
- The worker model now includes a queue-first lifecycle, lease-based stale-run detection, and operator abort controls, but it is not yet backed by a distributed durable queue service with multi-node coordination.
- The repo now supports Postgres-mode Prisma config, Redis-assisted worker coordination, monitoring surfaces, and Docker-ready sandbox config, but a real hosted rollout still needs managed infrastructure, secrets, and deployment orchestration.
- GitHub discovery uses a simple search query and can be made smarter with repository quality and buildability profiling.
- The autonomous path is currently bounded to supported real-repository task classes; arbitrary third-party repo editing still needs stronger repo-aware execution strategies.

## Future Roadmap

- durable distributed mission job runner and lease-based queue
- stronger repo-specific execution adapters
- live branch push and pull request creation
- richer scoring heuristics and repo health checks
- signed proof publishing and onchain identity registration
- operator approvals and review workflow
