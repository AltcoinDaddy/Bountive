"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearOperatorSession, setOperatorSession } from "@/lib/auth";

function getRedirectTarget(formData: FormData) {
  const next = String(formData.get("next") ?? "/dashboard");
  return (next.startsWith("/") ? next : "/dashboard") as `/${string}`;
}

export async function signInAction(formData: FormData) {
  const next = getRedirectTarget(formData);
  const email = String(formData.get("operatorEmail") ?? "");

  try {
    await setOperatorSession(email);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign-in failed.";
    redirect(`/auth/sign-in?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/missions");
  revalidatePath("/identity");
  redirect(next as never);
}

export async function signOutAction(formData: FormData) {
  const next = getRedirectTarget(formData);
  await clearOperatorSession();
  revalidatePath("/dashboard");
  revalidatePath("/missions");
  revalidatePath("/identity");
  redirect(next as never);
}
