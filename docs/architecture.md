# Bountive Architecture

## Overview

Bountive is a GitHub-first autonomous bounty operator built around one reliable mission lifecycle:

`discover -> plan -> execute -> verify -> submit`

The MVP keeps the architecture modular even where the implementation remains deliberately conservative. Dry-run mode is the default operating posture, live submissions are disabled unless explicitly enabled, and mission artifacts are written to disk for review and auditability.

## Runtime Shape

- `app/*`: Next.js App Router pages for operations, missions, tasks, timeline, logs, monitoring, identity, submission, and operator auth.
- `components/*`: Premium light-mode dashboard components with reusable cards, tables, and mission controls.
- `agents/*`: Specialized mission actors for scouting, planning, execution, QA, and submission drafting.
- `lib/*`: Orchestrator, GitHub client, scoring, safety, verification, identity, workspace, and artifact utilities.
- `lib/execution-adapters/*`: Deterministic, safety-bounded execution strategies for supported task classes.
- `scripts/run-mission-worker.ts`: Local queue worker for draining queued missions outside the web request path.
- `prisma/*`: Prisma schema and seed script with environment-driven SQLite or Postgres datasource support.
- `artifacts/*`: Machine-readable manifests, logs, mission summaries, proof records, and isolated workspaces.

## Mission Lifecycle

### 0. Queue

Mission launches from the UI are persisted first and enter a `QUEUED` state. A worker then claims the oldest queued mission, stamps worker metadata, and begins execution. Running missions update heartbeats while they progress, and stale leases can be surfaced for operator recovery. When `REDIS_URL` is configured, workers can also wake from queue notifications instead of relying only on interval polling. This keeps the operator flow closer to a production control plane even though the local worker is still lightweight.

Outputs:

- queued mission record
- queue event log
- worker assignment metadata
- heartbeat and lease metadata

### Access and workspace policy

Protected app routes now resolve an operator session before rendering. Better Auth is now the primary path, with Prisma-backed user, session, account, and verification tables behind the `/api/auth/[...all]` route. Local cookie fallback remains available only when `AUTH_MODE=local`. Workspace policy is persisted separately so approval thresholds and allowed task categories remain stable across mission launches.

Outputs:

- operator session state
- workspace approval policy
- editable task-category allowlist
- operator email context for launch and review

### 1. Discover

`ScoutAgent` queries GitHub issues through Octokit using label-driven discovery. For allowlisted live missions it now prefers repo-scoped issue listing instead of global search, which reduces GitHub search-rate pressure during targeted runs. Discovery is GitHub-only and requires a valid token so mission execution always reflects real repository data.

Outputs:

- candidate issue list
- basic repository metadata
- discovery event log

### 2. Plan

`PlannerAgent` scores each candidate with the scoring engine across:

- clarity
- complexity
- buildability

It rejects vague or oversized tasks, biases selection toward candidates with registered execution support, and persists the explicit selection or rejection reason for each candidate together with execution support metadata.

Outputs:

- ranked candidate list
- selected task
- confidence score
- planner event log

### 3. Execute

`DeveloperAgent` creates an isolated workspace in `artifacts/workspaces/<mission-id>` and attempts a safe repository clone. The MVP intentionally uses a conservative execution strategy:

- clone repository in an isolated folder
- create an isolated mission branch
- inspect package manager and build/lint/test scripts
- select a deterministic execution adapter only for explicitly supported tasks
- route command execution through a bounded sandbox layer
- write an execution plan artifact
- avoid unsafe or destructive shell commands

The sandbox layer currently supports:

- `local-guarded`
  command allowlist, scrubbed env vars, mission timeouts, workspace-only execution
- `docker`
  workspace bind-mount, `--network none`, CPU and memory limits, and containerized command execution

This keeps the product runnable and auditable without pretending to have a generalized autonomous code-modification engine before one is properly integrated.

Outputs:

- workspace metadata
- execution notes
- execution plan artifact
- developer event log

### 4. Verify

`QAAgent` now captures a baseline verification snapshot before the repository is mutated, then invokes the verification engine after execution. The engine performs guarded dependency installation with lifecycle scripts disabled and then runs `build`, `lint`, and `test` only when those scripts exist.

