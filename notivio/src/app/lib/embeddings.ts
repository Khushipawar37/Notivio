/**
 * Embedding utilities using all-MiniLM-L6-v2 via @xenova/transformers (ONNX).
 * Runs server-side in Next.js API routes — no Python required.
 */

// We dynamically import to avoid issues with Next.js bundling
type EmbeddingOutput = { data: Float32Array | number[] };
type EmbeddingPipeline = (
  text: string,
  options: { pooling: "mean"; normalize: true },
) => Promise<EmbeddingOutput>;

let pipelineInstance: EmbeddingPipeline | null = null;

async function getPipeline(): Promise<EmbeddingPipeline> {
  if (pipelineInstance) return pipelineInstance;

  const { pipeline } = await import("@xenova/transformers");
  const createdPipeline = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2",
    {
      // Quantized model for faster loading (~23MB)
      quantized: true,
    },
  );
  pipelineInstance = createdPipeline as unknown as EmbeddingPipeline;
  return pipelineInstance;
}

/**
 * Embed a single text string into a 384-dimensional vector.
 */
export async function embedText(text: string): Promise<number[]> {
  const extractor = await getPipeline();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data).slice(0, 384);
}

/**
 * Embed multiple texts in sequence (batching).
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const extractor = await getPipeline();
  const results: number[][] = [];

  // Process in small batches to avoid memory issues
  const batchSize = 16;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    for (const text of batch) {
      const output = await extractor(text, {
        pooling: "mean",
        normalize: true,
      });
      results.push(Array.from(output.data).slice(0, 384));
    }
  }

  return results;
}

/**
 * Compute cosine similarity between two vectors.
 * Both vectors are assumed to be normalized (from the model), so dot product = cosine similarity.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Strip HTML tags from content and return plain text.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Chunk plain text into overlapping passages of ~maxWords words.
 * Used for indexing page content for semantic search.
 */
export function chunkTextForEmbedding(
  text: string,
  maxWords = 300,
  overlapWords = 50,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return words.length > 0 ? [words.join(" ")] : [];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length);
    const chunk = words.slice(start, end).join(" ");
    if (chunk.trim().length > 20) {
      chunks.push(chunk);
    }
    start += maxWords - overlapWords;
    if (end === words.length) break;
  }

  return chunks;
}

/**
 * Split text into sentences (simple heuristic).
 */
export function splitIntoSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace or end-of-string
  const raw = text
    .replace(/([.!?])\s+/g, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  return raw;
}
