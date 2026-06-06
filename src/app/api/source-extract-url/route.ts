import { NextRequest, NextResponse } from "next/server";

function normalizeUrl(raw: string) {
  const input = raw.trim();
  if (!input) return "";
  if (input.startsWith("http://") || input.startsWith("https://")) return input;
  return `https://${input}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = normalizeUrl(String(body?.url || ""));
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const jinaUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`;
    const response = await fetch(jinaUrl, {
      headers: {
        "User-Agent": "StudySpace-SourceExtractor/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Unable to fetch URL content" }, { status: 502 });
    }

    const text = await response.text();
    const titleLine =
      text
        .split("\n")
        .find((line) => line.toLowerCase().startsWith("title:")) || "";
    const title = titleLine.replace(/^title:\s*/i, "").trim() || "Web Source";

    return NextResponse.json({
      title,
      text: text.trim(),
      fetchedFrom: url,
    });
  } catch (error) {
    console.error("Source extract URL error:", error);
    return NextResponse.json({ error: "Failed to extract URL content" }, { status: 500 });
  }
}

