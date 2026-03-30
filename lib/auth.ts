import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { auth } from "@/lib/better-auth";

const OPERATOR_SESSION_COOKIE = "bountive_operator_session";
const SIGNED_OUT_SENTINEL = "__signed_out__";

export type OperatorSession = {
  authMode: string;
  operatorName: string | null;
  operatorEmail: string | null;
  isAuthenticated: boolean;
  userId: string | null;
  source: "better-auth" | "cookie" | "environment" | "none";
};

function normalizeEmail(value: string | null | undefined) {
  const trimmed = value?.trim().toLowerCase() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export async function getOperatorSession(): Promise<OperatorSession> {
  if (env.authMode === "better-auth") {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (session?.user) {
      return {
        authMode: "better-auth",
        operatorName: session.user.name,
        operatorEmail: normalizeEmail(session.user.email),
        isAuthenticated: true,
        userId: session.user.id,
        source: "better-auth"
      };
    }

    return {
      authMode: "better-auth",
      operatorName: null,
      operatorEmail: null,
      isAuthenticated: false,
      userId: null,
      source: "none"
    };
  }

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(OPERATOR_SESSION_COOKIE)?.value ?? null;
  const cookieEmail = normalizeEmail(cookieValue);

  if (cookieValue === SIGNED_OUT_SENTINEL) {
    return {
      authMode: env.authMode,
      operatorName: null,
      operatorEmail: null,
      isAuthenticated: false,
      userId: null,
      source: "none"
    };
  }

  const envEmail = normalizeEmail(env.operatorEmail);

  if (cookieEmail) {
    return {
      authMode: env.authMode,
      operatorName: null,
      operatorEmail: cookieEmail,
      isAuthenticated: true,
      userId: null,
      source: "cookie"
    };
  }

  if (envEmail) {
    return {
      authMode: env.authMode,
      operatorName: null,
      operatorEmail: envEmail,
      isAuthenticated: true,
      userId: null,
      source: "environment"
    };
  }

  return {
    authMode: env.authMode,
    operatorName: null,
    operatorEmail: null,
    isAuthenticated: false,
    userId: null,
    source: "none"
  };
}

export async function requireOperatorSession(nextPath?: string) {
  const session = await getOperatorSession();

  if (session.isAuthenticated) {
    return session;
  }

  const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
  redirect(`/auth/sign-in${next}` as never);
}

export async function setOperatorSession(email: string) {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    throw new Error("Operator email is required.");
  }

  const cookieStore = await cookies();
  cookieStore.set(OPERATOR_SESSION_COOKIE, normalized, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });

  return normalized;
}

export async function clearOperatorSession() {
  const cookieStore = await cookies();
  cookieStore.set(OPERATOR_SESSION_COOKIE, SIGNED_OUT_SENTINEL, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}
