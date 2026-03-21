/**
 * Video Transcript API Route
 *
 * Uses third-party APIs instead of scraping YouTube directly.
 * This is required when your environment blocks outbound requests to YouTube
 * (Vercel free tier, corporate proxies, etc.)
 *
 * Setup — add ONE of these to your .env.local:
 *
 * Option A (recommended, free tier available):
 *   RAPIDAPI_KEY=your_key_here
 *   → Sign up at https://rapidapi.com
 *   → Subscribe to "YouTube Transcript" (free: 100 req/month)
 *   → https://rapidapi.com/primasoluciones/api/youtube-transcript3
 *
 * Option B:
 *   SUPADATA_API_KEY=your_key_here
 *   → Sign up at https://supadata.ai (free tier available)
 */

import { type NextRequest, NextResponse } from "next/server";

function extractVideoId(input: string): string | null {
  if (!input) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    /(?:youtube\.com\/v\/)([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 20000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err: any) {
    clearTimeout(id);
    throw err.name === "AbortError"
      ? new Error(`Request timed out after ${timeoutMs}ms`)
      : err;
  }
}

// ─── Method 1: RapidAPI YouTube Transcript ───────────────────────────────────
async function fetchViaRapidAPI(videoId: string): Promise<string> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) throw new Error("RAPIDAPI_KEY not configured");

  console.log("Trying RapidAPI...");

  const response = await fetchWithTimeout(
    `https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId=${videoId}&lang=en`,
    {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "youtube-transcript3.p.rapidapi.com",
      },
    },
    15000
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`RapidAPI error ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();

  // Shape: { transcript: [{ text, duration, offset }] }
  if (Array.isArray(data?.transcript)) {
    const text = data.transcript
      .map((s: any) => s.text || "")
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length > 50) return text;
  }

  // Alternate shapes
  if (typeof data?.data === "string" && data.data.length > 50) return data.data;
  if (typeof data?.text === "string" && data.text.length > 50) return data.text;

  throw new Error("RapidAPI returned an unexpected response shape");
}

// ─── Method 2: Supadata ───────────────────────────────────────────────────────
async function fetchViaSupadata(videoId: string): Promise<string> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) throw new Error("SUPADATA_API_KEY not configured");

  console.log("Trying Supadata...");

  const response = await fetchWithTimeout(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`,
    {
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    },
    15000
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Supadata error ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();

  const transcript =
    typeof data?.content === "string"
      ? data.content
      : typeof data?.transcript === "string"
      ? data.transcript
      : null;

  if (!transcript || transcript.length < 50) {
    throw new Error("Supadata returned empty transcript");
  }

  return transcript.trim();
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────
async function fetchTranscriptWithFallbacks(
  videoId: string
): Promise<{ transcript: string; method: string }> {
  const methods = [
    { name: "RapidAPI", fn: () => fetchViaRapidAPI(videoId) },
    { name: "Supadata", fn: () => fetchViaSupadata(videoId) },
  ];

  // Filter to only methods that have their API key configured
  const configured = methods.filter((m) => {
    if (m.name === "RapidAPI") return !!process.env.RAPIDAPI_KEY;
    if (m.name === "Supadata") return !!process.env.SUPADATA_API_KEY;
    return true;
  });

  if (configured.length === 0) {
    throw new Error(
      "No API keys configured. Add RAPIDAPI_KEY or SUPADATA_API_KEY to .env.local"
    );
  }

  let lastError: Error | null = null;

  for (const method of configured) {
    try {
      const transcript = await method.fn();
      console.log(`✓ ${method.name} succeeded (${transcript.length} chars)`);
      return { transcript, method: method.name };
    } catch (err: any) {
      console.warn(`✗ ${method.name} failed: ${err.message}`);
      lastError = err;
    }
  }

  throw lastError ?? new Error("All transcript methods failed");
}

async function getVideoMetadata(videoId: string) {
  try {
    const res = await fetchWithTimeout(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { headers: { Accept: "application/json" } },
      8000
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.title) return { title: data.title, duration: "Unknown" };
    }
  } catch (_) {}
  return { title: `YouTube Video ${videoId}`, duration: "Unknown" };
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  console.log("=== Video Transcript API Called ===");

  const { searchParams } = new URL(request.url);
  const videoParam = searchParams.get("videoId") || searchParams.get("url");

  if (!videoParam) {
    return NextResponse.json(
      { error: "Video ID or URL is required", example: "?videoId=dQw4w9WgXcQ" },
      { status: 400 }
    );
  }

  const videoId = extractVideoId(videoParam);
  if (!videoId) {
    return NextResponse.json(
      { error: "Invalid YouTube video ID or URL", received: videoParam },
      { status: 400 }
    );
  }

  try {
    console.log(`Processing videoId: ${videoId}`);
    const { transcript, method } = await fetchTranscriptWithFallbacks(videoId);

    const cleanTranscript = transcript
      .replace(/\[.*?\]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const videoInfo = await getVideoMetadata(videoId);

    return NextResponse.json({
      transcript: cleanTranscript,
      title: videoInfo.title,
      duration: videoInfo.duration,
      videoId,
      wordCount: cleanTranscript.split(" ").filter((w) => w.length > 0).length,
      methodUsed: method,
      success: true,
    });
  } catch (error: any) {
    console.error("=== API Error ===", error.message);

    const isConfig = error.message.includes("not configured") || error.message.includes("No API keys");
    const isNoCaption =
      error.message.toLowerCase().includes("caption") ||
      error.message.toLowerCase().includes("transcript");

    return NextResponse.json(
      {
        error: isConfig
          ? "API key not configured"
          : isNoCaption
          ? "No captions found for this video"
          : "Failed to fetch video transcript",
        details: error.message,
        videoId,
        suggestions: isConfig
          ? [
              "Add RAPIDAPI_KEY to .env.local — get a free key at https://rapidapi.com",
              "Or add SUPADATA_API_KEY to .env.local — get a free key at https://supadata.ai",
            ]
          : [
              "Verify the video has captions/CC enabled",
              "Check if the video is public and accessible",
              "Try a different video with confirmed captions",
            ],
      },
      { status: isConfig ? 500 : 404 }
    );
  }
}