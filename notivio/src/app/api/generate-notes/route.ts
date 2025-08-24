import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { transcript, title, duration } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 })
    }

    const [sections, summary, keyPoints] = await Promise.all([
      generateStructuredSections(transcript),
      generateSummary(transcript),
      generateKeyPoints(transcript),
    ])

    const notes = {
      title: title || "Video Notes",
      transcript,
      sections,
      summary,
      keyPoints,
      duration: duration || "Unknown",
    }

    return NextResponse.json(notes)
  } catch (error: any) {
    console.error("Error generating notes:", error)
    return NextResponse.json({ error: "Failed to generate notes" }, { status: 500 })
  }
}

async function generateStructuredSections(transcript: string) {
  try {
    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt: `Analyze this video transcript and create 4-6 structured sections with clear titles and bullet points. Each section should cover a distinct topic or theme from the video.

Format your response as a JSON array where each section has:
- title: A clear, descriptive section title (max 60 characters)
- content: An array of 3-5 key points or insights from that section

Transcript: ${transcript}

Return only the JSON array, no additional text.`,
      temperature: 0.3,
    })

    const sections = JSON.parse(text)
    return Array.isArray(sections) ? sections : []
  } catch (error) {
    console.error("Error generating sections:", error)
    // Fallback to simple processing if AI fails
    return generateFallbackSections(transcript)
  }
}

async function generateSummary(transcript: string) {
  try {
    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt: `Create a comprehensive 20-30 sentence summary of this video transcript. Focus on the main topic, key insights, and overall value provided to viewers.

Transcript: ${transcript}

Provide only the summary, no additional formatting.`,
      temperature: 0.2,
    })

    return text.trim()
  } catch (error) {
    console.error("Error generating summary:", error)
    return "This video provides valuable insights and information on the discussed topic."
  }
}

async function generateKeyPoints(transcript: string) {
  try {
    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt: `Extract 5-7 key takeaways from this video transcript. Focus on actionable insights, important concepts, and memorable points that viewers should remember.

Format as a JSON array of strings, where each string is a concise key point (max 100 characters each).

Transcript: ${transcript}

Return only the JSON array, no additional text.`,
      temperature: 0.3,
    })

    const keyPoints = JSON.parse(text)
    return Array.isArray(keyPoints) ? keyPoints : []
  } catch (error) {
    console.error("Error generating key points:", error)
    return [
      "Key insights and takeaways from the video",
      "Important concepts discussed",
      "Actionable advice provided",
      "Main learning objectives covered",
    ]
  }
}

function generateFallbackSections(transcript: string) {
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 10)
  const sectionsCount = Math.min(Math.max(Math.floor(sentences.length / 10), 3), 6)
  const sentencesPerSection = Math.floor(sentences.length / sectionsCount)

  const sections = []

  for (let i = 0; i < sectionsCount; i++) {
    const startIdx = i * sentencesPerSection
    const endIdx = i === sectionsCount - 1 ? sentences.length : (i + 1) * sentencesPerSection
    const sectionSentences = sentences.slice(startIdx, endIdx)

    const firstSentence = sectionSentences[0]?.trim() || `Section ${i + 1}`
    const title = firstSentence.length > 50 ? firstSentence.substring(0, 47) + "..." : firstSentence

    const content = sectionSentences
      .filter((s) => s.trim().length > 20)
      .slice(0, 4)
      .map((s) => s.trim())

    sections.push({
      title: title.replace(/^[^a-zA-Z]*/, "").trim() || `Section ${i + 1}`,
      content: content.length > 0 ? content : [`Content for section ${i + 1}`],
    })
  }

  return sections
}
