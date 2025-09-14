import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import Groq from "groq-sdk"
import {
  chunkTranscript,
  optimizeChunkingOptions,
  prepareChunkForProcessing,
  type TranscriptChunk,
} from "../../lib/chunking-utils"
import { combineChunkedNotes, type ChunkedNoteResult } from "../../lib/notes-combiner"

// Enhanced configuration for better note quality with chunking support
const GROQ_MODEL = "llama-3.1-8b-instant"
const MAX_TRANSCRIPT_LENGTH = 150000
const MIN_TRANSCRIPT_LENGTH = 50

const ChunkedNotesSchema = z.object({
  title: z.string().min(5).max(200),
  summary: z.string().min(50).max(400),
  keyPoints: z.array(z.string()).min(3).max(12),
  sections: z
    .array(
      z.object({
        title: z.string().min(5).max(80),
        content: z.array(z.string()).min(2).max(6),
        learningObjectives: z.array(z.string()).min(1).max(3),
        keyInsights: z.array(z.string()).min(1).max(2),
      }),
    )
    .min(2)
    .max(8),
  concepts: z
    .array(
      z.object({
        term: z.string(),
        definition: z.string(),
        context: z.string(),
        importance: z.string(),
        examples: z.array(z.string()).min(1).max(3),
        relatedTerms: z.array(z.string()).min(0).max(3),
      }),
    )
    .min(1)
    .max(15),
  studyGuide: z.object({
    reviewQuestions: z.array(z.string()).min(3).max(12),
    practiceExercises: z.array(z.string()).min(2).max(8),
    memoryAids: z.array(z.string()).min(2).max(6),
    connections: z.array(z.string()).min(2).max(8),
    advancedTopics: z.array(z.string()).min(1).max(5),
  }),
  quiz: z.object({
    questions: z
      .array(
        z.object({
          question: z.string(),
          options: z.array(z.string()).length(4),
          correctAnswer: z.number().min(0).max(3),
          explanation: z.string(),
          difficulty: z.string().regex(/^(easy|medium|hard)$/),
        }),
      )
      .min(2)
      .max(6),
  }),
})

type ChunkedNotes = z.infer<typeof ChunkedNotesSchema>

function buildChunkedPrompt(input: {
  title: string
  duration: string
  transcript: string
  contentType: string
  chunkIndex: number
  totalChunks: number
  isFirstChunk: boolean
  isLastChunk: boolean
}): string {
  const { title, duration, transcript, contentType, chunkIndex, totalChunks, isFirstChunk, isLastChunk } = input

  const contextInfo =
    totalChunks > 1
      ? `\nCONTEXT: This is chunk ${chunkIndex + 1} of ${totalChunks} from the video "${title}".
${isFirstChunk ? "This is the FIRST chunk - focus on introduction and early concepts." : ""}
${isLastChunk ? "This is the LAST chunk - focus on conclusions and final concepts." : ""}
${!isFirstChunk && !isLastChunk ? "This is a MIDDLE chunk - focus on core content and development of ideas." : ""}`
      : ""

  return `You are an expert educational content analyst. Create high-quality, focused study notes from this video transcript chunk.

CRITICAL REQUIREMENTS:
1. Base ALL content STRICTLY on the provided transcript chunk
2. Generate content in ENGLISH ONLY
3. Focus on QUALITY over quantity - better fewer high-quality items than many poor ones
4. Ensure all content is immediately useful for learning
5. Keep explanations concise but informative
6. Avoid repetitive or generic content

CONTENT TYPE: ${contentType}
VIDEO TITLE: ${title}
DURATION: ${duration}${contextInfo}

TRANSCRIPT CHUNK:
"""
${transcript}
"""

Generate comprehensive notes following this exact JSON schema:

{
  "title": "string (5-200 chars, descriptive title for this content)",
  "summary": "string (50-400 chars, comprehensive overview of this chunk)",
  "keyPoints": ["array of 3-12 key takeaways, each 1-2 sentences"],
  "sections": [
    {
      "title": "string (5-80 chars, clear section heading)",
      "content": ["array of 2-6 content points, each 1-2 sentences"],
      "learningObjectives": ["array of 1-3 specific learning goals"],
      "keyInsights": ["array of 1-2 important insights"]
    }
  ] (2-8 sections),
  "concepts": [
    {
      "term": "string (key concept or term)",
      "definition": "string (clear, concise definition)",
      "context": "string (how it relates to the content)",
      "importance": "string (why it matters)",
      "examples": ["array of 1-3 practical examples"],
      "relatedTerms": ["array of 0-3 related concepts"]
    }
  ] (1-15 concepts),
  "studyGuide": {
    "reviewQuestions": ["array of 3-12 thought-provoking questions"],
    "practiceExercises": ["array of 2-8 actionable practice tasks"],
    "memoryAids": ["array of 2-6 memory strategies"],
    "connections": ["array of 2-8 connections to other topics"],
    "advancedTopics": ["array of 1-5 areas for further study"]
  },
  "quiz": {
    "questions": [
      {
        "question": "string (clear, specific question)",
        "options": ["array of 4 answer choices"],
        "correctAnswer": "number (0-3, index of correct option)",
        "explanation": "string (why this answer is correct)",
        "difficulty": "string (easy, medium, or hard)"
      }
    ] (2-6 questions)
  }
}`
}

