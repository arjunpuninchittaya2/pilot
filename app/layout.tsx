import type { Metadata } from "next";
import "@assistant-ui/react-ui/styles/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hack Club AI Chat",
  description: "BYOK chat with Hack Club AI + web search",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        {children}
      </body>
    </html>
  );
}
