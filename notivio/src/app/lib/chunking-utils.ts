// Creating utility functions for transcrip```ts file="lib/chunking-utils.ts"
export interface TranscriptChunk {
  id: string
  content: string
  startIndex: number
  endIndex: number
  wordCount: number
}

export interface ChunkingOptions {
  maxChunkSize: number // Maximum characters per chunk
  overlapSize: number // Characters to overlap between chunks
  preserveSentences: boolean // Try to keep sentences intact
  minChunkSize: number // Minimum characters per chunk
}

export interface ProcessingProgress {
  currentChunk: number
  totalChunks: number
  stage: "chunking" | "processing" | "combining"
  message: string
  percentage: number
}

// Default chunking options optimized for Groq API free tier
export const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
  maxChunkSize: 8000, // Conservative size for API limits
  overlapSize: 500, // Overlap to maintain context
  preserveSentences: true,
  minChunkSize: 1000, // Minimum viable chunk size
}

/**
 * Split transcript into manageable chunks for API processing
 */
export function chunkTranscript(
  transcript: string,
  options: ChunkingOptions = DEFAULT_CHUNKING_OPTIONS,
): TranscriptChunk[] {
  if (transcript.length <= options.maxChunkSize) {
    return [
      {
        id: "chunk-0",
        content: transcript,
        startIndex: 0,
        endIndex: transcript.length,
        wordCount: transcript.split(/\s+/).length,
      },
    ]
  }

  const chunks: TranscriptChunk[] = []
  let currentIndex = 0
  let chunkId = 0

  while (currentIndex < transcript.length) {
    let chunkEnd = Math.min(currentIndex + options.maxChunkSize, transcript.length)

    // If we're preserving sentences and not at the end, find a good break point
    if (options.preserveSentences && chunkEnd < transcript.length) {
      // Look for sentence endings within the last 20% of the chunk
      const searchStart = Math.max(currentIndex + options.maxChunkSize * 0.8, currentIndex + options.minChunkSize)
      const searchEnd = chunkEnd

      // Find the last sentence ending in the search area
      const sentenceEndings = /[.!?]\s+/g
      let lastSentenceEnd = -1
      let match

      while ((match = sentenceEndings.exec(transcript.slice(searchStart, searchEnd))) !== null) {
        lastSentenceEnd = searchStart + match.index + match[0].length
      }

      if (lastSentenceEnd > searchStart) {
        chunkEnd = lastSentenceEnd
      }
    }

    const chunkContent = transcript.slice(currentIndex, chunkEnd)

    chunks.push({
      id: `chunk-${chunkId}`,
      content: chunkContent,
      startIndex: currentIndex,
      endIndex: chunkEnd,
      wordCount: chunkContent.split(/\s+/).length,
    })

    // Move to next chunk with overlap
    currentIndex = Math.max(chunkEnd - options.overlapSize, chunkEnd)
    chunkId++
  }

  return chunks
}

/**
 * Estimate processing time based on transcript length and chunk count
 */
export function estimateProcessingTime(
  transcript: string,
  chunks: TranscriptChunk[],
): {
  estimatedMinutes: number
  estimatedSeconds: number
  totalChunks: number
} {
  const baseTimePerChunk = 15 // seconds per chunk (conservative estimate)
  const totalSeconds = chunks.length * baseTimePerChunk

  return {
    estimatedMinutes: Math.floor(totalSeconds / 60),
    estimatedSeconds: totalSeconds % 60,
    totalChunks: chunks.length,
  }
}

/**
 * Calculate progress percentage for chunked processing
 */
export function calculateProgress(
  currentChunk: number,
  totalChunks: number,
  stage: ProcessingProgress["stage"],
): ProcessingProgress {
  let baseProgress = 0
  let stageProgress = 0

  // Assign progress ranges to different stages
  switch (stage) {
    case "chunking":
      baseProgress = 0
      stageProgress = 10 // 0-10%
      break
    case "processing":
      baseProgress = 10
      stageProgress = 80 // 10-90%
      break
    case "combining":
      baseProgress = 90
      stageProgress = 10 // 90-100%
      break
  }

  const chunkProgress = totalChunks > 0 ? (currentChunk / totalChunks) * stageProgress : 0
  const totalProgress = Math.min(baseProgress + chunkProgress, 100)

  const messages = {
    chunking: "Preparing transcript chunks...",
    processing: `Processing chunk ${currentChunk + 1} of ${totalChunks}...`,
    combining: "Combining results into final notes...",
  }

  return {
    currentChunk,
    totalChunks,
    stage,
    message: messages[stage],
    percentage: Math.round(totalProgress),
  }
}

/**
 * Validate chunk size and content quality
 */
export function validateChunk(chunk: TranscriptChunk): {
  isValid: boolean
  issues: string[]
} {
  const issues: string[] = []

  if (chunk.content.length < 50) {
    issues.push("Chunk too short for meaningful processing")
  }

  if (chunk.content.length > 15000) {
    issues.push("Chunk too long for API processing")
  }

  if (chunk.wordCount < 10) {
    issues.push("Insufficient word count")
  }

  // Check for meaningful content (not just whitespace or repeated characters)
  const meaningfulContent = chunk.content.replace(/\s+/g, " ").trim()
  if (meaningfulContent.length < chunk.content.length * 0.5) {
    issues.push("Chunk contains too much whitespace")
  }

  return {
    isValid: issues.length === 0,
    issues,
  }
}

/**
 * Optimize chunking options based on transcript characteristics
 */
export function optimizeChunkingOptions(transcript: string): ChunkingOptions {
  const transcriptLength = transcript.length
  const wordCount = transcript.split(/\s+/).length
  const avgWordsPerSentence = wordCount / (transcript.split(/[.!?]+/).length || 1)

  const options = { ...DEFAULT_CHUNKING_OPTIONS }

  // Adjust chunk size based on transcript length
  if (transcriptLength > 100000) {
    // Very long transcript - use smaller chunks for better processing
    options.maxChunkSize = 6000
    options.overlapSize = 400
  } else if (transcriptLength > 50000) {
    // Long transcript - moderate chunk size
    options.maxChunkSize = 7000
    options.overlapSize = 450
  }

  // Adjust overlap based on sentence structure
  if (avgWordsPerSentence > 20) {
    // Long sentences - increase overlap to maintain context
    options.overlapSize = Math.min(options.overlapSize * 1.5, 800)
  }

  return options
}

/**
 * Clean and prepare transcript chunk for API processing
 */
export function prepareChunkForProcessing(chunk: TranscriptChunk): string {
  let content = chunk.content

  // Remove excessive whitespace
  content = content.replace(/\s+/g, " ").trim()

  // Ensure chunk ends with proper punctuation if it doesn't
  if (!/[.!?]$/.test(content)) {
    content += "."
  }

  // Add context markers if this is a middle chunk
  if (chunk.startIndex > 0) {
    content = "[Continued from previous section] " + content
  }

  return content
}
