import { ProtectedAppLayout } from "@/components/protected-app-layout";

export default async function MonitoringLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedAppLayout nextPath="/monitoring">{children}</ProtectedAppLayout>;
}
