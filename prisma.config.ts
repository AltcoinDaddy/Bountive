import process from "node:process";
import { defineConfig, env } from "prisma/config";

process.loadEnvFile?.(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  engine: "classic",
  migrations: {
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: env("DATABASE_URL")
  }
});
