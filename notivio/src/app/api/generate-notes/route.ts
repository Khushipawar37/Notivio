import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { transcript, title, duration } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 })
    }

    const [sections, summary, keyPoints, studyGuide, concepts] = await Promise.all([
      generateStructuredSections(transcript),
      generateDetailedSummary(transcript),
      generateKeyPoints(transcript),
      generateStudyGuide(transcript),
      generateKeyConcepts(transcript),
    ])

    const notes = {
      title: title || "Video Notes",
      transcript,
      sections,
      summary,
      keyPoints,
      studyGuide,
      concepts,
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
      model: groq("llama-3.1-70b-versatile") as any,
      prompt: `As an expert educator, analyze this video transcript and create 4-6 comprehensive learning sections. Each section should be designed to help students understand and retain the material effectively.

Format your response as a JSON array where each section has:
- title: A clear, descriptive section title that indicates what students will learn
- content: An array of 4-6 detailed points that explain concepts, provide examples, and highlight important information
- learningObjectives: 2-3 specific things students should understand after this section

Focus on:
- Breaking down complex concepts into digestible parts
- Providing context and explanations, not just facts
- Including examples and applications where mentioned
- Highlighting cause-and-effect relationships
- Making connections between different ideas

Transcript: ${transcript}

Return only the JSON array, no additional text.`,
      temperature: 0.2,
    })

    const sections = JSON.parse(text)
    return Array.isArray(sections) ? sections : []
  } catch (error) {
    console.error("Error generating sections:", error)
    return generateFallbackSections(transcript)
  }
}

async function generateDetailedSummary(transcript: string) {
  try {
    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile") as any,
      prompt: `Create a comprehensive, student-friendly summary of this video transcript. This summary should serve as a complete overview that students can use for studying and review.

Structure your summary with:
1. **Main Topic & Context** (2-3 sentences explaining what this video is about and why it matters)
2. **Core Content** (4-5 paragraphs covering the main points, explanations, and examples)
3. **Key Insights** (2-3 sentences highlighting the most important takeaways)
4. **Practical Applications** (if applicable, how this knowledge can be used)

Write in a clear, educational tone that helps students understand not just WHAT was discussed, but WHY it's important and HOW concepts connect to each other.

Transcript: ${transcript}

Provide only the summary, no additional formatting.`,
      temperature: 0.2,
    })

    return text.trim()
  } catch (error) {
    console.error("Error generating summary:", error)
    return "This video provides valuable educational content with key concepts and insights for student learning."
  }
}

async function generateKeyPoints(transcript: string) {
  try {
    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile") as any,
      prompt: `Extract 6-8 key learning points from this video transcript. Focus on the most important concepts, facts, and insights that students should remember and understand.

Each key point should be:
- A complete, standalone insight (not just a topic)
- Specific and actionable when possible
- Important for understanding the overall subject
- Written in clear, student-friendly language

Format as a JSON array of strings, where each string is a comprehensive key point (100-150 characters each).

Transcript: ${transcript}

Return only the JSON array, no additional text.`,
      temperature: 0.3,
    })

    const keyPoints = JSON.parse(text)
    return Array.isArray(keyPoints) ? keyPoints : []
  } catch (error) {
    console.error("Error generating key points:", error)
    return [
      "Key concepts and principles explained in the video",
      "Important examples and applications discussed",
      "Critical insights for understanding the topic",
      "Main learning objectives covered in the content",
    ]
  }
}

async function generateStudyGuide(transcript: string) {
  try {
    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile") as any,
      prompt: `Create a study guide from this video transcript to help students review and test their understanding.

Format as a JSON object with:
- "reviewQuestions": Array of 5-7 thought-provoking questions that test comprehension
- "practiceExercises": Array of 3-4 practical exercises or applications (if applicable)
- "memoryAids": Array of 3-4 mnemonics, analogies, or memory techniques mentioned or that could help
- "connections": Array of 2-3 ways this topic connects to other subjects or real-world applications

Focus on active learning and critical thinking rather than simple recall.

Transcript: ${transcript}

Return only the JSON object, no additional text.`,
      temperature: 0.3,
    })

    const studyGuide = JSON.parse(text)
    return studyGuide
  } catch (error) {
    console.error("Error generating study guide:", error)
    return {
      reviewQuestions: [
        "What are the main concepts discussed in this video?",
        "How do these ideas apply to real-world situations?",
        "What examples were used to illustrate key points?",
      ],
      practiceExercises: ["Review the main concepts and create your own examples"],
      memoryAids: ["Create mental connections between new and existing knowledge"],
      connections: ["Consider how this topic relates to other subjects you're studying"],
    }
  }
}

async function generateKeyConcepts(transcript: string) {
  try {
    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile") as any,
      prompt: `Identify and explain the key concepts, terms, and definitions from this video transcript. This should serve as a glossary for students.

Format as a JSON array where each concept has:
- "term": The key concept, term, or principle
- "definition": A clear, student-friendly explanation (2-3 sentences)
- "context": How this concept was used or explained in the video
- "importance": Why this concept is significant for understanding the topic

Focus on:
- Technical terms that were defined
- Important principles or theories mentioned
- Concepts that students need to understand for mastery
- Ideas that might be confusing without proper explanation

Transcript: ${transcript}

Return only the JSON array, no additional text.`,
      temperature: 0.2,
    })

    const concepts = JSON.parse(text)
    return Array.isArray(concepts) ? concepts : []
  } catch (error) {
    console.error("Error generating concepts:", error)
    return [
      {
        term: "Key Learning Concepts",
        definition: "Important ideas and principles covered in this educational content.",
        context: "Throughout the video discussion",
        importance: "Essential for understanding the main topic",
      },
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
      title: title.replace(/^[^a-zA-Z]*/, "").trim() || `Learning Section ${i + 1}`,
      content: content.length > 0 ? content : [`Educational content for section ${i + 1}`],
      learningObjectives: [`Understand key concepts from section ${i + 1}`, "Apply knowledge to practical situations"],
    })
  }

  return sections
}
