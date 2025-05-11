import { type NextRequest, NextResponse } from "next/server"
import { YoutubeTranscript } from "youtube-transcript"

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId")

  if (!videoId) {
    return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
  }

  try {
    // Get video metadata
    const videoInfoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY || "AIzaSyARJ0FnnBPeLo950We6CZF_hMVCRL_sg_E"}`,
    )

    if (!videoInfoResponse.ok) {
      throw new Error("Failed to fetch video information")
    }

    const videoInfo = await videoInfoResponse.json()

    if (!videoInfo.items || videoInfo.items.length === 0) {
      throw new Error("Video not found")
    }

    const videoTitle = videoInfo.items[0].snippet.title

    // Get video transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)

    if (!transcript || transcript.length === 0) {
      throw new Error("No transcript available for this video")
    }

    // Format transcript
    const formattedTranscript = transcript
      .map((item) => item.text)
      .join(" ")
      .replace(/\s+/g, " ")

    return NextResponse.json({
      title: videoTitle,
      transcript: formattedTranscript,
    })
  } catch (error: any) {
    console.error("Error fetching transcript:", error)

    return NextResponse.json({ error: error.message || "Failed to fetch transcript" }, { status: 500 })
  }
}