import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "./components/home/Navbar";
import { ToastWrapper } from "./components/ui/use-toast";
import { AppProviders } from "./providers";
import { stackServerApp } from "@/stack/server";

export const metadata: Metadata = {
  title: "Notivio",
  description: "Notivio - Notes that Ace Exams",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await stackServerApp.getUser({ or: "return-null" });

  return (
    <html lang="en">
      <body className="antialiased">
        <AppProviders>
          <Suspense fallback={null}>
            <Navbar isAuthenticated={!!user} />
          </Suspense>
          <Suspense fallback={null}>
            <ToastWrapper>{children}</ToastWrapper>
          </Suspense>
        </AppProviders>
      </body>
    </html>
  );
}
