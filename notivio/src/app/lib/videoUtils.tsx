/**
 * Extracts the video ID from a YouTube URL
 * @param url YouTube URL
 * @returns Video ID or null if invalid
 */
export function extractVideoId(url: string): string | null {
  if (!url) return null

  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*&v=)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Generates structured notes from a transcript
 * This is a placeholder function that will be replaced by the AI-powered API
 */
export async function generateNotesFromTranscript(transcript: string, title: string, language = "english") {
  try {
    // Call the AI-powered API to generate structured notes
    const response = await fetch("/api/generate-notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript, title, language }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to generate notes")
    }

    return await response.json()
  } catch (error) {
    console.error("Error in generateNotesFromTranscript:", error)
    throw error
  }
}
