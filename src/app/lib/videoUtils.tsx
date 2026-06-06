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
    const response = await fetch("/api/generate-notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript, title, language }),
    })

    const contentType = response.headers.get("Content-Type")

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "AI generation failed")

      return data
    } else {
      const text = await response.text()
      console.error("Non-JSON response:", text)
      throw new Error("Server did not return JSON")
    }
  } catch (error) {
    console.error("Client-side error:", error)
    throw error
  }
}