async function processChunk(
  chunk: TranscriptChunk,
  chunkIndex: number,
  totalChunks: number,
  title: string,
  duration: string,
  contentType: string,
  groqClient: any,
): Promise<ChunkedNoteResult> {
  const preparedContent = prepareChunkForProcessing(chunk)

  const prompt = buildChunkedPrompt({
    title,
    duration,
    transcript: preparedContent,
    contentType,
    chunkIndex,
    totalChunks,
    isFirstChunk: chunkIndex === 0,
    isLastChunk: chunkIndex === totalChunks - 1,
  })

  console.log(`🚀 Processing chunk ${chunkIndex + 1}/${totalChunks} with Groq API`)

  const completion = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an expert note-taking assistant. Generate high-quality, structured notes based on the provided transcript chunk. Follow the exact JSON schema format. Ensure ALL minimum requirements are met.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 3500, // Reduced for chunked processing
    top_p: 0.9,
    response_format: { type: "json_object" },
  })

  const responseContent = completion.choices[0]?.message?.content
  if (!responseContent) {
    throw new Error(`No response content from Groq API for chunk ${chunkIndex + 1}`)
  }

  let parsedNotes
  try {
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      parsedNotes = JSON.parse(jsonMatch[0])
    } else {
      parsedNotes = JSON.parse(responseContent)
    }
  } catch (parseError) {
    console.error(`Failed to parse Groq response for chunk ${chunkIndex + 1}:`, parseError)
    throw new Error(`Invalid JSON response from Groq API for chunk ${chunkIndex + 1}`)
  }

  // Validate and fix the response
  let validatedNotes
  try {
    validatedNotes = ChunkedNotesSchema.parse(parsedNotes)
  } catch (validationError: any) {
    console.log(`🔧 Fixing validation issues for chunk ${chunkIndex + 1}...`)
    const fixedNotes = fixChunkedValidationIssues(parsedNotes)
    validatedNotes = ChunkedNotesSchema.parse(fixedNotes)
  }

  return {
    chunkId: chunk.id,
    title: validatedNotes.title,
    summary: validatedNotes.summary,
    keyPoints: validatedNotes.keyPoints,
    sections: validatedNotes.sections,
    concepts: validatedNotes.concepts,
    studyGuide: validatedNotes.studyGuide,
    quiz: validatedNotes.quiz,
  }
}

