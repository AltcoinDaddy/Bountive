# Bountive Architecture

## Overview

Bountive is a GitHub-first autonomous bounty operator built around one reliable mission lifecycle:

`discover -> plan -> execute -> verify -> submit`

The MVP keeps the architecture modular even where the implementation remains deliberately conservative. Dry-run mode is the default operating posture, live submissions are disabled unless explicitly enabled, and mission artifacts are written to disk for review and auditability.

## Runtime Shape

- `app/*`: Next.js App Router pages for operations, missions, tasks, timeline, logs, identity, and submission.
- `components/*`: Premium light-mode dashboard components with reusable cards, tables, and mission controls.
- `agents/*`: Specialized mission actors for scouting, planning, execution, QA, and submission drafting.
- `lib/*`: Orchestrator, GitHub client, scoring, safety, verification, identity, workspace, and artifact utilities.
- `prisma/*`: SQLite-backed Prisma schema and seed script.
- `artifacts/*`: Machine-readable manifests, logs, mission summaries, proof records, and isolated workspaces.

## Mission Lifecycle

### 1. Discover

`ScoutAgent` queries GitHub issues through Octokit using label-driven discovery. When no `GITHUB_TOKEN` is configured, the system falls back to a local discovery fixture so the MVP remains runnable offline.

Outputs:

- candidate issue list
- basic repository metadata
- discovery event log

### 2. Plan

`PlannerAgent` scores each candidate with the scoring engine across:

- clarity
- complexity
- buildability

It rejects vague or oversized tasks and persists the explicit selection or rejection reason for each candidate.

Outputs:

- ranked candidate list
- selected task
- confidence score
- planner event log

### 3. Execute

`DeveloperAgent` creates an isolated workspace in `artifacts/workspaces/<mission-id>` and attempts a safe repository clone. The MVP intentionally uses a conservative execution strategy:

- clone repository in an isolated folder
- inspect package manager and build/lint/test scripts
- write an execution plan artifact
- avoid unsafe or destructive shell commands

This keeps the product runnable and auditable without pretending to have a generalized autonomous code-modification engine before one is properly integrated.

Outputs:

- workspace metadata
- execution notes
- execution plan artifact
- developer event log

### 4. Verify

`QAAgent` invokes the verification engine, which runs `build`, `lint`, and `test` only when those scripts exist.

The QA decision is computed from:

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
- PR title
- PR body
- changed files
- submission status

In dry-run mode this remains a draft artifact. The architecture leaves a clear extension point for real PR creation when live mode is enabled and the repository is allowlisted.

Outputs:

- `Submission`
- submission artifact
- submitter event log

## Safety Model

The safety engine enforces:

- dry-run by default
- live submission restricted by explicit config
- allowlisted repositories required for live mode
- retry limits
- model/tool call budgets
- changed-file budget
- mission timeout
- blocked destructive shell command patterns
- failed-check approval blocked unless policy explicitly allows it

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

## Identity and Proof

The identity layer is metadata-first for the MVP:

- operator wallet association
- network
- identity reference
- registration transaction hash
- manifest URI
- proof record history

`agent.json` acts as the current capability manifest. Proof records hash mission-linked verification and submission metadata to provide a clean plug-in point for future onchain registration or attestation.

## Artifact Strategy

Artifacts are written to disk for operator review:

- `artifacts/generated/agent.json`
- `artifacts/generated/agent_log.json`
- `artifacts/missions/<mission-id>.summary.json`
- `artifacts/missions/<mission-id>.verification.json`
- `artifacts/missions/<mission-id>.submission.json`
- `artifacts/proof-records/<proof-id>.json`

This keeps the MVP transparent and easy to inspect without needing additional infrastructure.

## Future Extension Points

- live GitHub branch and PR creation
- deeper repo-aware code mutation strategies
- background job queue and durable workers
- richer candidate heuristics and repository build profiling
- onchain identity registration and signed proof publishing
