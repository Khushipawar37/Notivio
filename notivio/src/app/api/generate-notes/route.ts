import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const { transcript, title, language = "english" } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 })
    }

    // Create a system prompt for the AI
    const systemPrompt = `You are an expert note-taker and educator. Your task is to convert a raw transcript into well-structured, educational notes.
    
    Follow these guidelines:
    1. Create a hierarchical structure with main sections and subsections
    2. Use clear, concise language
    3. Highlight key concepts, definitions, and important points
    4. Create a brief summary of the entire content
    5. Format the response in JSON with the following structure:
    {
      "title": "Title of the content",
      "sections": [
        {
          "title": "Section Title",
          "content": ["Point 1", "Point 2", "Point 3"],
          "subsections": [
            {
              "title": "Subsection Title",
              "content": ["Subpoint 1", "Subpoint 2"]
            }
          ]
        }
      ],
      "summary": "A concise summary of the entire content"
    }
    
    The transcript is in ${language}. Process and structure the notes in ${language}.`

    // Generate structured notes using AI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: `Title: ${title}\n\nTranscript: ${transcript}`,
    })

    // Parse the JSON response
    const notesData = JSON.parse(text)

    // Return the structured notes
    return NextResponse.json({
      ...notesData,
      transcript: transcript,
    })
  } catch (error: any) {
    console.error("Error generating notes:", error)
    return NextResponse.json({ error: error.message || "Failed to generate notes" }, { status: 500 })
  }
}