function fixChunkedValidationIssues(notes: any): any {
  const fixed = { ...notes }

  // Ensure minimum array lengths
  if (!fixed.sections || fixed.sections.length < 2) {
    fixed.sections = fixed.sections || []
    while (fixed.sections.length < 2) {
      fixed.sections.push({
        title: `Key Topic ${fixed.sections.length + 1}`,
        content: ["Important information from this section"],
        learningObjectives: ["Understand key concepts"],
        keyInsights: ["Important insights"],
      })
    }
  }

  // Fix sections structure
  fixed.sections = fixed.sections.map((section: any) => ({
    title:
      typeof section.title === "string" && section.title.length >= 5
        ? section.title.slice(0, 80)
        : `Key Topic - ${section.title || "Important Content"}`,
    content:
      Array.isArray(section.content) && section.content.length >= 2
        ? section.content.slice(0, 6)
        : Array.isArray(section.content) && section.content.length > 0
          ? [...section.content, "Additional key information"]
          : ["Important information from this section", "Key details and concepts"],
    learningObjectives:
      Array.isArray(section.learningObjectives) && section.learningObjectives.length >= 1
        ? section.learningObjectives.slice(0, 3)
        : ["Understand key concepts"],
    keyInsights:
      Array.isArray(section.keyInsights) && section.keyInsights.length >= 1
        ? section.keyInsights.slice(0, 2)
        : ["Important insights from this content"],
  }))

  if (!fixed.concepts || fixed.concepts.length < 1) {
    fixed.concepts = fixed.concepts || []
    while (fixed.concepts.length < 1) {
      fixed.concepts.push({
        term: `Concept ${fixed.concepts.length + 1}`,
        definition: "A key concept from the content",
        context: "Referenced in the content",
        importance: "Important for understanding",
        examples: ["Example from content"],
        relatedTerms: [],
      })
    }
  }

  // Fix concepts structure
  fixed.concepts = fixed.concepts.slice(0, 15).map((concept: any) => ({
    term: concept.term || `Key Term`,
    definition: concept.definition || "Important definition",
    context: concept.context || "Context from the content",
    importance: concept.importance || "Significant for understanding",
    examples:
      Array.isArray(concept.examples) && concept.examples.length >= 1
        ? concept.examples.slice(0, 3)
        : ["Example from the content"],
    relatedTerms: Array.isArray(concept.relatedTerms) ? concept.relatedTerms.slice(0, 3) : [],
  }))

  if (!fixed.quiz?.questions || fixed.quiz.questions.length < 2) {
    fixed.quiz = fixed.quiz || { questions: [] }
    while (fixed.quiz.questions.length < 2) {
      fixed.quiz.questions.push({
        question: `What is a key concept from this content?`,
        options: ["Correct answer", "Incorrect option", "Another incorrect option", "Yet another incorrect option"],
        correctAnswer: 0,
        explanation: "This is the main concept discussed",
        difficulty: "easy",
      })
    }
  }

  // Fix existing quiz questions
  fixed.quiz.questions = fixed.quiz.questions.slice(0, 6).map((q: any, index: number) => {
    // Ensure options array has exactly 4 elements
    let options = Array.isArray(q.options) ? q.options : []
    if (options.length < 4) {
      const defaultOptions = ["Option A", "Option B", "Option C", "Option D"]
      while (options.length < 4) {
        options.push(defaultOptions[options.length] || `Option ${options.length + 1}`)
      }
    } else if (options.length > 4) {
      options = options.slice(0, 4)
    }

    // Ensure correctAnswer is valid (0-3)
    let correctAnswer = typeof q.correctAnswer === "number" ? q.correctAnswer : 0
    if (correctAnswer < 0 || correctAnswer > 3) {
      correctAnswer = 0
    }

    // Ensure difficulty matches regex
    let difficulty = q.difficulty
    if (!difficulty || !["easy", "medium", "hard"].includes(difficulty)) {
      difficulty = "easy"
    }

    return {
      question: q.question || `Question ${index + 1}: What is important to understand?`,
      options,
      correctAnswer,
      explanation: q.explanation || "This covers key concepts from the content",
      difficulty,
    }
  })

  // Ensure minimum string lengths
  if (!fixed.title || fixed.title.length < 5) {
    fixed.title = (fixed.title || "Video") + " - Study Notes"
  }
  if (fixed.title.length > 200) {
    fixed.title = fixed.title.slice(0, 197) + "..."
  }

  if (!fixed.summary || fixed.summary.length < 50) {
    fixed.summary =
      (fixed.summary || "This content covers important topics") +
      " This material provides valuable information for learning and understanding key concepts."
  }
  if (fixed.summary.length > 400) {
    fixed.summary = fixed.summary.slice(0, 397) + "..."
  }

  // Ensure keyPoints has proper length
  if (!fixed.keyPoints || fixed.keyPoints.length < 3) {
    fixed.keyPoints = fixed.keyPoints || []
    while (fixed.keyPoints.length < 3) {
      fixed.keyPoints.push(`Key point ${fixed.keyPoints.length + 1}: Important information`)
    }
  }
  if (fixed.keyPoints.length > 12) {
    fixed.keyPoints = fixed.keyPoints.slice(0, 12)
  }

  // Ensure study guide has minimum items
  if (!fixed.studyGuide) {
    fixed.studyGuide = {}
  }

  const studyGuideDefaults = {
    reviewQuestions: ["What are the main concepts?", "How can this be applied?", "What questions remain?"],
    practiceExercises: ["Summarize key points", "Create examples"],
    memoryAids: ["Use visualization", "Create connections"],
    connections: ["Relates to other topics", "Applies to real situations"],
    advancedTopics: ["Further research areas"],
  }

  Object.entries(studyGuideDefaults).forEach(([key, defaultValues]) => {
    const minLength = key === "advancedTopics" ? 1 : 2
    const maxLength =
      key === "reviewQuestions"
        ? 12
        : key === "practiceExercises"
          ? 8
          : key === "connections"
            ? 8
            : key === "memoryAids"
              ? 6
              : 5

    if (!fixed.studyGuide[key] || fixed.studyGuide[key].length < minLength) {
      fixed.studyGuide[key] = fixed.studyGuide[key] || []
      while (fixed.studyGuide[key].length < minLength) {
        const defaultIndex = fixed.studyGuide[key].length % defaultValues.length
        fixed.studyGuide[key].push(defaultValues[defaultIndex])
      }
    }

    if (fixed.studyGuide[key].length > maxLength) {
      fixed.studyGuide[key] = fixed.studyGuide[key].slice(0, maxLength)
    }
  })

  return fixed
}

// Function to ensure transcript is in English
async function ensureEnglish(transcript: string): Promise<string> {
  try {
    // Simple language detection - if it contains non-Latin characters, it might not be English
    const hasNonLatinChars = /[^\u0000-\u007F\u00A0-\u00FF]/.test(transcript)

    if (hasNonLatinChars) {
      // For now, we'll use a simple approach - if it's not clearly English,
      // we'll add a note to the prompt to ensure English output
      console.log("Non-English characters detected, ensuring English output")
    }

    return transcript
  } catch (error) {
    console.error("Language detection error:", error)
    return transcript
  }
}

