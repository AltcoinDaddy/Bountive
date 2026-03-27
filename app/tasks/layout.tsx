import { AppShell } from "@/components/app-shell";

export default function TasksLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
