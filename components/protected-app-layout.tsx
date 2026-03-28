import { AppShell } from "@/components/app-shell";
import { requireOperatorSession } from "@/lib/auth";

export async function ProtectedAppLayout({
  children,
  nextPath
}: {
  children: React.ReactNode;
  nextPath: string;
}) {
  await requireOperatorSession(nextPath);
  return <AppShell>{children}</AppShell>;
}