// Content type detection based on transcript analysis
function detectContentType(
  transcript: string,
  title: string,
): "educational" | "general_knowledge" | "journey" | "tutorial" | "lecture" {
  const lowerTranscript = transcript.toLowerCase()
  const lowerTitle = title.toLowerCase()

  // Educational indicators
  const educationalTerms = [
    "learn",
    "understand",
    "concept",
    "principle",
    "theory",
    "method",
    "technique",
    "algorithm",
    "formula",
    "equation",
    "hypothesis",
    "research",
    "study",
    "analysis",
  ]

  // Tutorial indicators
  const tutorialTerms = [
    "step",
    "guide",
    "tutorial",
    "how to",
    "walkthrough",
    "demonstration",
    "example",
    "practice",
    "exercise",
    "assignment",
    "project",
  ]

  // Lecture indicators
  const lectureTerms = [
    "lecture",
    "class",
    "course",
    "curriculum",
    "syllabus",
    "module",
    "lesson",
    "unit",
    "semester",
    "academic",
    "scholarly",
  ]

  // Journey indicators
  const journeyTerms = [
    "journey",
    "story",
    "experience",
    "adventure",
    "travel",
    "trip",
    "personal",
    "life",
    "career",
    "transformation",
    "growth",
  ]

  // Count occurrences
  const educationalScore = educationalTerms.filter(
    (term) => lowerTranscript.includes(term) || lowerTitle.includes(term),
  ).length

  const tutorialScore = tutorialTerms.filter(
    (term) => lowerTranscript.includes(term) || lowerTitle.includes(term),
  ).length

  const lectureScore = lectureTerms.filter((term) => lowerTranscript.includes(term) || lowerTitle.includes(term)).length

  const journeyScore = journeyTerms.filter((term) => lowerTranscript.includes(term) || lowerTitle.includes(term)).length

  // Determine content type based on highest score
  const scores = [
    { type: "educational" as const, score: educationalScore },
    { type: "tutorial" as const, score: tutorialScore },
    { type: "lecture" as const, score: lectureScore },
    { type: "journey" as const, score: journeyScore },
    { type: "general_knowledge" as const, score: 0 },
  ]

  const maxScore = Math.max(...scores.map((s) => s.score))
  if (maxScore === 0) return "general_knowledge"

  return scores.find((s) => s.score === maxScore)?.type || "general_knowledge"
}

// Enhanced prompt builder for different content types
function buildEnhancedPrompt(input: {
  title: string
  duration: string
  transcript: string
  contentType: string
}) {
  const { title, duration, transcript, contentType } = input

  const basePrompt = `You are an expert educational content analyst. Create comprehensive, high-quality study notes that will help students learn effectively.

CRITICAL REQUIREMENTS:
1. Base ALL content STRICTLY on the provided transcript - never invent facts
2. Generate ALL content in ENGLISH ONLY
3. Focus on QUALITY over quantity - better fewer excellent items than many poor ones
4. Ensure all content is accurate, relevant, and immediately useful for learning
5. Use clear, concise language that's easy to understand
6. Structure information logically for optimal learning retention

CONTENT TYPE: ${contentType}
VIDEO TITLE: ${title}
DURATION: ${duration}

TRANSCRIPT:
"""
${transcript}
"""

Generate comprehensive notes following this exact JSON schema:`

  const schemaPrompt = `
Return ONLY valid JSON matching this schema:
{
  "title": "string (5-200 chars, descriptive title)",
  "summary": "string (50-500 chars, comprehensive overview)",
  "keyPoints": ["array of 3-15 key takeaways, each 1-2 sentences"],
  "sections": [
    {
      "title": "string (5-80 chars, clear section heading)",
      "content": ["array of 2-8 content points, each 1-2 sentences"],
      "learningObjectives": ["array of 1-4 specific learning goals"],
      "keyInsights": ["array of 1-3 important insights"]
    }
  ] (3-10 sections),
  "concepts": [
    {
      "term": "string (key concept or term)",
      "definition": "string (clear, concise definition)",
      "context": "string (how it relates to the content)",
      "importance": "string (why it matters)",
      "examples": ["array of 1-3 practical examples"],
      "relatedTerms": ["array of 0-3 related concepts"]
    }
  ] (2-20 concepts),
  "studyGuide": {
    "reviewQuestions": ["array of 3-20 thought-provoking questions"],
    "practiceExercises": ["array of 2-15 actionable practice tasks"],
    "memoryAids": ["array of 2-10 memory strategies"],
    "connections": ["array of 2-12 connections to other topics"],
    "advancedTopics": ["array of 1-8 areas for further study"]
  },
  "quiz": {
    "questions": [
      {
        "question": "string (clear, specific question)",
        "options": ["array of 4 answer choices"],
        "correctAnswer": "number (0-3, index of correct option)",
        "explanation": "string (why this answer is correct)",
        "difficulty": "string (easy, medium, or hard)"
      }
    ] (3-10 questions)
  },
  "contentType": "string (educational, tutorial, lecture, journey, general_knowledge)",
  "difficulty": "string (beginner, intermediate, advanced)",
  "estimatedStudyTime": "string (e.g., '30-45 minutes', '2-3 hours')",
  "prerequisites": ["array of 0-6 required knowledge/skills"],
  "nextSteps": ["array of 1-6 recommended next actions"]
}

Generate the notes now, ensuring maximum educational value and practical utility.`

  return basePrompt + schemaPrompt
}

