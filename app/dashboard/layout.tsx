import { ProtectedAppLayout } from "@/components/protected-app-layout";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedAppLayout nextPath="/dashboard">{children}</ProtectedAppLayout>;
}
