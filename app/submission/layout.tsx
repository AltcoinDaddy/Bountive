import { ProtectedAppLayout } from "@/components/protected-app-layout";

export default async function SubmissionLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedAppLayout nextPath="/submission">{children}</ProtectedAppLayout>;
}