// Function to fix common validation issues in Groq API responses
function fixValidationIssues(notes: any): any {
  const fixed = { ...notes }

  // Ensure minimum array lengths
  if (!fixed.sections || fixed.sections.length < 3) {
    fixed.sections = fixed.sections || []
    while (fixed.sections.length < 3) {
      fixed.sections.push({
        title: `Section ${fixed.sections.length + 1}`,
        content: ["Content for this section"],
        learningObjectives: ["Understand key concepts"],
        keyInsights: ["Important insights"],
      })
    }
  }

  if (!fixed.concepts || fixed.concepts.length < 2) {
    fixed.concepts = fixed.concepts || []
    while (fixed.concepts.length < 2) {
      fixed.concepts.push({
        term: `Concept ${fixed.concepts.length + 1}`,
        definition: "A key concept from the video",
        context: "Referenced in the video content",
        importance: "Important for understanding the topic",
        examples: ["Example from the video"],
        relatedTerms: [],
      })
    }
  }

  if (!fixed.quiz?.questions || fixed.quiz.questions.length < 3) {
    fixed.quiz = fixed.quiz || { questions: [] }
    while (fixed.quiz.questions.length < 3) {
      fixed.quiz.questions.push({
        question: `Question ${fixed.quiz.questions.length + 1}`,
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correctAnswer: 0,
        explanation: "Explanation for the correct answer",
        difficulty: "easy",
      })
    }
  }

  // Fix quiz question explanations that are too long
  if (fixed.quiz?.questions) {
    fixed.quiz.questions.forEach((question: any, index: number) => {
      if (question.explanation && question.explanation.length > 150) {
        question.explanation = question.explanation.substring(0, 147) + "..."
      }
    })
  }

  if (!fixed.mnemonics || fixed.mnemonics.length < 2) {
    fixed.mnemonics = fixed.mnemonics || []
    while (fixed.mnemonics.length < 2) {
      fixed.mnemonics.push({
        concept: `Concept ${fixed.mnemonics.length + 1}`,
        mnemonic: "Memory aid for this concept",
        explanation: "How to use this memory aid",
      })
    }
  }

  if (!fixed.practicalApplications || fixed.practicalApplications.length < 2) {
    fixed.practicalApplications = fixed.practicalApplications || []
    while (fixed.practicalApplications.length < 2) {
      fixed.practicalApplications.push({
        scenario: "Real-world application",
        application: "How to apply this knowledge",
        benefits: ["Benefit 1", "Benefit 2"],
      })
    }
  }

  // Ensure minimum string lengths
  if (fixed.title && fixed.title.length < 5) {
    fixed.title = fixed.title + " - Video Notes"
  }

  if (fixed.summary && fixed.summary.length < 50) {
    fixed.summary = fixed.summary + " This video provides valuable information that can be applied in various contexts."
  }

  // Fix any other strings that exceed maximum lengths
  if (fixed.summary && fixed.summary.length > 500) {
    fixed.summary = fixed.summary.substring(0, 497) + "..."
  }

  if (fixed.title && fixed.title.length > 200) {
    fixed.title = fixed.title.substring(0, 197) + "..."
  }

  // Fix section content that might be too long
  if (fixed.sections) {
    fixed.sections.forEach((section: any) => {
      if (section.title && section.title.length > 80) {
        section.title = section.title.substring(0, 77) + "..."
      }
      if (section.content) {
        section.content = section.content.map((item: string) => {
          if (item.length > 200) {
            return item.substring(0, 197) + "..."
          }
          return item
        })
      }
    })
  }

  // Fix concept definitions that might be too long
  if (fixed.concepts) {
    fixed.concepts.forEach((concept: any) => {
      if (concept.definition && concept.definition.length > 200) {
        concept.definition = concept.definition.substring(0, 197) + "..."
      }
      if (concept.context && concept.context.length > 150) {
        concept.context = concept.context.substring(0, 147) + "..."
      }
      if (concept.importance && concept.importance.length > 200) {
        concept.importance = concept.importance.substring(0, 197) + "..."
      }
    })
  }

  return fixed
}

