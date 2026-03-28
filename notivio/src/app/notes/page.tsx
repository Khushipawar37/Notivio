import Link from "next/link";
import { WorkspaceLayout } from "../components/workspace/workspace-layout";
import { stackServerApp } from "@/stack/server";
import {
  LogIn,
  Sparkles,
  Play,
  BookOpen,
  Brain,
  Bot,
  Zap,
  ArrowRight,
  Home,
  UserPlus,
} from "lucide-react";

const features = [
  { icon: Sparkles, label: "AI Summaries" },
  { icon: BookOpen, label: "Smart Editor" },
  { icon: Zap, label: "Flashcards" },
  { icon: Brain, label: "Knowledge Graphs" },
  { icon: Bot, label: "AI Chat" },
];

export default async function NotesPage() {
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (user) return <WorkspaceLayout />;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f8f4ec] via-[#f5f0e8] to-[#f2eadf] px-4 pb-16 pt-32">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-10">

        {/* ── Hero: Unlock Your Study Workspace ── */}
        <section className="w-full rounded-3xl border border-[#c6ac8f]/25 bg-white/70 px-8 py-10 text-center shadow-xl backdrop-blur-md sm:px-12 sm:py-14 transition-shadow duration-300 hover:shadow-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c6ac8f]/30 to-[#8a7559]/20 shadow-inner">
            <BookOpen className="h-8 w-8 text-[#6f5b43]" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#5d4a34] sm:text-4xl">
            Unlock Your Study Workspace
          </h1>

          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[#7a6852]">
            Create &amp; organise notes with a powerful editor, generate AI summaries, flashcards, knowledge graphs, and chat with an AI study&nbsp;assistant — all in one place.
          </p>

          {/* Feature pills */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            {features.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#c6ac8f]/30 bg-[#f5efe5] px-3 py-1.5 text-xs font-medium text-[#6f5b43] transition-colors hover:bg-[#ede1d1]"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/login"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#8a7559] px-8 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#7a664f] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <LogIn className="h-4 w-4" />
              Login to Continue
            </Link>

            <Link
              href="/auth/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#c6ac8f]/45 bg-white px-8 text-sm font-semibold text-[#6f5b43] shadow-sm transition-all duration-200 hover:bg-[#f3ebdf] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <UserPlus className="h-4 w-4" />
              Create Free Account
            </Link>
          </div>
        </section>

        {/* ── YouTube Converter Callout ── */}
        <section className="group w-full rounded-2xl border border-[#c6ac8f]/20 bg-gradient-to-r from-white/80 to-[#fff7ee]/90 px-8 py-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl sm:px-10">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 shadow-inner transition-transform duration-300 group-hover:scale-105">
              <Play className="h-7 w-7 text-red-500" />
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[#5d4a34]">
                Convert YouTube Lectures to Notes — Free
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[#7a6852]">
                Instantly turn any YouTube lecture into structured, revision-ready study notes. No account required&nbsp;—&nbsp;just paste a link and go.
              </p>
            </div>

            <Link
              href="/convert"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#8a7559] px-6 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#7a664f] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Try it Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ── Footer Nudge ── */}
        <div className="flex items-center gap-2 text-sm text-[#8e775e]">
          <Home className="h-4 w-4" />
          <span>New to Notivio?</span>
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-medium text-[#6f5b43] underline decoration-[#c6ac8f]/50 underline-offset-2 transition-colors hover:text-[#5d4a34] hover:decoration-[#8a7559]"
          >
            See what Notivio can do
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>
    </main>
  );
}
