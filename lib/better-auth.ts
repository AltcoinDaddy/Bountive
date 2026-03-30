import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: env.databaseProvider === "postgresql" ? "postgresql" : "sqlite"
  }),
  secret: env.betterAuthSecret,
  baseURL: env.betterAuthUrl || undefined,
  basePath: "/api/auth",
  trustedOrigins: env.betterAuthTrustedOrigins.length > 0 ? env.betterAuthTrustedOrigins : undefined,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8
  },
  user: {
    modelName: "AuthUser"
  },
  session: {
    modelName: "AuthSession"
  },
  account: {
    modelName: "AuthAccount"
  },
  verification: {
    modelName: "AuthVerification"
  },
  plugins: [nextCookies()]
});
