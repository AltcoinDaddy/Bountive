import process from "node:process";
import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

if (existsSync(".env")) {
  process.loadEnvFile?.(".env");
}

const databaseProvider = process.env.DATABASE_PROVIDER === "postgresql" ? "postgresql" : "sqlite";
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
