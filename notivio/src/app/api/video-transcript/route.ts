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
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`)
    }
    throw error
  }
}

// Alternative method using direct API scraping (more reliable)
async function fetchTranscriptViaScraping(videoId: string): Promise<string> {
  console.log(`Fetching transcript via direct scraping for video: ${videoId}`)

  try {
    // Step 1: Get the video page
    const videoPageResponse = await fetchWithTimeout(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/avif,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      },
      20000
    )

    if (!videoPageResponse.ok) {
      throw new Error(`Failed to fetch video page: ${videoPageResponse.status}`)
    }

    const html = await videoPageResponse.text()
    
    // Check for common error conditions
    if (html.includes('Video unavailable') || html.includes('"status":"ERROR"')) {
      throw new Error('Video is unavailable or private')
    }

    // Step 2: Extract caption tracks from the page
    let captionTracks: any[] = []
    
    // Try to extract from ytInitialPlayerResponse
    const playerResponseMatches = [
      /ytInitialPlayerResponse\s*=\s*({.+?});/,
      /var ytInitialPlayerResponse\s*=\s*({.+?});/,
    ]

    for (const regex of playerResponseMatches) {
      const match = html.match(regex)
      if (match) {
        try {
          const playerData = JSON.parse(match[1])
          const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks
          if (tracks && Array.isArray(tracks) && tracks.length > 0) {
            captionTracks = tracks
            console.log(`Found ${captionTracks.length} caption tracks`)
            break
          }
        } catch (e) {
          console.warn('Failed to parse player response')
        }
      }
    }

    if (captionTracks.length === 0) {
      throw new Error('No caption tracks found - video may not have captions enabled')
    }

    // Step 3: Select the best caption track
    let selectedTrack = null

    // Priority: English manual > English auto > Any manual > Any auto
    const priorities = [
      (t: any) => t.languageCode?.startsWith('en') && !t.kind,
      (t: any) => t.languageCode?.startsWith('en') && t.kind === 'asr', 
      (t: any) => !t.kind,
      (t: any) => t.kind === 'asr',
      (t: any) => true
    ]

    for (const priorityFn of priorities) {
      selectedTrack = captionTracks.find(priorityFn)
      if (selectedTrack) break
    }

    if (!selectedTrack?.baseUrl) {
      throw new Error('No suitable caption track found')
    }

    console.log(`Selected caption: ${selectedTrack.languageCode} (${selectedTrack.kind || 'manual'})`)

    // Step 4: Fetch the caption file
    let captionUrl = selectedTrack.baseUrl
    // Add format parameter for better parsing
    if (!captionUrl.includes('fmt=')) {
      captionUrl += captionUrl.includes('?') ? '&fmt=srv3' : '?fmt=srv3'
    }

    const captionResponse = await fetchWithTimeout(captionUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    }, 15000)

    if (!captionResponse.ok) {
      throw new Error(`Failed to fetch captions: ${captionResponse.status}`)
    }

    const captionData = await captionResponse.text()
    console.log(`Caption data length: ${captionData.length}`)

    if (!captionData || captionData.length < 100) {
      throw new Error('Caption data is empty or too short')
    }

    // Step 5: Parse the caption data
    const transcript = parseXMLCaptions(captionData)
    
    if (!transcript || transcript.length < 50) {
      throw new Error('Failed to parse meaningful content from captions')
    }

    console.log(`✓ Successfully extracted transcript: ${transcript.length} chars`)
    return transcript

  } catch (error: any) {
    console.error('Scraping method error:', error.message)
    throw error
  }
}

function parseXMLCaptions(xmlData: string): string {
  const segments: string[] = []
  
  try {
    // Method 1: Try JSON format first (srv3 format)
    if (xmlData.includes('"text"') && xmlData.includes('"start"')) {
      console.log('Parsing as JSON format (srv3)')
      
      // Extract JSON objects containing text
      const jsonMatches = xmlData.matchAll(/"text"\s*:\s*"([^"]+)"/g)
      for (const match of jsonMatches) {
        const text = decodeEntities(match[1])
        if (text && text.length > 1) {
          segments.push(text)
        }
      }
    }
    
    // Method 2: Try XML format
    if (segments.length === 0) {
      console.log('Parsing as XML format')
      
      // Try different XML tag patterns
      const tagPatterns = [
        /<text[^>]*?>(.*?)<\/text>/gi,
        /<p[^>]*?>(.*?)<\/p>/gi,
        /<s[^>]*?>(.*?)<\/s>/gi,
      ]
      
      for (const pattern of tagPatterns) {
        const matches = xmlData.matchAll(pattern)
        for (const match of matches) {
          const text = decodeEntities(match[1])
          if (text && text.length > 1) {
            segments.push(text)
          }
        }
        if (segments.length > 0) break
      }
    }
    
    // Method 3: Extract from any tag content
    if (segments.length === 0) {
      console.log('Trying generic text extraction')
      const textMatches = xmlData.matchAll(/>([^<]+)</g)
      for (const match of textMatches) {
        const text = decodeEntities(match[1])
        if (text && text.length > 3 && !text.match(/^[\d\s\-:.,]+$/)) {
          segments.push(text)
        }
      }
    }

  } catch (error: any) {
    console.error('XML parsing error:', error.message)
    throw new Error('Failed to parse caption XML')
  }

  if (segments.length === 0) {
    throw new Error('No text segments found in caption data')
  }

  const transcript = segments.join(' ').replace(/\s+/g, ' ').trim()
  console.log(`Parsed ${segments.length} segments into ${transcript.length} character transcript`)
  
  return transcript
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([a-fA-F0-9]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function getVideoMetadata(videoId: string) {
  console.log(`Getting metadata for video: ${videoId}`)
  
  // Try oEmbed API first
  try {
    const oembedResponse = await fetchWithTimeout(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { headers: { Accept: 'application/json' } },
      8000
    )

    if (oembedResponse.ok) {
      const data = await oembedResponse.json()
      if (data?.title) {
        console.log(`Got title from oEmbed: ${data.title}`)
        return {
          title: data.title,
          duration: 'Unknown'
        }
      }
    }
  } catch (e) {
    console.warn('oEmbed failed, trying fallback')
  }

  // Fallback to basic info
  return {
    title: `YouTube Video ${videoId}`,
    duration: 'Unknown'
  }
}

export async function GET(request: NextRequest) {
  console.log('=== Video Transcript API Called ===')

  try {
    const { searchParams } = new URL(request.url)
    const videoParam = searchParams.get('videoId') || searchParams.get('url')

    console.log(`Received parameter: ${videoParam}`)

    if (!videoParam) {
      return NextResponse.json({
        error: 'Video ID or URL is required',
        example: '?videoId=dQw4w9WgXcQ'
      }, { status: 400 })
    }

    const videoId = extractVideoId(videoParam)
    console.log(`Extracted video ID: ${videoId}`)

    if (!videoId) {
      return NextResponse.json({
        error: 'Invalid YouTube video ID or URL',
        received: videoParam,
      }, { status: 400 })
    }

    // Use the direct scraping method
    console.log('=== Using Direct Scraping Method ===')
    const transcript = await fetchTranscriptViaScraping(videoId)

    if (!transcript || transcript.length < 50) {
      throw new Error('Retrieved transcript is too short or empty')
    }

    // Clean the transcript
    const cleanTranscript = transcript
      .replace(/\[.*?\]/g, '') // Remove [Music], [Applause], etc.
      .replace(/\s+/g, ' ')
      .trim()

    console.log(`Final transcript length: ${cleanTranscript.length} characters`)

    // Get video metadata
    const videoInfo = await getVideoMetadata(videoId)

    const result = {
      transcript: cleanTranscript,
      title: videoInfo.title,
      duration: videoInfo.duration,
      videoId: videoId,
      wordCount: cleanTranscript.split(' ').filter(w => w.length > 0).length,
      methodUsed: 'direct scraping',
      success: true,
    }

    console.log('✓ Successfully returning transcript')
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('=== API Error ===')
    console.error('Error:', error.message)

    let errorMessage = 'Failed to fetch video transcript'
    let suggestions = [
      'Verify the video has captions/CC enabled',
      'Check if the video is public and accessible',
      'Try a different video with confirmed captions'
    ]

    if (error.message.includes('unavailable') || error.message.includes('private')) {
      errorMessage = 'Video is unavailable, private, or restricted'
      suggestions = [
        'Make sure the video is public',
        'Check the video URL is correct',
        'Try a different public video'
      ]
    } else if (error.message.includes('caption')) {
      errorMessage = 'No captions found for this video'
      suggestions = [
        'Try a video with captions enabled (look for CC button)',
        'Educational videos often have better caption support',
        'Some videos only have auto-generated captions'
      ]
    }

    return NextResponse.json({
      error: errorMessage,
      details: error.message,
      videoId: extractVideoId(request.nextUrl.searchParams.get('videoId') || ''),
      suggestions: suggestions,
    }, { status: 404 })
  }
}