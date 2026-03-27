import Link from "next/link";
import { WorkspaceLayout } from "../components/workspace/workspace-layout";
import { stackServerApp } from "@/stack/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import YouTubeQuickNotes from "../components/notes/YouTubeQuickNotes";

export default async function NotesPage() {
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (user) return <WorkspaceLayout />;

  const demoNotebooks = [
    {
      title: "Exam Sprint Planner",
      description:
        "7-day revision notebook template with daily goals, active recall prompts, and reflection slots.",
      tags: ["Planning", "High-school", "Read-only"],
    },
    {
      title: "STEM Lecture Breakdown",
      description:
        "Structured page format for definitions, worked examples, and quick formula recall blocks.",
      tags: ["STEM", "Lecture", "Demo"],
    },
    {
      title: "Language Learning Journal",
      description:
        "Template for vocabulary capture, context sentences, listening notes, and weekly checkpoints.",
      tags: ["Language", "Habits", "Template"],
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f8f4ec] via-[#f5f0e8] to-[#f2eadf] px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-[#c6ac8f]/30 shadow-lg transition-all duration-300 hover:shadow-xl">
            <CardHeader className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#c6ac8f]/35 bg-[#c6ac8f]/10 px-3 py-1 text-xs font-medium text-[#6f5b43]">
                <Lock className="h-3.5 w-3.5" />
                Private Notes
              </div>
              <CardTitle className="text-2xl text-[#6f5b43]">
                Your notes are private. Login to save and sync across devices.
              </CardTitle>
              <CardDescription className="text-base text-[#7a6852]">
                Login to access your saved notes and notebooks — or try a YouTube quick-note demo below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Button asChild className="h-11 bg-[#8a7559] text-white hover:bg-[#7a664f]">
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 border-[#c6ac8f]/45 bg-white text-[#6f5b43] hover:bg-[#f3ebdf]"
                >
                  <Link href="/" className="inline-flex items-center justify-center gap-1">
                    Explore Home
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="rounded-xl bg-[#fffaf2] p-4 text-sm text-[#6f5b43]">
                Create quick public drafts from YouTube now, then sign in when you want to save to notebooks.
              </div>
            </CardContent>
          </Card>

          <YouTubeQuickNotes />
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[#6f5b43]">
            <Sparkles className="h-4 w-4" />
            <h2 className="text-lg font-semibold">Public demo notebooks & study templates</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {demoNotebooks.map((notebook) => (
              <Card
                key={notebook.title}
                className="rounded-xl border-[#c6ac8f]/25 bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-[#6f5b43]">{notebook.title}</CardTitle>
                  <CardDescription className="text-sm">{notebook.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {notebook.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#c6ac8f]/15 px-2.5 py-1 text-xs font-medium text-[#6f5b43]"
                    >
                      {tag}
                    </span>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
