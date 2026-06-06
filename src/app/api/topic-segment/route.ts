import { NextResponse } from "next/server";
import { segmentTopics } from "../../lib/topic-segmentation";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Allow up to 2 min for long transcripts

/**
 * POST /api/topic-segment
 * Body: { text: string }
 * Returns: { chapters: { title: string, content: string }[] }
 *
 * Uses TextTiling (unsupervised ML on sentence embeddings) for segmentation,
 * then Groq LLM for chapter title generation only.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body as { text?: string };

    if (!text || typeof text !== "string" || text.trim().length < 100) {
      return NextResponse.json(
        { error: "Text must be at least 100 characters long." },
        { status: 400 },
      );
    }

    // Step 1: Run TextTiling segmentation (real ML)
    console.log("🔬 Starting topic segmentation via TextTiling...");
    const segments = await segmentTopics(text);
    console.log(`📊 Found ${segments.length} topic segments`);

    if (segments.length <= 1) {
      return NextResponse.json({
        chapters: [
          {
            title: "Full Content",
            content: text,
          },
        ],
        message: "Content is too short or uniform for topic segmentation.",
      });
    }

    // Step 2: Generate chapter titles via Groq LLM (short prompt for each)
    const groqApiKey = process.env.GROQ_API_KEY;
    let chapters: { title: string; content: string }[];

    if (groqApiKey) {
      const groq = new Groq({ apiKey: groqApiKey });
      chapters = await generateChapterTitles(groq, segments);
    } else {
      // Fallback: use simple heuristic titles
      chapters = segments.map((seg, i) => ({
        title: `Chapter ${i + 1}: ${extractFirstPhrase(seg.text)}`,
        content: seg.text,
      }));
    }

    return NextResponse.json({ chapters });
  } catch (error: unknown) {
    console.error("Topic segmentation error:", error);
    return NextResponse.json(
      { error: "Failed to segment topics. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * Generate descriptive chapter titles using Groq LLM.
 */
async function generateChapterTitles(
  groq: InstanceType<typeof Groq>,
  segments: { text: string; segmentIndex: number }[],
): Promise<{ title: string; content: string }[]> {
  const results: { title: string; content: string }[] = [];

  // Process segments in parallel (up to 4 at a time to respect rate limits)
  const batchSize = 4;
  for (let i = 0; i < segments.length; i += batchSize) {
    const batch = segments.slice(i, i + batchSize);
    const promises = batch.map(async (seg) => {
      try {
        const preview = seg.text.slice(0, 800);
        const completion = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "Generate a short, descriptive chapter title (5-10 words) for this lecture segment. Return ONLY the title text, nothing else.",
            },
            {
              role: "user",
              content: preview,
            },
          ],
          temperature: 0.3,
          max_tokens: 30,
        });
        const title =
          completion.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, "") ||
          `Chapter ${seg.segmentIndex + 1}`;
        return { title, content: seg.text };
      } catch {
        return {
          title: `Chapter ${seg.segmentIndex + 1}: ${extractFirstPhrase(seg.text)}`,
          content: seg.text,
        };
      }
    });

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    // Rate limit pause between batches
    if (i + batchSize < segments.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Extract a short phrase from the beginning of text for fallback titles.
 */
function extractFirstPhrase(text: string): string {
  const words = text.split(/\s+/).slice(0, 6).join(" ");
  return words.length > 50 ? words.slice(0, 47) + "..." : words + "...";
}
