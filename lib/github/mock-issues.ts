import { join } from "node:path";
import type { DiscoveryCandidate } from "@/lib/types";

const fixtureRepoPath = join(process.cwd(), "fixtures", "demo-task-repo");
const cliFixtureRepoPath = join(process.cwd(), "fixtures", "demo-cli-repo");
const configFixtureRepoPath = join(process.cwd(), "fixtures", "demo-config-repo");
const jsonFixtureRepoPath = join(process.cwd(), "fixtures", "demo-json-repo");
const testFixtureRepoPath = join(process.cwd(), "fixtures", "demo-test-repo");
const structuredFixtureRepoPath = join(process.cwd(), "fixtures", "demo-structured-repo");

export const mockIssues: DiscoveryCandidate[] = [
  {
    repo: "bountive-fixtures/demo-task-repo",
    repoUrl: "https://github.com/bountive-fixtures/demo-task-repo",
    cloneUrl: fixtureRepoPath,
    issueNumber: 1,
    issueTitle: "Clarify docs for the image remote pattern warning",
    issueUrl: "https://github.com/bountive-fixtures/demo-task-repo/issues/1",
    issueBody:
      "The current warning explains that the remote pattern is invalid but does not tell the reader which field is malformed. Add a short example and acceptance notes. Update the documentation copy in docs/remote-pattern-warning.md and preserve the existing command output wording elsewhere.",
    labels: ["documentation", "good first issue"],
    repoDescription: "Local deterministic fixture repository for end-to-end autonomous mission runs.",
    defaultBranch: "main",
    language: "JavaScript",
    stars: 0
  },
  {
    repo: "bountive-fixtures/demo-cli-repo",
    repoUrl: "https://github.com/bountive-fixtures/demo-cli-repo",
    cloneUrl: cliFixtureRepoPath,
    issueNumber: 2,
    issueTitle: "Improve CLI error message when the config file is missing",
    issueUrl: "https://github.com/bountive-fixtures/demo-cli-repo/issues/2",
    issueBody:
      "The CLI exits with a generic missing-config message. Update src/messages/missing-config.txt so it tells the operator which file is expected and how to recover. Preserve the command surface and add actionable wording only.",
    labels: ["bug", "help wanted"],
    repoDescription: "Local deterministic fixture repo for CLI message repair missions.",
    defaultBranch: "main",
    language: "JavaScript",
    stars: 0
  },
  {
    repo: "bountive-fixtures/demo-json-repo",
    repoUrl: "https://github.com/bountive-fixtures/demo-json-repo",
    cloneUrl: jsonFixtureRepoPath,
    issueNumber: 6,
    issueTitle: "Enable proof publishing in the operator config through a structured JSON contract",
    issueUrl: "https://github.com/bountive-fixtures/demo-json-repo/issues/6",
    issueBody: [
      "Use the bounded structured JSON patch contract below to update config/operator.json.",
      "Only change the JSON field described in the contract.",
      "",
      "BOUNTIVE_JSON_TARGET: config/operator.json",
      "BOUNTIVE_JSON_PATH: proof.publish",
      "BOUNTIVE_JSON_VALUE: true"
    ].join("\n"),
    labels: ["configuration", "structured-json"],
    repoDescription: "Local bounded structured JSON fixture repository.",
    defaultBranch: "main",
    language: "JSON",
    stars: 0
  },
  {
    repo: "bountive-fixtures/demo-structured-repo",
    repoUrl: "https://github.com/bountive-fixtures/demo-structured-repo",
    cloneUrl: structuredFixtureRepoPath,
    issueNumber: 5,
    issueTitle: "Clarify the README setup note through a structured patch contract",
    issueUrl: "https://github.com/bountive-fixtures/demo-structured-repo/issues/5",
    issueBody: [
      "Use the bounded structured patch contract below to update the setup note in README.md.",
      "Only replace the matching paragraph and keep the rest of the file unchanged.",
      "",
      "BOUNTIVE_PATCH_TARGET: README.md",
      "BOUNTIVE_REPLACE:",
      "Run install before launch. The current note is too short and leaves out the config file path.",
      "",
      "BOUNTIVE_WITH:",
      "Run install before launch. Create a local .env from .env.example, then start the app so the operator has both runtime config and dependency state in place before the first mission."
    ].join("\n"),
    labels: ["documentation", "help wanted", "structured"],
    repoDescription: "Local bounded structured-patch fixture repository.",
    defaultBranch: "main",
    language: "Markdown",
    stars: 0
  },
  {
    repo: "prisma/prisma",
    repoUrl: "https://github.com/prisma/prisma",
    issueNumber: 24511,
    issueTitle: "Document the SQLite shadow database fallback in local workflows",
    issueUrl: "https://github.com/prisma/prisma/issues/24511",
    issueBody: "The docs do not mention when a local SQLite shadow database is created during migration commands. Add a short section and examples.",
    labels: ["documentation", "good first issue"],
    repoDescription: "Next-generation Node.js and TypeScript ORM",
    defaultBranch: "main",
    language: "TypeScript",
    stars: 39000
  },
  {
    repo: "bountive-fixtures/demo-config-repo",
    repoUrl: "https://github.com/bountive-fixtures/demo-config-repo",
    cloneUrl: configFixtureRepoPath,
    issueNumber: 3,
    issueTitle: "Repair mission defaults in the local config file",
    issueUrl: "https://github.com/bountive-fixtures/demo-config-repo/issues/3",
    issueBody:
      "The local mission config is missing stable defaults for retries and changed-file limits. Update config/bountive.config.json so the default dry-run posture is explicit, retryLimit is 2, and maxChangedFiles is 8. Acceptance: preserve the existing structure and change only the config file.",
    labels: ["configuration"],
    repoDescription: "Local deterministic fixture repo for configuration repair missions.",
    defaultBranch: "main",
    language: "JavaScript",
    stars: 0
  },
  {
    repo: "bountive-fixtures/demo-test-repo",
    repoUrl: "https://github.com/bountive-fixtures/demo-test-repo",
    cloneUrl: testFixtureRepoPath,
    issueNumber: 4,
    issueTitle: "Update the verification summary expectation to include install status",
    issueUrl: "https://github.com/bountive-fixtures/demo-test-repo/issues/4",
    issueBody:
      "The verification summary fixture only mentions build, lint, and test. Update test/fixtures/verification-summary.txt so it includes install status as the first segment. Acceptance: keep the formatting consistent and change only the expectation fixture.",
    labels: ["tests"],
    repoDescription: "Local deterministic fixture repo for test expectation repair missions.",
    defaultBranch: "main",
    language: "JavaScript",
    stars: 0
  },
  {
    repo: "reduxjs/redux-toolkit",
    repoUrl: "https://github.com/reduxjs/redux-toolkit",
    issueNumber: 5630,
    issueTitle: "Refactor async cache subsystem and standardize store adapters",
    issueUrl: "https://github.com/reduxjs/redux-toolkit/issues/5630",
    issueBody: "A broader architecture cleanup across multiple adapter layers with follow-up work expected after landing.",
    labels: ["help wanted"],
    repoDescription: "The official batteries-included toolset for Redux",
    defaultBranch: "master",
    language: "TypeScript",
    stars: 11000
  }
];
