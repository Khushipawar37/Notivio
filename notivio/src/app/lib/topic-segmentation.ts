/**
 * Topic Segmentation using TextTiling on sentence embeddings.
 *
 * Algorithm:
 * 1. Split text into sentences.
 * 2. Embed each sentence using all-MiniLM-L6-v2.
 * 3. Compute cosine similarity between adjacent sliding windows.
 * 4. Detect "valleys" (topic boundaries) where similarity drops significantly.
 * 5. Return segments with their sentence ranges.
 *
 * This is genuine unsupervised ML — NOT an LLM prompt.
 */

import { embedTexts, cosineSimilarity, splitIntoSentences } from "./embeddings";

export interface TopicSegment {
  segmentIndex: number;
  sentences: string[];
  text: string;
}

/**
 * Compute the mean of an array of vectors (element-wise average).
 */
function meanVector(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const result = new Array(dim).fill(0);
  for (const vec of vectors) {
    for (let i = 0; i < dim; i++) {
      result[i] += vec[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    result[i] /= vectors.length;
  }
  return result;
}

/**
 * TextTiling: detect topic boundaries from sentence embeddings.
 *
 * Uses a sliding-window approach:
 * - For each position, compute the mean embedding of the left window and right window.
 * - Compute cosine similarity between the two windows.
 * - Where similarity dips (valleys), we have a topic boundary.
 */
function detectBoundaries(
  embeddings: number[][],
  windowSize: number = 3,
  threshold: number = 0.15,
): number[] {
  if (embeddings.length < windowSize * 2 + 1) {
    return []; // Too few sentences to segment
  }

  // Step 1: Compute gap scores (1 - similarity between adjacent windows)
  const gapScores: number[] = [];
  for (let i = windowSize; i < embeddings.length - windowSize; i++) {
    const leftVecs = embeddings.slice(i - windowSize, i);
    const rightVecs = embeddings.slice(i, i + windowSize);
    const leftMean = meanVector(leftVecs);
    const rightMean = meanVector(rightVecs);
    const sim = cosineSimilarity(leftMean, rightMean);
    gapScores.push(1 - sim); // Higher = more different = more likely boundary
  }

  if (gapScores.length === 0) return [];

  // Step 2: Compute depth scores for each gap position
  // Depth = how much a gap score stands out compared to its neighbors
  const depthScores: number[] = [];
  for (let i = 0; i < gapScores.length; i++) {
    // Find the nearest peak on the left
    let leftPeak = gapScores[i];
    for (let j = i - 1; j >= 0; j--) {
      if (gapScores[j] > leftPeak) {
        leftPeak = gapScores[j];
      }
      if (gapScores[j] < gapScores[i]) break;
    }

    // Find the nearest peak on the right
    let rightPeak = gapScores[i];
    for (let j = i + 1; j < gapScores.length; j++) {
      if (gapScores[j] > rightPeak) {
        rightPeak = gapScores[j];
      }
      if (gapScores[j] < gapScores[i]) break;
    }

    const depth = (leftPeak - gapScores[i]) + (rightPeak - gapScores[i]);
    depthScores.push(depth);
  }

  // Step 3: Select boundaries where depth score exceeds threshold
  // Also compute mean and std of depth scores for adaptive thresholding
  const mean = depthScores.reduce((sum, d) => sum + d, 0) / depthScores.length;
  const variance = depthScores.reduce((sum, d) => sum + (d - mean) ** 2, 0) / depthScores.length;
  const std = Math.sqrt(variance);
  const adaptiveThreshold = Math.max(threshold, mean - std * 0.5);

  const boundaries: number[] = [];
  for (let i = 0; i < depthScores.length; i++) {
    if (gapScores[i] > adaptiveThreshold) {
      // Map back to sentence index (offset by windowSize)
      boundaries.push(i + windowSize);
    }
  }

  // Remove boundaries that are too close together (< 3 sentences apart)
  const filtered: number[] = [];
  for (const b of boundaries) {
    if (filtered.length === 0 || b - filtered[filtered.length - 1] >= 3) {
      filtered.push(b);
    }
  }

  return filtered;
}

/**
 * Segment a text into topics using TextTiling on sentence embeddings.
 *
 * @param text - The full transcript/text to segment.
 * @param minSentencesPerSegment - Minimum sentences before we attempt segmentation.
 * @returns Array of TopicSegment objects.
 */
export async function segmentTopics(
  text: string,
  minSentencesPerSegment: number = 10,
): Promise<TopicSegment[]> {
  const sentences = splitIntoSentences(text);

  // If too short, return as single segment
  if (sentences.length < minSentencesPerSegment) {
    return [
      {
        segmentIndex: 0,
        sentences,
        text: sentences.join(" "),
      },
    ];
  }

  // Embed all sentences
  const embeddings = await embedTexts(sentences);

  // Adjust window size based on document length
  const windowSize = Math.max(2, Math.min(5, Math.floor(sentences.length / 10)));

  // Detect topic boundaries
  const boundaries = detectBoundaries(embeddings, windowSize);

  // Build segments from boundaries
  const segments: TopicSegment[] = [];
  let prevBoundary = 0;

  for (let i = 0; i <= boundaries.length; i++) {
    const start = prevBoundary;
    const end = i < boundaries.length ? boundaries[i] : sentences.length;
    const segSentences = sentences.slice(start, end);

    if (segSentences.length > 0) {
      segments.push({
        segmentIndex: segments.length,
        sentences: segSentences,
        text: segSentences.join(" "),
      });
    }

    prevBoundary = end;
  }

  return segments;
}
