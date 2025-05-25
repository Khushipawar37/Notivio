import { type NextRequest, NextResponse } from "next/server"
import { YoutubeTranscript } from "youtube-transcript"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get("videoId")

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    // Fetch transcript using youtube-transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: "No transcript available for this video" }, { status: 404 })
    }

    // Combine transcript text
    const transcriptText = transcript
      .map((item) => item.text)
      .join(" ")
      .replace(/\[.*?\]/g, "") // Remove timestamp markers
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()

    // Get video metadata using YouTube Data API (optional)
    let title = "YouTube Video"
    let duration = "Unknown"

    if (process.env.YOUTUBE_API_KEY) {
      try {
        const metadataResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${process.env.YOUTUBE_API_KEY}&part=snippet,contentDetails`,
        )

        if (metadataResponse.ok) {
          const metadataData = await metadataResponse.json()
          if (metadataData.items && metadataData.items.length > 0) {
            const video = metadataData.items[0]
            title = video.snippet.title

            // Parse duration from ISO 8601 format (PT4M13S -> 4:13)
            const durationMatch = video.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
            if (durationMatch) {
              const hours = Number.parseInt(durationMatch[1] || "0")
              const minutes = Number.parseInt(durationMatch[2] || "0")
              const seconds = Number.parseInt(durationMatch[3] || "0")

              if (hours > 0) {
                duration = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
              } else {
                duration = `${minutes}:${seconds.toString().padStart(2, "0")}`
              }
            }
          }
        }
      } catch (error) {
        console.warn("Failed to fetch video metadata:", error)
      }
    }

    return NextResponse.json({
      transcript: transcriptText,
      title,
      duration,
      videoId,
    })
  } catch (error: any) {
    console.error("Error fetching transcript:", error)

    if (error.message?.includes("Transcript is disabled")) {
      return NextResponse.json({ error: "Transcript is not available for this video" }, { status: 404 })
    }

    return NextResponse.json({ error: "Failed to fetch video transcript" }, { status: 500 })
  }
}
