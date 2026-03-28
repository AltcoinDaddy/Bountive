import { ProtectedAppLayout } from "@/components/protected-app-layout";

export default async function LogoLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedAppLayout nextPath="/logo">{children}</ProtectedAppLayout>;
}
