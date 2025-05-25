import { type NextRequest, NextResponse } from "next/server"

// Simple text processing function as fallback
function generateNotesFromText(transcript: string, title: string, duration: string) {
  // Split transcript into sentences
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 10)

  // Create sections based on content length
  const sectionsCount = Math.min(Math.max(Math.floor(sentences.length / 8), 3), 8)
  const sentencesPerSection = Math.floor(sentences.length / sectionsCount)

  const sections = []

  for (let i = 0; i < sectionsCount; i++) {
    const startIdx = i * sentencesPerSection
    const endIdx = i === sectionsCount - 1 ? sentences.length : (i + 1) * sentencesPerSection
    const sectionSentences = sentences.slice(startIdx, endIdx)

    // Generate section title based on content
    const sectionTitle = `Section ${i + 1}: Key Points`

    // Create bullet points from sentences
    const content = sectionSentences
      .slice(0, 5) // Limit to 5 points per section
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 20)

    if (content.length > 0) {
      sections.push({
        title: sectionTitle,
        content: content,
      })
    }
  }

  // Generate summary (first few sentences)
  const summary = sentences.slice(0, 3).join(". ") + "."

  // Generate key points
  const keyPoints = sentences
    .filter((s) => s.length > 30 && s.length < 150)
    .slice(0, 5)
    .map((s) => s.trim())

  return {
    title,
    transcript,
    summary,
    keyPoints,
    sections,
    duration,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { transcript, title, duration } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 })
    }

    console.log("Generating notes for:", title)

    // Try Gemini API first if available
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai")
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: "gemini-pro" })

        const prompt = `
You are an expert note-taking assistant. Analyze the following video transcript and create comprehensive, well-structured study notes.

Video Title: ${title}
Duration: ${duration}

Transcript:
${transcript}

Please create detailed notes in the following JSON format:
{
  "title": "Video title",
  "transcript": "Original transcript",
  "summary": "A comprehensive 2-3 paragraph summary of the main content",
  "keyPoints": ["5-7 most important takeaways as bullet points"],
  "sections": [
    {
      "title": "Section title",
      "content": ["Detailed bullet points for this section"]
    }
  ],
  "duration": "Video duration"
}

Guidelines:
1. Create 4-8 logical sections based on the content
2. Each section should have 3-6 detailed bullet points
3. Use clear, educational language suitable for studying
4. Focus on key concepts, important facts, and actionable insights
5. Make the summary comprehensive but concise
6. Ensure key points are the most valuable takeaways
7. Structure content logically for easy learning and review

Return only the JSON object, no additional text.
`

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        // Clean and parse the response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const notes = JSON.parse(jsonMatch[0])

          // Validate and return
          if (notes.sections && Array.isArray(notes.sections)) {
            return NextResponse.json({
              title: notes.title || title,
              transcript: transcript,
              summary: notes.summary || "Summary not available",
              keyPoints: notes.keyPoints || [],
              sections: notes.sections || [],
              duration: duration || "Unknown",
            })
          }
        }

        throw new Error("Invalid AI response format")
      } catch (aiError) {
        console.error("Gemini AI error:", aiError)
        console.log("Falling back to text processing...")
      }
    }

    // Fallback to simple text processing
    console.log("Using fallback text processing method")
    const notes = generateNotesFromText(transcript, title, duration)

    return NextResponse.json(notes)
  } catch (error: any) {
    console.error("Error generating notes:", error)

    // Ultimate fallback
    const fallbackNotes = {
      title: title || "YouTube Video",
      transcript: transcript || "",
      summary: "This video covers various important topics. Please review the transcript for detailed information.",
      keyPoints: [
        "Review the full transcript for comprehensive understanding",
        "Key concepts and insights are discussed throughout the video",
        "Consider taking additional notes while reviewing",
      ],
      sections: [
        {
          title: "Main Content",
          content: [
            "This section contains the primary content from the video",
            "Review the transcript for detailed information",
            "Consider breaking down the content into smaller sections for better understanding",
          ],
        },
      ],
      duration: duration || "Unknown",
    }

    return NextResponse.json(fallbackNotes)
  }
}
