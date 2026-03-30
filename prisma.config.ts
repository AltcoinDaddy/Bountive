import process from "node:process";
import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "prisma/config";

function loadLocalEnvFile() {
  if (!existsSync(".env")) {
    return;
  }

  const content = readFileSync(".env", "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  }
}

loadLocalEnvFile();

function resolveDatabaseProvider() {
  if (process.env.DATABASE_PROVIDER === "postgresql") {
    return "postgresql" as const;
  }

  if (process.env.DATABASE_URL?.startsWith("postgresql://") || process.env.DATABASE_URL?.startsWith("postgres://")) {
    return "postgresql" as const;
  }

  return "sqlite" as const;
}

const databaseProvider = resolveDatabaseProvider();
const fallbackDatabaseUrl =
  databaseProvider === "postgresql"
    ? "postgresql://postgres:postgres@127.0.0.1:5432/bountive?schema=public"
    : "file:./dev.db";

export default defineConfig({
  schema: databaseProvider === "postgresql" ? "prisma/schema.postgres.prisma" : "prisma/schema.prisma",
  engine: "classic",
  migrations: {
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: process.env.DATABASE_URL ?? fallbackDatabaseUrl
  }
});