The QA decision is computed from:

- baseline versus post-patch check comparison
- check results
- current approval policy
- mission guardrails

Outputs:

- `VerificationReport`
- verification summary artifact
- QA event log

### 5. Submit

`SubmitterAgent` generates a submission artifact containing:

- branch name
- commit message
- local commit hash when a real diff exists
- PR title
- PR body
- changed files
- submission status

In dry-run mode this remains a draft artifact. The architecture leaves a clear extension point for real PR creation when live mode is enabled and the repository is allowlisted. If verification fails or no repository diff exists, submission is explicitly blocked instead of being presented as ready.

When live mode is enabled and a repository is explicitly allowlisted, the current implementation can publish a draft pull request through GitHub using the configured token. This path remains disabled by default, and missions now preflight live readiness against the feature flag, token presence, and allowlist state before continuing.

Current deterministic adapter coverage includes:

- structured text replacements defined directly in issue contracts
- structured JSON path updates defined directly in issue contracts
- VS Code Rust Analyzer linked-project settings updates
- conventional commitlint setup for bounded repository configuration tasks

Outputs:

- `Submission`
- submission artifact
- submitter event log

## Safety Model

The safety engine enforces:

- dry-run by default
- live submission restricted by explicit config
- operator abort controls for queued and running missions
- allowlisted repositories required for live mode
- retry limits
- model/tool call budgets
- changed-file budget
- mission timeout
- blocked destructive shell command patterns
- failed-check approval blocked unless policy explicitly allows it
- submission blocked when no repository diff exists
- live-mode launch preflight before queueing
- live-mode candidate discovery constrained to allowlisted repositories

These guardrails are captured per mission and surfaced in the UI.

## Data Model

SQLite via Prisma stores:

- `Mission`
- `CandidateTask`
- `AgentEventLog`
- `VerificationReport`
- `Submission`
- `IdentityRecord`
- `ProofRecord`

The dashboard pages query Prisma directly through server components and server actions.

The current repo can operate with SQLite for local MVP use or Postgres for production-style deployments. Queue durability still comes from the database row state, while Redis is used as an optional coordination layer for faster worker wake-ups.

## Identity and Proof

The identity layer is metadata-first for the MVP:

- operator wallet association
- network
- identity reference
- registration transaction hash
- manifest URI
- proof record history

`agent.json` acts as the current capability manifest and now includes the configured network, registration transaction metadata, manifest URI, and proof format version. Proof records hash mission-linked verification and submission metadata, and companion proof bundles package those hashes with identity, mission, and submission context to provide a clean plug-in point for future onchain registration or attestation.

Proof artifacts now include:

- signature artifacts with the signed proof hash when `BOUNTIVE_PROOF_SIGNING_KEY` is configured
- onchain publication artifacts that record inactive, blocked, failed, or published status

Optional onchain publication can be enabled through:

- `ENABLE_PROOF_PUBLISHING`
- `BOUNTIVE_CHAIN_RPC_URL`
- `BOUNTIVE_PROOF_REGISTRY_ADDRESS`

## Artifact Strategy

Artifacts are written to disk for operator review:

- `artifacts/generated/agent.json`
- `artifacts/generated/agent_log.json`
- `artifacts/missions/<mission-id>.summary.json`
- `artifacts/missions/<mission-id>.verification.json`
- `artifacts/missions/<mission-id>.submission.json`
- `artifacts/proof-records/<proof-id>.json`
- `artifacts/proof-records/<proof-id>.bundle.json`
- `artifacts/proof-records/<proof-id>.signature.json`
- `artifacts/proof-records/<proof-id>.onchain.json`

This keeps the MVP transparent and easy to inspect without needing additional infrastructure.

## Future Extension Points

- live GitHub branch and PR creation
- deeper repo-aware code mutation strategies
- distributed durable queue, worker leases, and multi-node recovery
- richer candidate heuristics and repository build profiling
- first-class auth providers, orgs, and approval workflows
- onchain identity registration and proof registry contracts
