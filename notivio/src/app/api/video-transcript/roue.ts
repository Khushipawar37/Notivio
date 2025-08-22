import { type NextRequest, NextResponse } from "next/server"

interface TranscriptItem {
  text: string
  start: number
  duration: number
}

interface VideoInfo {
  title: string
  duration: string
  transcript: TranscriptItem[]
}

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Fetch video info using YouTube oEmbed API
async function getVideoInfo(videoId: string): Promise<{ title: string; duration: string }> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const response = await fetch(oembedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        title: data.title || "Unknown Title",
        duration: "Unknown Duration",
      }
    }
  } catch (error) {
    console.log("[v0] oEmbed fetch failed:", error)
  }

  return { title: "Unknown Title", duration: "Unknown Duration" }
}

// Parse YouTube caption XML
function parseYouTubeCaptions(xmlContent: string): TranscriptItem[] {
  console.log("[v0] Parsing XML content, length:", xmlContent.length)

  const transcriptItems: TranscriptItem[] = []

  // Strategy 1: Parse <text> tags with attributes
  const textTagRegex = /<text[^>]*start="([^"]*)"[^>]*dur="([^"]*)"[^>]*>([^<]*)<\/text>/g
  let match

  while ((match = textTagRegex.exec(xmlContent)) !== null) {
    const start = Number.parseFloat(match[1]) || 0
    const duration = Number.parseFloat(match[2]) || 0
    let text = match[3] || ""

    // Decode HTML entities
    text = text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .trim()

    if (text) {
      transcriptItems.push({ text, start, duration })
    }
  }

  console.log("[v0] Strategy 1 found", transcriptItems.length, "items")

  // Strategy 2: If no items found, try different pattern
  if (transcriptItems.length === 0) {
    const altRegex = /<text[^>]*>([^<]+)<\/text>/g
    let index = 0

    while ((match = altRegex.exec(xmlContent)) !== null) {
      let text = match[1] || ""
      text = text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .trim()

      if (text) {
        transcriptItems.push({
          text,
          start: index * 5, // Estimate timing
          duration: 5,
        })
        index++
      }
    }
    console.log("[v0] Strategy 2 found", transcriptItems.length, "items")
  }

  return transcriptItems
}

// Get caption track URLs from YouTube
async function getCaptionUrls(videoId: string): Promise<string[]> {
  const urls: string[] = []

  try {
    // Try to get the video page
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    const response = await fetch(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    })

    if (!response.ok) {
      console.log("[v0] Video page fetch failed:", response.status)
      return urls
    }

    const html = await response.text()
    console.log("[v0] Video page HTML length:", html.length)

    // Extract caption URLs from the page
    const captionRegex = /"captionTracks":\s*\[(.*?)\]/
    const match = html.match(captionRegex)

    if (match) {
      try {
        const captionTracksStr = "[" + match[1] + "]"
        const captionTracks = JSON.parse(captionTracksStr)

        for (const track of captionTracks) {
          if (track.baseUrl) {
            urls.push(track.baseUrl)
            console.log("[v0] Found caption URL:", track.baseUrl.substring(0, 100) + "...")
          }
        }
      } catch (parseError) {
        console.log("[v0] Failed to parse caption tracks:", parseError)
      }
    }

    // Fallback: try to find any caption URLs in the HTML
    if (urls.length === 0) {
      const fallbackRegex = /https:\/\/www\.youtube\.com\/api\/timedtext[^"]+/g
      const fallbackMatches = html.match(fallbackRegex)

      if (fallbackMatches) {
        urls.push(...fallbackMatches)
        console.log("[v0] Found fallback caption URLs:", fallbackMatches.length)
      }
    }
  } catch (error) {
    console.log("[v0] Error getting caption URLs:", error)
  }

  return urls
}

// Fetch and parse captions from URL
async function fetchCaptions(captionUrl: string): Promise<TranscriptItem[]> {
  try {
    console.log("[v0] Fetching captions from:", captionUrl.substring(0, 100) + "...")

    const response = await fetch(captionUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      console.log("[v0] Caption fetch failed:", response.status)
      return []
    }

    const xmlContent = await response.text()
    console.log("[v0] Caption XML length:", xmlContent.length)

    return parseYouTubeCaptions(xmlContent)
  } catch (error) {
    console.log("[v0] Error fetching captions:", error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoIdParam = searchParams.get("videoId")

    if (!videoIdParam) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    const videoId = extractVideoId(videoIdParam)
    if (!videoId) {
      return NextResponse.json({ error: "Invalid video ID or URL format" }, { status: 400 })
    }

    console.log("[v0] Processing video ID:", videoId)

    // Get video info
    const videoInfo = await getVideoInfo(videoId)
    console.log("[v0] Video info:", videoInfo)

    // Get caption URLs
    const captionUrls = await getCaptionUrls(videoId)
    console.log("[v0] Found", captionUrls.length, "caption URLs")

    if (captionUrls.length === 0) {
      return NextResponse.json(
        {
          error: "No captions found for this video",
          details: "This video may not have captions enabled or may be private/restricted",
          videoId,
          suggestions: [
            "Verify the video has captions/CC enabled",
            "Check if the video is public and accessible",
            "Try a different video with confirmed captions",
          ],
        },
        { status: 404 },
      )
    }

    // Try to fetch captions from each URL
    let transcript: TranscriptItem[] = []

    for (const captionUrl of captionUrls) {
      transcript = await fetchCaptions(captionUrl)
      if (transcript.length > 0) {
        console.log("[v0] Successfully extracted", transcript.length, "transcript items")
        break
      }
    }

    if (transcript.length === 0) {
      return NextResponse.json(
        {
          error: "Failed to parse captions",
          details: "Caption files were found but could not be parsed",
          videoId,
          captionUrlsFound: captionUrls.length,
          suggestions: [
            "The video may have captions in a format we cannot parse",
            "Try a different video",
            "Some videos may only have auto-generated captions that are harder to extract",
          ],
        },
        { status: 500 },
      )
    }

    const result: VideoInfo = {
      title: videoInfo.title,
      duration: videoInfo.duration,
      transcript,
    }

    console.log("[v0] Returning successful result with", transcript.length, "items")
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] API Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
