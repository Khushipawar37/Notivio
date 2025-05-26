import { type NextRequest, NextResponse } from "next/server"

// Helper function to extract video ID
function extractVideoId(input: string): string | null {
  if (!input) return null

  // If it's already a video ID (11 characters, alphanumeric + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input
  }

  // Extract from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    /(?:youtube\.com\/v\/)([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

// Function to scrape transcript from YouTube page
async function scrapeTranscriptFromPage(videoId: string): Promise<string> {
  console.log(`Attempting to scrape transcript from YouTube page for video: ${videoId}`)

  try {
    // Fetch the YouTube watch page
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube page: ${response.status}`)
    }

    const html = await response.text()
    console.log(`Fetched HTML page, length: ${html.length}`)

    // Look for caption tracks in the page source
    const captionRegex = /"captionTracks":\s*(\[.*?\])/
    const captionMatch = html.match(captionRegex)

    if (!captionMatch) {
      throw new Error("No caption tracks found in page source")
    }

    const captionTracks = JSON.parse(captionMatch[1])
    console.log(`Found ${captionTracks.length} caption tracks`)

    // Find English captions (prefer manual over auto-generated)
    let selectedTrack = null

    // First, try to find manual English captions
    for (const track of captionTracks) {
      if (track.languageCode === "en" && track.kind !== "asr") {
        selectedTrack = track
        break
      }
    }

    // If no manual captions, try auto-generated English
    if (!selectedTrack) {
      for (const track of captionTracks) {
        if (track.languageCode === "en" && track.kind === "asr") {
          selectedTrack = track
          break
        }
      }
    }

    // If still no English, try any available language
    if (!selectedTrack && captionTracks.length > 0) {
      selectedTrack = captionTracks[0]
    }

    if (!selectedTrack) {
      throw new Error("No suitable caption track found")
    }

    console.log(`Selected caption track: ${selectedTrack.languageCode} (${selectedTrack.kind || "manual"})`)

    // Fetch the caption file
    const captionUrl = selectedTrack.baseUrl
    const captionResponse = await fetch(captionUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    })

    if (!captionResponse.ok) {
      throw new Error(`Failed to fetch caption file: ${captionResponse.status}`)
    }

    const captionXml = await captionResponse.text()
    console.log(`Fetched caption XML, length: ${captionXml.length}`)

    // Parse XML and extract text
    const textRegex = /<text[^>]*>(.*?)<\/text>/g
    const textSegments = []
    let match

    while ((match = textRegex.exec(captionXml)) !== null) {
      const text = match[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/<[^>]*>/g, "") // Remove any remaining HTML tags
        .trim()

      if (text) {
        textSegments.push(text)
      }
    }

    if (textSegments.length === 0) {
      throw new Error("No text segments found in caption file")
    }

    const transcript = textSegments.join(" ")
    console.log(`Successfully extracted transcript with ${textSegments.length} segments`)

    return transcript
  } catch (error) {
    console.error("Error scraping transcript:", error)
    throw error
  }
}

// Get video metadata using YouTube Data API
async function getVideoMetadata(videoId: string) {
  if (!process.env.YOUTUBE_API_KEY) {
    console.log("No YouTube API key provided, using default metadata")
    return {
      title: `YouTube Video`,
      duration: "Unknown",
    }
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${process.env.YOUTUBE_API_KEY}&part=snippet,contentDetails`
    console.log("Fetching video metadata from YouTube API")

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`YouTube API responded with status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      throw new Error("Video not found in YouTube API response")
    }

    const video = data.items[0]
    const title = video.snippet?.title || "Unknown Title"

    // Parse duration
    let duration = "Unknown"
    if (video.contentDetails?.duration) {
      const match = video.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
      if (match) {
        const hours = Number.parseInt(match[1] || "0")
        const minutes = Number.parseInt(match[2] || "0")
        const seconds = Number.parseInt(match[3] || "0")

        if (hours > 0) {
          duration = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        } else {
          duration = `${minutes}:${seconds.toString().padStart(2, "0")}`
        }
      }
    }

    return { title, duration }
  } catch (error) {
    console.error("Error fetching video metadata:", error)
    return {
      title: "YouTube Video",
      duration: "Unknown",
    }
  }
}

export async function GET(request: NextRequest) {
  console.log("=== Video Transcript API Called ===")

  try {
    const { searchParams } = new URL(request.url)
    const videoParam = searchParams.get("videoId") || searchParams.get("url")

    console.log("Received parameter:", videoParam)

    if (!videoParam) {
      console.log("No video parameter provided")
      return NextResponse.json({ error: "Video ID or URL is required" }, { status: 400 })
    }

    const videoId = extractVideoId(videoParam)
    console.log("Extracted video ID:", videoId)

    if (!videoId) {
      console.log("Invalid video ID or URL")
      return NextResponse.json({ error: "Invalid YouTube video ID or URL" }, { status: 400 })
    }

    // Get transcript using page scraping method
    console.log("Starting transcript extraction...")
    const transcript = await scrapeTranscriptFromPage(videoId)

    if (!transcript || transcript.trim().length === 0) {
      console.log("Empty transcript received")
      return NextResponse.json(
        { error: "No transcript content found for this video. The video may not have captions enabled." },
        { status: 404 },
      )
    }

    // Clean up transcript
    const cleanTranscript = transcript
      .replace(/\[.*?\]/g, "") // Remove [Music], [Applause], etc.
      .replace(/\s+/g, " ")
      .trim()

    console.log(`Transcript length: ${cleanTranscript.length} characters`)

    // Get video metadata
    console.log("Fetching video metadata...")
    const videoInfo = await getVideoMetadata(videoId)

    const result = {
      transcript: cleanTranscript,
      title: videoInfo.title,
      duration: videoInfo.duration,
      videoId: videoId,
      wordCount: cleanTranscript.split(" ").length,
    }

    console.log("Successfully returning transcript data")
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("=== API Error ===")
    console.error("Error type:", error.constructor.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)

    // Provide more specific error messages
    let errorMessage = "Failed to fetch video transcript."
    let statusCode = 500

    if (error.message?.includes("No caption tracks found")) {
      errorMessage = "This video does not have captions available."
      statusCode = 404
    } else if (error.message?.includes("Failed to fetch YouTube page")) {
      errorMessage = "Unable to access the YouTube video. It may be private or restricted."
      statusCode = 403
    } else if (error.message?.includes("No suitable caption track found")) {
      errorMessage = "No captions found for this video in any supported language."
      statusCode = 404
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message,
      },
      { status: statusCode },
    )
  }
}