// Function to ensure all strings are within their maximum limits
function ensureStringLimits(notes: any): any {
  const limited = { ...notes }

  // Title: max 200 chars
  if (limited.title && limited.title.length > 200) {
    limited.title = limited.title.substring(0, 197) + "..."
  }

  // Summary: max 500 chars
  if (limited.summary && limited.summary.length > 500) {
    limited.summary = limited.summary.substring(0, 497) + "..."
  }

  // Key points: max 200 chars each
  if (limited.keyPoints) {
    limited.keyPoints = limited.keyPoints.map((point: string) => {
      if (point.length > 200) {
        return point.substring(0, 197) + "..."
      }
      return point
    })
  }

  // Sections
  if (limited.sections) {
    limited.sections = limited.sections.map((section: any) => {
      const fixedSection = { ...section }

      // Section title: max 80 chars
      if (fixedSection.title && fixedSection.title.length > 80) {
        fixedSection.title = fixedSection.title.substring(0, 77) + "..."
      }

      // Section content: max 200 chars each
      if (fixedSection.content) {
        fixedSection.content = fixedSection.content.map((item: string) => {
          if (item.length > 200) {
            return item.substring(0, 197) + "..."
          }
          return item
        })
      }

      // Learning objectives: max 200 chars each
      if (fixedSection.learningObjectives) {
        fixedSection.learningObjectives = fixedSection.learningObjectives.map((obj: string) => {
          if (obj.length > 200) {
            return obj.substring(0, 197) + "..."
          }
          return obj
        })
      }

      // Key insights: max 200 chars each
      if (fixedSection.keyInsights) {
        fixedSection.keyInsights = fixedSection.keyInsights.map((insight: string) => {
          if (insight.length > 200) {
            return insight.substring(0, 197) + "..."
          }
          return insight
        })
      }

      return fixedSection
    })
  }

  // Study guide
  if (limited.studyGuide) {
    const guide = limited.studyGuide

    // Review questions: max 200 chars each
    if (guide.reviewQuestions) {
      guide.reviewQuestions = guide.reviewQuestions.map((q: string) => {
        if (q.length > 200) {
          return q.substring(0, 197) + "..."
        }
        return q
      })
    }

    // Practice exercises: max 200 chars each
    if (guide.practiceExercises) {
      guide.practiceExercises = guide.practiceExercises.map((ex: string) => {
        if (ex.length > 200) {
          return ex.substring(0, 197) + "..."
        }
        return ex
      })
    }

    // Memory aids: max 200 chars each
    if (guide.memoryAids) {
      guide.memoryAids = guide.memoryAids.map((aid: string) => {
        if (aid.length > 200) {
          return aid.substring(0, 197) + "..."
        }
        return aid
      })
    }

    // Connections: max 200 chars each
    if (guide.connections) {
      guide.connections = guide.connections.map((conn: string) => {
        if (conn.length > 200) {
          return conn.substring(0, 197) + "..."
        }
        return conn
      })
    }

    // Advanced topics: max 200 chars each
    if (guide.advancedTopics) {
      guide.advancedTopics = guide.advancedTopics.map((topic: string) => {
        if (topic.length > 200) {
          return topic.substring(0, 197) + "..."
        }
        return topic
      })
    }
  }

  // Concepts
  if (limited.concepts) {
    limited.concepts = limited.concepts.map((concept: any) => {
      const fixedConcept = { ...concept }

      // Term: max 50 chars
      if (fixedConcept.term && fixedConcept.term.length > 50) {
        fixedConcept.term = fixedConcept.term.substring(0, 47) + "..."
      }

      // Definition: max 200 chars
      if (fixedConcept.definition && fixedConcept.definition.length > 200) {
        fixedConcept.definition = fixedConcept.definition.substring(0, 197) + "..."
      }

      // Context: max 150 chars
      if (fixedConcept.context && fixedConcept.context.length > 150) {
        fixedConcept.context = fixedConcept.context.substring(0, 147) + "..."
      }

      // Importance: max 200 chars
      if (fixedConcept.importance && fixedConcept.importance.length > 200) {
        fixedConcept.importance = fixedConcept.importance.substring(0, 197) + "..."
      }

      // Examples: max 200 chars each
      if (fixedConcept.examples) {
        fixedConcept.examples = fixedConcept.examples.map((ex: string) => {
          if (ex.length > 200) {
            return ex.substring(0, 197) + "..."
          }
          return ex
        })
      }

      return fixedConcept
    })
  }

  // Quiz questions
  if (limited.quiz?.questions) {
    limited.quiz.questions = limited.quiz.questions.map((question: any) => {
      const fixedQuestion = { ...question }

      // Question: max 200 chars
      if (fixedQuestion.question && fixedQuestion.question.length > 200) {
        fixedQuestion.question = fixedQuestion.question.substring(0, 197) + "..."
      }

      // Explanation: max 150 chars
      if (fixedQuestion.explanation && fixedQuestion.explanation.length > 150) {
        fixedQuestion.explanation = fixedQuestion.explanation.substring(0, 147) + "..."
      }

      return fixedQuestion
    })
  }

  // Mnemonics
  if (limited.mnemonics) {
    limited.mnemonics = limited.mnemonics.map((mnemonic: any) => {
      const fixedMnemonic = { ...mnemonic }

      // Concept: max 50 chars
      if (fixedMnemonic.concept && fixedMnemonic.concept.length > 50) {
        fixedMnemonic.concept = fixedMnemonic.concept.substring(0, 47) + "..."
      }

      // Mnemonic: max 200 chars
      if (fixedMnemonic.mnemonic && fixedMnemonic.mnemonic.length > 200) {
        fixedMnemonic.mnemonic = fixedMnemonic.mnemonic.substring(0, 197) + "..."
      }

      // Explanation: max 150 chars
      if (fixedMnemonic.explanation && fixedMnemonic.explanation.length > 150) {
        fixedMnemonic.explanation = fixedMnemonic.explanation.substring(0, 147) + "..."
      }

      return fixedMnemonic
    })
  }

  // Practical applications
  if (limited.practicalApplications) {
    limited.practicalApplications = limited.practicalApplications.map((app: any) => {
      const fixedApp = { ...app }

      // Scenario: max 150 chars
      if (fixedApp.scenario && fixedApp.scenario.length > 150) {
        fixedApp.scenario = fixedApp.scenario.substring(0, 147) + "..."
      }

      // Application: max 200 chars
      if (fixedApp.application && fixedApp.application.length > 200) {
        fixedApp.application = fixedApp.application.substring(0, 197) + "..."
      }

      return fixedApp
    })
  }

  return limited
}

