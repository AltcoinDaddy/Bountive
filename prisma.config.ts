import process from "node:process";
import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

if (existsSync(".env")) {
  process.loadEnvFile?.(".env");
}

const databaseProvider = process.env.DATABASE_PROVIDER === "postgresql" ? "postgresql" : "sqlite";

export default defineConfig({
  schema: databaseProvider === "postgresql" ? "prisma/schema.postgres.prisma" : "prisma/schema.prisma",
  engine: "classic",
  migrations: {
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: env("DATABASE_URL")
  }
});
