import { NextResponse } from "next/server"
import { YoutubeTranscript } from "youtube-transcript"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get("videoId")

  if (!videoId) {
    return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
  }

  try {
    // Fetch video metadata
    const videoInfoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`,
    )

    if (!videoInfoResponse.ok) {
      throw new Error("Failed to fetch video information")
    }

    const videoInfo = await videoInfoResponse.json()
    const title = videoInfo.items[0]?.snippet?.title || "Untitled Video"

    // Fetch transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)

    // Format transcript into a single string
    const formattedTranscript = transcript
      .map((item) => item.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()

    return NextResponse.json({
      title,
      transcript: formattedTranscript,
    })
  } catch (error: any) {
    console.error("Error fetching transcript:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch transcript" }, { status: 500 })
  }
}
