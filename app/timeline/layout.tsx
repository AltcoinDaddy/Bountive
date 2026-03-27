import { AppShell } from "@/components/app-shell";

export default function TimelineLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
