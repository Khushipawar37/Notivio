import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { getCurrentUserProfile } from "@/server/auth";
import { embedTexts, stripHtml, chunkTextForEmbedding } from "../../lib/embeddings";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/embeddings
 * Body: { pageId: string }
 *
 * Generates embeddings for a page's content and upserts them into the PageEmbedding table.
 * Called automatically when a page is saved.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pageId } = body as { pageId?: string };

    if (!pageId) {
      return NextResponse.json({ error: "pageId is required" }, { status: 400 });
    }

    // Load page content
    const page = await prisma.page.findFirst({
      where: { id: pageId, userId: user.id },
      select: { id: true, content: true, title: true },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Strip HTML and prepare text
    const plainText = stripHtml(page.content);

    // Skip empty or very short pages
    if (plainText.trim().length < 30) {
      // Delete any existing embeddings for this page
      await prisma.pageEmbedding.deleteMany({ where: { pageId } });
      return NextResponse.json({ ok: true, chunks: 0 });
    }

    // Prepend title for better context
    const fullText = `${page.title}. ${plainText}`;

    // Chunk the text
    const chunks = chunkTextForEmbedding(fullText);

    // Generate embeddings for all chunks
    const embeddings = await embedTexts(chunks);

    // Delete old embeddings for this page, then insert new ones
    await prisma.$transaction(async (tx) => {
      await tx.pageEmbedding.deleteMany({ where: { pageId } });

      if (chunks.length > 0) {
        await tx.pageEmbedding.createMany({
          data: chunks.map((chunkText, index) => ({
            pageId,
            userId: user.id,
            chunkIndex: index,
            chunkText,
            embedding: embeddings[index],
          })),
        });
      }
    });

    console.log(`📦 Indexed ${chunks.length} chunks for page ${pageId}`);
    return NextResponse.json({ ok: true, chunks: chunks.length });
  } catch (error: unknown) {
    console.error("Embedding indexing error:", error);
    return NextResponse.json(
      { error: "Failed to index page" },
      { status: 500 },
    );
  }
}
