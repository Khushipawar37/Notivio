"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, CheckCircle2, Lock } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type Quality = "quick" | "balanced" | "detailed";

interface TranscriptResponse {
  transcript?: string;
  title?: string;
  success?: boolean;
  error?: string;
  details?: string;
}

function buildDraftNote(
  title: string,
  transcript: string,
  quality: Quality,
): string {
  const words = transcript.split(/\s+/).filter(Boolean);
  const targetLength = quality === "quick" ? 110 : quality === "balanced" ? 180 : 260;
  const snippet = words.slice(0, targetLength).join(" ");

  const firstSentence = snippet.split(". ").slice(0, 2).join(". ");
  const keyIdeas = snippet
    .split(/[.!?]/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, quality === "quick" ? 3 : 5)
    .map((line) => `- ${line}`);

  return [
    `# ${title}`,
    "",
    "## Summary",
    firstSentence || "This video introduces practical ideas worth revising.",
    "",
    "## Key takeaways",
    ...keyIdeas,
    "",
    "## Quick review prompts",
    "- What is the main concept explained in this video?",
    "- Which example from the video can you apply this week?",
    "- What should you revise next for better retention?",
  ].join("\n");
}

export default function YouTubeQuickNotes() {
  const [videoUrl, setVideoUrl] = useState("");
  const [quality, setQuality] = useState<Quality>("balanced");
  const [draftNote, setDraftNote] = useState("");
  const [videoTitle, setVideoTitle] = useState("Example: Learn Calculus in 20 Minutes");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const placeholderPreview = useMemo(
    () =>
      [
        "# Example: Learn Calculus in 20 Minutes",
        "",
        "## Summary",
        "Derivatives measure change, while integrals measure accumulation. The video connects both through intuitive motion and area examples.",
        "",
        "## Key takeaways",
        "- Derivative = rate of change at a point",
        "- Integral = total accumulation over an interval",
        "- Fundamental theorem links both ideas",
        "",
        "## Quick review prompts",
        "- How would you explain derivative to a classmate?",
        "- Where do you see integrals in real data?",
      ].join("\n"),
    [],
  );

  const handleGenerate = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const query = new URLSearchParams({ url: videoUrl.trim() });
      const response = await fetch(`/api/video-transcript?${query.toString()}`);
      const data = (await response.json()) as TranscriptResponse;

      if (!response.ok || !data.success || !data.transcript) {
        throw new Error(data.error || data.details || "Could not generate notes.");
      }

      const title = data.title?.trim() || "YouTube Quick Note";
      setVideoTitle(title);
      setDraftNote(buildDraftNote(title, data.transcript, quality));
      setMessage("Draft created — sign in to save to your notebooks.");
    } catch (err) {
      const messageText =
        err instanceof Error ? err.message : "Unexpected error while generating notes.";
      setError(messageText);
      setDraftNote("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl shadow-lg border-[#c6ac8f]/30 transition-all duration-300 hover:shadow-xl">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl text-[#6f5b43]">YouTube Quick Notes</CardTitle>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#c6ac8f]/20 px-2.5 py-1 text-xs font-medium text-[#6f5b43]">
            <Sparkles className="h-3.5 w-3.5" />
            Public demo
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Paste a YouTube URL and get a fast, non-persisted study draft in one click.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="youtube-url" className="text-sm font-medium text-[#6f5b43]">
            YouTube URL
          </label>
          <Input
            id="youtube-url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            className="border-[#c6ac8f]/40 focus-visible:ring-[#c6ac8f]/50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="quality" className="text-sm font-medium text-[#6f5b43]">
            Note quality
          </label>
          <select
            id="quality"
            value={quality}
            onChange={(event) => setQuality(event.target.value as Quality)}
            className="h-10 w-full rounded-md border border-[#c6ac8f]/40 bg-white px-3 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-[#c6ac8f]/50"
          >
            <option value="quick">Quick</option>
            <option value="balanced">Balanced</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !videoUrl.trim()}
          className="w-full bg-[#8a7559] text-white hover:bg-[#7a664f]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Notes...
            </>
          ) : (
            "Generate Notes"
          )}
        </Button>

        {message ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 animate-in fade-in duration-300">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#6f5b43]">Generated preview</p>
            <span className="text-xs text-muted-foreground">{videoTitle}</span>
          </div>
          <Textarea
            value={draftNote || placeholderPreview}
            readOnly
            className="min-h-[260px] border-[#c6ac8f]/35 bg-[#fffdf9] font-mono text-xs leading-relaxed"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button asChild className="bg-[#8a7559] text-white hover:bg-[#7a664f]">
            <Link href="/auth/login">Sign up / Login to save</Link>
          </Button>
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Draft is visible now, saved only after sign in.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
