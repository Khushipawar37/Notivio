import { groq } from "@ai-sdk/groq"
import { generateText, generateObject } from "ai"
import { z } from "zod"

export const maxDuration = 30

const summarySchema = z.object({
  summary: z.string().describe("A concise summary of the provided text"),
  keyPoints: z.array(z.string()).describe("Main key points from the text"),
})

const flashcardSchema = z.object({
  flashcards: z
    .array(
      z.object({
        question: z.string().describe("A study question based on the content"),
        answer: z.string().describe("The answer to the question"),
      }),
    )
    .describe("Array of flashcards generated from the content"),
})

const structureSchema = z.object({
  suggestions: z.array(z.string()).describe("Suggested headings and structure for the content"),
  outline: z.string().describe("A structured outline of the content"),
})

export async function POST(req: Request) {
  try {
    const { action, content, selectedText } = await req.json()

    if (!content && !selectedText) {
      return Response.json({ error: "No content provided" }, { status: 400 })
    }

    const textToProcess = selectedText || content

    switch (action) {
      case "summarize":
        const { object: summaryResult } = await generateObject({
          model: groq("llama-3.3-70b-versatile"),
          schema: summarySchema,
          prompt: `Please provide a concise summary and key points for the following text. Focus on the main concepts and important information that a student would need to remember:\n\n${textToProcess}`,
        })
        return Response.json(summaryResult)

      case "flashcards":
        const { object: flashcardResult } = await generateObject({
          model: groq("llama-3.3-70b-versatile"),
          schema: flashcardSchema,
          prompt: `Generate study flashcards from the following text. Create questions that test understanding of key concepts, definitions, and important details. Make sure the questions are clear and the answers are comprehensive but concise:\n\n${textToProcess}`,
        })
        return Response.json(flashcardResult)

      case "structure":
        const { object: structureResult } = await generateObject({
          model: groq("llama-3.3-70b-versatile"),
          schema: structureSchema,
          prompt: `Analyze the following text and suggest a logical structure with headings and subheadings. Provide suggestions for organizing the content in a way that would be most helpful for studying and understanding:\n\n${textToProcess}`,
        })
        return Response.json(structureResult)

      case "questions":
        const { text: questionsResult } = await generateText({
          model: groq("llama-3.3-70b-versatile"),
          prompt: `Generate review questions based on the following text. Create a mix of question types including multiple choice, short answer, and essay questions that would help a student review and test their understanding:\n\n${textToProcess}`,
        })
        return Response.json({ questions: questionsResult })

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("AI Enhancement Error:", error)
    return Response.json({ error: "Failed to process AI request" }, { status: 500 })
  }
}
