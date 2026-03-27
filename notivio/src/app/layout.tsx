import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "./components/home/Navbar";
import { ToastWrapper } from "./components/ui/use-toast";
import { AppProviders } from "./providers";
import { stackServerApp } from "@/stack/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
