import { ProtectedAppLayout } from "@/components/protected-app-layout";

export default async function MissionsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedAppLayout nextPath="/missions">{children}</ProtectedAppLayout>;
}
