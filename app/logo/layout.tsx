import { AppShell } from "@/components/app-shell";

export default function LogoLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
