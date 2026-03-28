import { ProtectedAppLayout } from "@/components/protected-app-layout";

export default async function TimelineLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedAppLayout nextPath="/timeline">{children}</ProtectedAppLayout>;
}
