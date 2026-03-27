import type { DiscoveryCandidate } from "@/lib/types";

export const mockIssues: DiscoveryCandidate[] = [
  {
    repo: "vercel/next.js",
    repoUrl: "https://github.com/vercel/next.js",
    issueNumber: 72101,
    issueTitle: "Clarify docs for the image remote pattern warning",
    issueUrl: "https://github.com/vercel/next.js/issues/72101",
    issueBody: "The current warning explains that the remote pattern is invalid but does not tell the reader which field is malformed. Add a short example and acceptance notes.",
    labels: ["documentation", "good first issue"],
    repoDescription: "The React Framework",
    defaultBranch: "canary",
    language: "TypeScript",
    stars: 128000
  },
  {
    repo: "tailwindlabs/tailwindcss",
    repoUrl: "https://github.com/tailwindlabs/tailwindcss",
    issueNumber: 17642,
    issueTitle: "Improve CLI error message when the config file is missing",
    issueUrl: "https://github.com/tailwindlabs/tailwindcss/issues/17642",
    issueBody: "The CLI exits with a generic stack trace. The desired change is a clearer actionable error and one new test for the missing config path.",
    labels: ["bug", "help wanted"],
    repoDescription: "A utility-first CSS framework",
    defaultBranch: "next",
    language: "TypeScript",
    stars: 85000
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
