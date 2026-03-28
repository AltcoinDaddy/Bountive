import { ProtectedAppLayout } from "@/components/protected-app-layout";

export default async function LogsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedAppLayout nextPath="/logs">{children}</ProtectedAppLayout>;
}
