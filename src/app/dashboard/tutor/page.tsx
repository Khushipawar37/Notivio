import Link from "next/link";
import { stackServerApp } from "@/stack/server";
import { TutorClient } from "./tutor-client";
import Footer from "../../components/home/Footer";
import { Bot, Brain, LogIn, MessageSquare, UserPlus, Zap } from "lucide-react";

export default async function TutorPage() {
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    return (
      <>
        <main className="min-h-screen bg-gradient-to-b from-[#f8f4ec] via-[#f5f0e8] to-[#f2eadf] px-4 pb-16 pt-32">
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8">
            <section className="w-full rounded-3xl border border-[#c6ac8f]/25 bg-white/75 px-8 py-10 text-center shadow-xl backdrop-blur-md sm:px-12 sm:py-14">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c6ac8f]/30 to-[#8a7559]/20 shadow-inner">
                <Bot className="h-8 w-8 text-[#6f5b43]" />
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[#5d4a34] sm:text-4xl">
                Unlock Your Personal Tutor
              </h1>

              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[#7a6852]">
                Sign in to access guided practice, timed tests, source-aware explanations, and saved tutor sessions.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
                {[
                  { icon: Brain, label: "Adaptive Practice" },
                  { icon: MessageSquare, label: "Source Chat" },
                  { icon: Zap, label: "Timed Tests" },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#c6ac8f]/30 bg-[#f5efe5] px-3 py-1.5 text-xs font-medium text-[#6f5b43]"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                ))}
              </div>

              <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/auth/login"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#8a7559] px-8 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#7a664f]"
                >
                  <LogIn className="h-4 w-4" />
                  Login to Continue
                </Link>

                <Link
                  href="/auth/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#c6ac8f]/45 bg-white px-8 text-sm font-semibold text-[#6f5b43] shadow-sm transition-all duration-200 hover:bg-[#f3ebdf]"
                >
                  <UserPlus className="h-4 w-4" />
                  Create Free Account
                </Link>
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TutorClient />
      <Footer />
    </>
  );
}
