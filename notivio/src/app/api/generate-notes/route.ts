import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const { transcript, title, duration } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

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

    try {
      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in response")
      }

      const notes = JSON.parse(jsonMatch[0])

      // Validate the structure
      if (!notes.sections || !Array.isArray(notes.sections)) {
        throw new Error("Invalid notes structure")
      }

      // Ensure all required fields are present
      const processedNotes = {
        title: notes.title || title,
        transcript: transcript,
        summary: notes.summary || "Summary not available",
        keyPoints: notes.keyPoints || [],
        sections: notes.sections || [],
        duration: duration || "Unknown",
      }

      return NextResponse.json(processedNotes)
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)

      // Fallback: Create basic notes structure
      const fallbackNotes = {
        title: title,
        transcript: transcript,
        summary: "This video covers various topics. Please review the transcript for detailed information.",
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
        duration: duration,
      }

      return NextResponse.json(fallbackNotes)
    }
  } catch (error: any) {
    console.error("Error generating notes:", error)
    return NextResponse.json({ error: "Failed to generate notes" }, { status: 500 })
  }
}
