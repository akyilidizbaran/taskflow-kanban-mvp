import type { Metadata } from "next";
import "./globals.css";

import { ToastProvider } from "@/components/ui/ToastProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://taskflow-zeta-ten.vercel.app"),
  title: {
    default: "TaskFlow",
    template: "%s | TaskFlow",
  },
  description: "A simple Kanban board for focused project management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full text-foreground">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
