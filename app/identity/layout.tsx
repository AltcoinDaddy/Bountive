import { ProtectedAppLayout } from "@/components/protected-app-layout";

export default async function IdentityLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedAppLayout nextPath="/identity">{children}</ProtectedAppLayout>;
}
