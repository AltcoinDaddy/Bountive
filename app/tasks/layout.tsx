import { ProtectedAppLayout } from "@/components/protected-app-layout";

export default async function TasksLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedAppLayout nextPath="/tasks">{children}</ProtectedAppLayout>;
}
