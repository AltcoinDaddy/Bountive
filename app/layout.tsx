import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Bountive",
  description: "Autonomous GitHub-first task bounty system"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
