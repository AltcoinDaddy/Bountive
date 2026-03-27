import { AppShell } from "@/components/app-shell";

export default function SubmissionLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