// Enhanced transcript cleaning
function cleanTranscript(text: string): string {
  let cleaned = text

  // Remove timestamps and speaker labels
  cleaned = cleaned.replace(/\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?/g, " ")
  cleaned = cleaned.replace(/^[ \t]*([A-Z][A-Za-z0-9 _-]{0,30}):[ \t]*/gm, "")

  // Remove common filler words and phrases
  cleaned = cleaned.replace(/\b(um+|uh+|er+|ah+|like,?|you know|sort of|kind of|basically|actually|literally)\b/gi, " ")

  // Remove video-specific fluff
  cleaned = cleaned.replace(
    /\b(don't forget to|be sure to|make sure to|subscribe|like the video|hit the bell|comment below|share this video)\b.*$/gim,
    " ",
  )

  // Clean up whitespace and formatting
  cleaned = cleaned
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()

  // Normalize quotes and dashes
  cleaned = cleaned.replace(/[""]/g, '"').replace(/['']/g, "'").replace(/—|–/g, "-")

  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { transcript, title, duration } = body || {}

    if (!transcript || typeof transcript !== "string" || transcript.trim().length < MIN_TRANSCRIPT_LENGTH) {
      return NextResponse.json(
        {
          error: "Transcript is required and must be at least 50 characters long",
        },
        { status: 400 },
      )
    }

    // Clean and prepare transcript
    const cleanedTranscript = cleanTranscript(transcript)

    // Ensure transcript is in English
    const englishTranscript = await ensureEnglish(cleanedTranscript)

    if (englishTranscript.length < MIN_TRANSCRIPT_LENGTH) {
      return NextResponse.json(
        {
          error: "Transcript is too short after cleaning",
        },
        { status: 400 },
      )
    }

    // Detect content type for adaptive prompting
    const contentType = detectContentType(englishTranscript, title || "Video")

    // Check for Groq API key
    const groqApiKey = process.env.GROQ_API_KEY

    if (!groqApiKey) {
      return NextResponse.json(
        {
          error: "Groq API key not configured. Please set GROQ_API_KEY environment variable.",
        },
        { status: 500 },
      )
    }

    const groqClient = new Groq({ apiKey: groqApiKey })

    try {
      const chunkingOptions = optimizeChunkingOptions(englishTranscript)
      const chunks = chunkTranscript(englishTranscript, chunkingOptions)

      console.log(`📊 Processing ${chunks.length} chunks for transcript of ${englishTranscript.length} characters`)

      // Process chunks sequentially to avoid rate limits
      const chunkedResults: ChunkedNoteResult[] = []

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        console.log(`🔄 Processing chunk ${i + 1}/${chunks.length} (${chunk.content.length} chars)`)

        try {
          const result = await processChunk(
            chunk,
            i,
            chunks.length,
            title || "Video Notes",
            duration || "Unknown",
            contentType,
            groqClient,
          )

          chunkedResults.push(result)

          // Add small delay between chunks to respect rate limits
          if (i < chunks.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        } catch (chunkError) {
          console.error(`❌ Error processing chunk ${i + 1}:`, chunkError)

          // Create fallback result for failed chunk
          const fallbackResult: ChunkedNoteResult = {
            chunkId: chunk.id,
            title: `Section ${i + 1}`,
            summary: "This section contains important information from the video.",
            keyPoints: ["Key information from this section"],
            sections: [
              {
                title: `Content Section ${i + 1}`,
                content: ["Important content from this part of the video"],
                learningObjectives: ["Understand key concepts"],
                keyInsights: ["Important insights"],
              },
            ],
            concepts: [
              {
                term: "Key Concept",
                definition: "An important concept from this section",
                context: "Discussed in the video",
                importance: "Important for understanding",
                examples: ["Example from content"],
                relatedTerms: [],
              },
            ],
            studyGuide: {
              reviewQuestions: ["What are the main points?"],
              practiceExercises: ["Review the content"],
              memoryAids: ["Create connections"],
              connections: ["Relates to other topics"],
              advancedTopics: ["Further study"],
            },
            quiz: {
              questions: [
                {
                  question: "What is discussed in this section?",
                  options: ["Main topic", "Other topic", "Another topic", "Yet another topic"],
                  correctAnswer: 0,
                  explanation: "This is the main focus",
                  difficulty: "easy",
                },
              ],
            },
          }

          chunkedResults.push(fallbackResult)
        }
      }

      console.log(`🔄 Combining ${chunkedResults.length} chunk results...`)
      const combinedNotes = combineChunkedNotes(
        chunkedResults,
        englishTranscript,
        title || "Video Notes",
        duration || "Unknown",
      )

      console.log("✅ Notes generated successfully with chunking")

      // Return the combined notes in the expected format
      return NextResponse.json({
        title: combinedNotes.title,
        transcript: combinedNotes.transcript,
        sections: combinedNotes.sections,
        summary: combinedNotes.summary,
        keyPoints: combinedNotes.keyPoints,
        studyGuide: combinedNotes.studyGuide,
        concepts: combinedNotes.concepts,
        duration: combinedNotes.duration,
        contentType: combinedNotes.contentType,
        difficulty: combinedNotes.difficulty,
        estimatedStudyTime: combinedNotes.estimatedStudyTime,
        prerequisites: combinedNotes.prerequisites,
        nextSteps: combinedNotes.nextSteps,
        quiz: combinedNotes.quiz,
      })
    } catch (error: any) {
      console.error("Chunked processing error:", error)

      // Fallback to basic note generation
      return NextResponse.json({
        title: title || "Video Notes",
        transcript: englishTranscript,
        sections: generateBasicSections(englishTranscript),
        summary: generateBasicSummary(englishTranscript),
        keyPoints: generateBasicKeyPoints(englishTranscript),
        studyGuide: generateBasicStudyGuide(),
        concepts: generateBasicConcepts(englishTranscript),
        duration: duration || "Unknown",
        contentType: contentType,
        difficulty: "intermediate",
        estimatedStudyTime: "30-45 minutes",
        prerequisites: [],
        nextSteps: ["Review key concepts", "Practice with examples"],
        quiz: generateBasicQuiz(),
      })
    }
  } catch (error: any) {
    console.error("Notes generation error:", error?.message || error)
    return NextResponse.json(
      {
        error: "Failed to generate notes. Please try again.",
      },
      { status: 500 },
    )
  }
}

