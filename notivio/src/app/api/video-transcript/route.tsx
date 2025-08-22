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

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function fetchTranscriptWithPackage(videoId: string): Promise<string> {
  console.log(`Attempting to fetch transcript using youtube-transcript package for video: ${videoId}`)

  try {
    // Dynamic import with proper error handling
    let YoutubeTranscript: any
    try {
      const module = await import("youtube-transcript")
      YoutubeTranscript = module.YoutubeTranscript
    } catch (importError: any) {
      console.error("Failed to import youtube-transcript package:", importError.message)
      throw new Error(
        "youtube-transcript package not available. Please install it with: npm install youtube-transcript",
      )
    }

    if (!YoutubeTranscript || typeof YoutubeTranscript.fetchTranscript !== "function") {
      throw new Error("youtube-transcript package is not properly installed or configured")
    }

    const items = (await Promise.race([
      YoutubeTranscript.fetchTranscript(videoId, {
        lang: "en",
        country: "US",
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Transcript fetch timeout")), 30000)),
    ])) as any[]

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("No transcript items returned from package")
    }

    const transcript = items
      .map((item: any) => {
        if (typeof item === "object" && item.text) {
          return item.text.trim()
        }
        return String(item || "").trim()
      })
      .filter((text) => text.length > 0)
      .join(" ")

    if (transcript.length < 10) {
      throw new Error("Transcript too short, likely invalid")
    }

    console.log(`✓ Successfully fetched transcript via package: ${transcript.length} characters`)
    return transcript
  } catch (error: any) {
    console.error("youtube-transcript package error:", error.message)

    if (error.message?.includes("Video unavailable")) {
      throw new Error("Video is unavailable or private")
    } else if (error.message?.includes("Transcript disabled")) {
      throw new Error("Transcripts are disabled for this video")
    } else if (error.message?.includes("No transcript found")) {
      throw new Error("No transcript available for this video")
    } else if (error.message?.includes("timeout")) {
      throw new Error("Request timed out - video may be too long or server is slow")
    }

    throw error
  }
}

async function scrapeTranscriptFromPage(videoId: string): Promise<string> {
  console.log(`Attempting to scrape transcript from YouTube page for video: ${videoId}`)

  try {
    const response = await fetchWithTimeout(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Upgrade-Insecure-Requests": "1",
        },
      },
      30000,
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube page: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    console.log(`Fetched HTML page, length: ${html.length}`)

    let captionTracks: any[] = []

    // Try to find ytInitialPlayerResponse first
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/)
    if (playerResponseMatch) {
      try {
        const playerData = JSON.parse(playerResponseMatch[1])

        // Navigate through the player response structure
        const captions = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks
        if (captions && Array.isArray(captions)) {
          captionTracks = captions
          console.log(`Found ${captionTracks.length} caption tracks in player response`)
        }
      } catch (parseErr: any) {
        console.warn("Failed to parse ytInitialPlayerResponse:", parseErr.message)
      }
    }

    // Fallback to regex patterns if player response didn't work
    if (captionTracks.length === 0) {
      const captionPatterns = [/"captionTracks":\s*(\[.*?\])/, /captionTracks":\s*(\[.*?\])/]

      for (const pattern of captionPatterns) {
        const match = html.match(pattern)
        if (match) {
          try {
            captionTracks = JSON.parse(match[1])
            console.log(`Found ${captionTracks.length} caption tracks via regex`)
            break
          } catch (parseErr: any) {
            console.warn("Failed to parse caption tracks:", parseErr.message)
          }
        }
      }
    }

    if (captionTracks.length === 0) {
      throw new Error("No caption tracks found in page source")
    }

    let selectedTrack = null as any

    // Priority order: manual English > auto English > manual any language > auto any language
    const trackPriorities = [
      (track: any) => track.languageCode === "en" && track.kind !== "asr",
      (track: any) => track.languageCode === "en" && track.kind === "asr",
      (track: any) => track.kind !== "asr",
      (track: any) => true,
    ]

    for (const priorityFn of trackPriorities) {
      selectedTrack = captionTracks.find(priorityFn)
      if (selectedTrack) break
    }

    if (!selectedTrack) {
      throw new Error("No suitable caption track found")
    }

    console.log(`Selected caption track: ${selectedTrack.languageCode} (${selectedTrack.kind || "manual"})`)

    const captionUrl = selectedTrack.baseUrl
    const captionResponse = await fetchWithTimeout(
      captionUrl,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
      15000,
    )

    if (!captionResponse.ok) {
      throw new Error(`Failed to fetch caption file: ${captionResponse.status}`)
    }

    const captionXml = await captionResponse.text()
    console.log(`Fetched caption XML, length: ${captionXml.length}`)

    console.log(`[v0] Caption XML preview (first 500 chars):`, captionXml.substring(0, 500))

    const textSegments: string[] = []

    // Strategy 1: Standard <text> tags with improved regex
    console.log(`[v0] Trying Strategy 1: Standard <text> tags`)
    const textRegex = /<text[^>]*?(?:\s+start="[^"]*")?[^>]*?>(.*?)<\/text>/gi
    let match: RegExpExecArray | null

    while ((match = textRegex.exec(captionXml)) !== null) {
      const text = match[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/<[^>]*>/g, "") // Remove any HTML tags
        .replace(/\s+/g, " ")
        .trim()

      if (text && text.length > 0) {
        textSegments.push(text)
      }
    }

    console.log(`[v0] Strategy 1 found ${textSegments.length} segments`)

    // Strategy 2: Try <p> tags if no <text> tags found
    if (textSegments.length === 0) {
      console.log(`[v0] Trying Strategy 2: <p> tags`)
      const pRegex = /<p[^>]*?(?:\s+t="[^"]*")?[^>]*?>(.*?)<\/p>/gi

      while ((match = pRegex.exec(captionXml)) !== null) {
        const text = match[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim()

        if (text && text.length > 0) {
          textSegments.push(text)
        }
      }
      console.log(`[v0] Strategy 2 found ${textSegments.length} segments`)
    }

    // Strategy 3: Try alternative XML structures
    if (textSegments.length === 0) {
      console.log(`[v0] Trying Strategy 3: Alternative XML structures`)
      const altRegex = /<(?:s|span|div)[^>]*?>(.*?)<\/(?:s|span|div)>/gi

      while ((match = altRegex.exec(captionXml)) !== null) {
        const text = match[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/\s+/g, " ")
          .trim()

        if (text && text.length > 0 && text.length > 2) {
          // Filter out very short segments
          textSegments.push(text)
        }
      }
      console.log(`[v0] Strategy 3 found ${textSegments.length} segments`)
    }

    // Strategy 4: Extract all text content between any tags
    if (textSegments.length === 0) {
      console.log(`[v0] Trying Strategy 4: Extract all text content`)

      // Remove XML declaration and root tags first
      const cleanXml = captionXml
        .replace(/<\?xml[^>]*\?>/gi, "")
        .replace(/<transcript[^>]*>/gi, "")
        .replace(/<\/transcript>/gi, "")
        .replace(/<timedtext[^>]*>/gi, "")
        .replace(/<\/timedtext>/gi, "")

      // Extract text from any remaining tags
      const allTextRegex = />([^<]+)</g

      while ((match = allTextRegex.exec(cleanXml)) !== null) {
        const text = match[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/\s+/g, " ")
          .trim()

        if (text && text.length > 3 && !text.match(/^[\d\s\-:.,]+$/)) {
          // Filter out timestamps and short segments
          textSegments.push(text)
        }
      }
      console.log(`[v0] Strategy 4 found ${textSegments.length} segments`)
    }

    if (textSegments.length === 0) {
      console.error(`[v0] All parsing strategies failed. XML structure analysis:`)
      console.error(`[v0] XML length: ${captionXml.length}`)
      console.error(`[v0] Contains <text>: ${captionXml.includes("<text")}`)
      console.error(`[v0] Contains <p>: ${captionXml.includes("<p")}`)
      console.error(`[v0] Contains other tags: ${captionXml.match(/<(\w+)[^>]*>/g)?.slice(0, 10)}`)

      throw new Error(
        `No text segments found in caption file after trying 4 different parsing strategies. XML may be in an unsupported format.`,
      )
    }

    const transcript = textSegments.join(" ")
    console.log(
      `[v0] Successfully extracted transcript with ${textSegments.length} segments, ${transcript.length} characters`,
    )
    console.log(`[v0] Transcript preview: ${transcript.substring(0, 200)}...`)

    return transcript
  } catch (error: any) {
    console.error("Error scraping transcript:", error)
    throw error
  }
}

async function getVideoMetadata(videoId: string) {
  // Try oEmbed first (more reliable and doesn't require API key)
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const response = await fetchWithTimeout(
      oembedUrl,
      {
        headers: { Accept: "application/json" },
      },
      10000,
    )

    if (response.ok) {
      const data = await response.json()
      if (data && data.title) {
        console.log("Got title from oEmbed:", data.title)
        return {
          title: data.title,
          duration: "Unknown", // oEmbed doesn't provide duration
        }
      }
    }
  } catch (oembedError: any) {
    console.warn("oEmbed failed:", oembedError.message)
  }

  // Fallback to YouTube Data API if available
  if (process.env.YOUTUBE_API_KEY) {
    try {
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${process.env.YOUTUBE_API_KEY}&part=snippet,contentDetails`
      const response = await fetchWithTimeout(apiUrl, {}, 10000)

      if (response.ok) {
        const data = await response.json()
        if (data.items && data.items.length > 0) {
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
        }
      }
    } catch (apiError: any) {
      console.warn("YouTube API failed:", apiError.message)
    }
  }

  // Final fallback
  return {
    title: `YouTube Video ${videoId}`,
    duration: "Unknown",
  }
}

export async function GET(request: NextRequest) {
  console.log("=== Video Transcript API Called ===")

  try {
    const { searchParams } = new URL(request.url)
    const videoParam = searchParams.get("videoId") || searchParams.get("url")

    console.log("Received parameter:", videoParam)

    if (!videoParam) {
      return NextResponse.json(
        {
          error: "Video ID or URL is required",
          example: "?videoId=dQw4w9WgXcQ or ?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
        { status: 400 },
      )
    }

    const videoId = extractVideoId(videoParam)
    console.log("Extracted video ID:", videoId)

    if (!videoId) {
      return NextResponse.json(
        {
          error: "Invalid YouTube video ID or URL",
          received: videoParam,
          expected: "11-character video ID or valid YouTube URL",
        },
        { status: 400 },
      )
    }

    let transcript = ""
    let methodUsed = ""
    const errors: string[] = []

    console.log("=== Method 1: youtube-transcript package ===")
    try {
      transcript = await fetchTranscriptWithPackage(videoId)
      methodUsed = "youtube-transcript package"
    } catch (pkgErr: any) {
      console.warn("✗ Package method failed:", pkgErr.message)
      errors.push(`Package: ${pkgErr.message}`)
    }

    if (!transcript || transcript.trim().length === 0) {
      console.log("=== Method 2: Caption scraping ===")
      try {
        transcript = await scrapeTranscriptFromPage(videoId)
        methodUsed = "caption scraping"
      } catch (scrapeErr: any) {
        console.warn("✗ Scraping method failed:", scrapeErr.message)
        errors.push(`Scraping: ${scrapeErr.message}`)
      }
    }

    if (!transcript || transcript.trim().length === 0) {
      console.log("=== All methods failed ===")

      return NextResponse.json(
        {
          error: "No transcript found for this video",
          details: "All extraction methods failed",
          videoId: videoId,
          attempts: errors,
          suggestions: [
            "Verify the video has captions/CC enabled",
            "Check if the video is public and accessible",
            "Try a different video with confirmed captions",
            "Some videos may only have captions in non-English languages",
          ],
        },
        { status: 404 },
      )
    }

    const cleanTranscript = transcript
      .replace(/\[.*?\]/g, "") // Remove [Music], [Applause], etc.
      .replace(/\s+/g, " ")
      .trim()

    if (cleanTranscript.length < 50) {
      return NextResponse.json(
        {
          error: "Transcript too short or invalid",
          length: cleanTranscript.length,
          videoId: videoId,
        },
        { status: 422 },
      )
    }

    console.log(`Final transcript length: ${cleanTranscript.length} characters`)
    console.log(`Method used: ${methodUsed}`)

    // Get video metadata
    const videoInfo = await getVideoMetadata(videoId)

    const result = {
      transcript: cleanTranscript,
      title: videoInfo.title,
      duration: videoInfo.duration,
      videoId: videoId,
      wordCount: cleanTranscript.split(" ").length,
      methodUsed: methodUsed,
      success: true,
    }

    console.log("Successfully returning transcript data")
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("=== Unexpected API Error ===")
    console.error("Error:", error.message)
    console.error("Stack:", error.stack)

    return NextResponse.json(
      {
        error: "Internal server error while fetching transcript",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
