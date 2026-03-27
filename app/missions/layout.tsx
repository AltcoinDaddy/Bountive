import { AppShell } from "@/components/app-shell";

export default function MissionsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