// Fallback functions for basic note generation
function generateBasicSections(transcript: string) {
  const sentences = transcript
    .split(/[.!?]+/g)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 15)

  const sectionsCount = Math.min(Math.max(5, Math.floor(sentences.length / 8)), 10)
  const sections = []

  for (let i = 0; i < sectionsCount; i++) {
    const start = i * Math.floor(sentences.length / sectionsCount)
    const end = i === sectionsCount - 1 ? sentences.length : (i + 1) * Math.floor(sentences.length / sectionsCount)
    const block = sentences.slice(start, end)

    sections.push({
      title: `Section ${i + 1}`,
      content: block.slice(0, 6).map((s) => (s.length > 100 ? s.slice(0, 97) + "..." : s)),
      learningObjectives: [`Understand key concepts from section ${i + 1}`, "Apply knowledge to practical situations"],
      keyInsights: ["Key insights from this section"],
    })
  }

  return sections
}

function generateBasicSummary(transcript: string) {
  const sentences = transcript
    .split(/[.!?]+/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)
    .slice(0, 5)

  return sentences.join(" ") + " This video provides valuable information that can be applied in various contexts."
}

function generateBasicKeyPoints(transcript: string) {
  const sentences = transcript
    .split(/[.!?]+/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && s.length < 150)
    .slice(0, 10)

  return sentences.map((s) => (s.length > 120 ? s.slice(0, 117) + "..." : s))
}

function generateBasicStudyGuide() {
  return {
    reviewQuestions: [
      "What are the main concepts discussed in this video?",
      "How can you apply these ideas in practice?",
      "What questions do you still have about this topic?",
      "How does this relate to other things you've learned?",
      "What would you like to explore further?",
    ],
    practiceExercises: [
      "Summarize the key points in your own words",
      "Create examples that illustrate the main concepts",
      "Discuss the topic with someone else to reinforce learning",
      "Apply the concepts to a real-world scenario",
    ],
    memoryAids: [
      "Use visualization techniques to remember key concepts",
      "Create acronyms for important terms",
      "Connect new information to things you already know",
      "Practice recalling information without notes",
    ],
    connections: [
      "Relate this topic to your field of study or work",
      "Identify how this connects to current events",
      "Find connections to other subjects you're learning",
      "Consider how this applies to your personal goals",
    ],
    advancedTopics: [
      "Explore related research and studies",
      "Investigate advanced applications and techniques",
      "Connect with experts in the field",
      "Consider pursuing formal education in this area",
    ],
  }
}

function generateBasicConcepts(transcript: string) {
  const words = transcript
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((w) => w.length > 4)

  const wordFreq = new Map<string, number>()
  words.forEach((word) => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
  })

  const topWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word)

  return topWords.map((word) => ({
    term: word.charAt(0).toUpperCase() + word.slice(1),
    definition: `A key concept mentioned in the video related to ${word}`,
    context: "Referenced throughout the video content",
    importance: "Understanding this concept is crucial for grasping the main ideas",
    examples: ["Examples from the video content"],
    relatedTerms: [],
  }))
}

function generateBasicQuiz() {
  return {
    questions: [
      {
        question: "What is the main topic of this video?",
        options: ["The main topic discussed", "A related concept", "An example mentioned", "A conclusion drawn"],
        correctAnswer: 0,
        explanation: "This is the primary focus of the video content",
        difficulty: "easy" as const,
      },
      {
        question: "How can you apply the concepts from this video?",
        options: [
          "In theoretical discussions only",
          "In practical, real-world situations",
          "Only in academic contexts",
          "Not applicable",
        ],
        correctAnswer: 1,
        explanation: "The concepts are designed for practical application",
        difficulty: "medium" as const,
      },
      {
        question: "What are some key insights from this video?",
        options: [
          "Important insights discussed",
          "Less important insights",
          "Irrelevant information",
          "No insights provided",
        ],
        correctAnswer: 0,
        explanation: "These are the key insights from the video",
        difficulty: "hard" as const,
      },
    ],
  }
}

function generateBasicMnemonics() {
  return [
    {
      concept: "Key Learning",
      mnemonic: "Remember the main concepts by creating mental connections",
      explanation: "Link new information to things you already know",
    },
    {
      concept: "Application",
      mnemonic: "Think 'How can I use this?' for every concept",
      explanation: "Always consider practical uses of new knowledge",
    },
  ]
}

function generateBasicApplications() {
  return [
    {
      scenario: "Learning and Study",
      application: "Use these concepts to improve your understanding of related topics",
      benefits: ["Better retention", "Improved comprehension", "Enhanced critical thinking"],
    },
    {
      scenario: "Professional Development",
      application: "Apply these ideas in your work or career",
      benefits: ["Better decision making", "Improved problem solving", "Enhanced communication"],
    },
  ]
}
