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
      prompt: `As an expert educator, analyze the following video transcript and create exactly 9-10 well-structured learning sections that capture the flow of the video content. 
Your goal is to transform the raw transcript into a high-quality study resource for students. 

Each section must include:
- **title**: A clear, descriptive heading that summarizes what students will learn in this section (not just copied from the transcript).
- **content**: An array of 4-6 detailed, student-friendly points. Each point should:
  - Explain the concept in simple terms
  - Provide context, examples, or real-world applications if mentioned or implied
  - Highlight cause-and-effect relationships and key takeaways
  - Avoid vague summaries or transcript fragments
- **learningObjectives**: 2-3 specific, measurable learning outcomes that describe what a student should understand or be able to explain after studying this section.

Additional guidelines:
1. Organize ideas logically in the order they are introduced in the transcript. Avoid mixing unrelated topics.
2. Break down complex concepts into digestible parts and ensure clarity, as if teaching beginners.
3. Rephrase and expand transcript content into meaningful, well-explained educational notes — do not copy text verbatim.
4. Ensure consistency: every section should feel complete and useful on its own.
5. Final output format: strictly return a valid JSON array of sections (no extra commentary or explanation outside the JSON).


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
      prompt: `Create a comprehensive, student-friendly summary of the following video transcript. 
This summary should be detailed, well-structured, and written in clear paragraphs (not bullet points). 
It must read like a proper study guide that students can use for review and deep understanding.

Structure the summary with these sections:

1. **Main Topic & Context**  
   - Write 2-3 sentences introducing what the video is about, why the topic is important, and the context in which it is being discussed.  

2. **Core Content**  
   - Write 4-5 well-developed paragraphs that cover the main ideas, explanations, and examples presented in the video.  
   - Break content into logical headings and subheadings for readability.  
   - Expand on the transcript by explaining concepts clearly, connecting ideas, and showing cause-and-effect relationships.  
   - Ensure each paragraph flows naturally into the next, giving students a coherent understanding of the material.  

3. **Key Insights**  
   - Write 2-3 sentences summarizing the most important lessons, principles, or takeaways from the video.  

4. **Practical Applications** (if applicable)  
   - Explain in 1-2 paragraphs how the concepts or knowledge from the video can be applied in real-world scenarios, studies, or problem-solving.  

Guidelines:  
- Use a clear, educational tone.  
- Do not copy transcript lines verbatim; instead, rephrase and elaborate for clarity.  
- Avoid scattered or incomplete points — ensure the summary feels cohesive and complete.  
- Write only in paragraphs (no lists, no bullet points).  


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
      prompt: `Extract exactly 6-8 key learning points from the following video transcript. 
Your goal is to create a concise yet complete set of insights that captures the entire video, so that even someone without time to watch the video can understand its essentials.

Requirements for each key point:
- It must be a complete, standalone insight (not just a heading or phrase).
- Length: around 100-150 characters each (one to two clear sentences).
- Cover all major topics mentioned in the transcript — do not leave out important ideas.
- Use clear, student-friendly language.
- Be specific and actionable when possible, not generic.

Output format: strictly a valid JSON array of strings. 
Each string should be one key point.


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
      prompt: `You are an expert educator and assessment designer. Using the following video transcript, create a study guide that promotes active learning and critical thinking.

Return ONLY a valid JSON object with exactly these keys:
- "reviewQuestions": array of 5-7 questions
- "practiceExercises": array of 3-4 exercises
- "memoryAids": array of 3-4 items
- "connections": array of 2-3 items

Content requirements:
1) reviewQuestions (5-7)
   - Each is a single, thought-provoking question ending with “?” (no answers).
   - Mix Bloom levels: include at least
     • 2 analysis/evaluation questions (compare, critique, justify, trade-offs)
     • 2 application questions (apply concepts to a scenario or dataset)
     • 1 concept-check that targets a common misconception from the transcript
   - Be specific to the transcript; avoid vague “Explain X.” Prefer “Why does X lead to Y in the context of Z?”

2) practiceExercises (3-4)
   - Each is a practical, real-world task or mini-case that a student can actually perform.
   - Include clear directions, inputs/constraints, and a success criterion (what a good answer demonstrates).
   - If the transcript includes quantitative steps, include at least one exercise requiring calculation or stepwise procedure.

3) memoryAids (3-4)
   - Short mnemonics, analogies, or chunking strategies that map directly to ideas in the transcript.
   - Each must be one sentence max and memorable (e.g., acronyms, vivid analogies).

4) connections (2-3)
   - One-sentence links to other subjects or real-world applications, showing transfer of learning.

Quality guardrails:
- Cover all major topics from the transcript across the four sections—do not omit key ideas.
- No duplication across items; each entry should add distinct value.
- Use student-friendly language; define jargon in context.
- Do NOT copy transcript lines verbatim; rephrase and clarify.
- Output MUST be valid JSON with only the four specified keys and string arrays. No extra text before or after the JSON.


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
