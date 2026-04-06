import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { getCurrentUserProfile } from "@/server/auth";
import { embedText, cosineSimilarity } from "../../lib/embeddings";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface SearchResult {
  pageId: string;
  pageTitle: string;
  notebookTitle: string;
  sectionTitle: string;
  notebookId: string;
  sectionId: string;
  snippet: string;
  score: number;
}

/**
 * POST /api/semantic-search
 * Body: { query: string }
 * Returns: { results: SearchResult[] }
 *
 * Embeds the query, computes cosine similarity against all user's page embeddings,
 * and returns the top-10 most relevant pages.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { query } = body as { query?: string };

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Embed the query
    const queryEmbedding = await embedText(query.trim());

    // Load all embeddings for the user
    const allEmbeddings = await prisma.pageEmbedding.findMany({
      where: { userId: user.id },
      select: {
        pageId: true,
        chunkText: true,
        embedding: true,
        page: {
          select: {
            title: true,
            notebookId: true,
            sectionId: true,
            notebook: { select: { title: true } },
            section: { select: { title: true } },
          },
        },
      },
    });

    if (allEmbeddings.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Compute similarity for each chunk
    const scored = allEmbeddings.map((emb) => ({
      pageId: emb.pageId,
      pageTitle: emb.page.title,
      notebookTitle: emb.page.notebook.title,
      sectionTitle: emb.page.section.title,
      notebookId: emb.page.notebookId,
      sectionId: emb.page.sectionId,
      snippet: emb.chunkText.slice(0, 200),
      score: cosineSimilarity(queryEmbedding, emb.embedding),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // De-duplicate by page (keep highest score per page)
    const seenPages = new Set<string>();
    const deduplicated: SearchResult[] = [];
    for (const result of scored) {
      if (!seenPages.has(result.pageId)) {
        seenPages.add(result.pageId);
        deduplicated.push(result);
      }
      if (deduplicated.length >= 10) break;
    }

    // Filter out very low scores
    const results = deduplicated.filter((r) => r.score > 0.15);

    return NextResponse.json({ results });
  } catch (error: unknown) {
    console.error("Semantic search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 },
    );
  }
}
