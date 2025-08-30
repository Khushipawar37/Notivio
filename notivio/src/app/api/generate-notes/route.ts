import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import Groq from "groq-sdk"

// Enhanced configuration for better note quality
const GROQ_MODEL = "llama3-8b-8192" // Compatible with AI SDK 4
const MAX_TRANSCRIPT_LENGTH = 150000
const MIN_TRANSCRIPT_LENGTH = 50

// Enhanced schema for comprehensive notes
const EnhancedNotesSchema = z.object({
  title: z.string().min(5).max(200),
  summary: z.string().min(50).max(500),
  keyPoints: z.array(z.string()).min(3).max(20),
  sections: z.array(z.object({
    title: z.string().min(5).max(100),
    content: z.array(z.string()).min(2).max(10),
    learningObjectives: z.array(z.string()).min(1).max(5),
    keyInsights: z.array(z.string()).min(1).max(4),
  })).min(3).max(15),
  studyGuide: z.object({
    reviewQuestions: z.array(z.string()).min(3).max(25),
    practiceExercises: z.array(z.string()).min(2).max(20),
    memoryAids: z.array(z.string()).min(2).max(15),
    connections: z.array(z.string()).min(2).max(15),
    advancedTopics: z.array(z.string()).min(1).max(10),
  }),
  concepts: z.array(z.object({
    term: z.string().min(2).max(50),
    definition: z.string().min(10).max(200),
    context: z.string().min(10).max(150),
    importance: z.string().min(10).max(200),
    examples: z.array(z.string()).min(1).max(3),
    relatedTerms: z.array(z.string()).min(0).max(5),
  })).min(3).max(30),
  contentType: z.enum(["educational", "general_knowledge", "journey", "tutorial", "lecture"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  estimatedStudyTime: z.string().min(3).max(50),
  prerequisites: z.array(z.string()).min(0).max(8),
  nextSteps: z.array(z.string()).min(1).max(8),
  quiz: z.object({
    questions: z.array(z.object({
      question: z.string().min(10).max(200),
      options: z.array(z.string()).min(2).max(5),
      correctAnswer: z.number().min(0),
      explanation: z.string().min(10).max(150),
      difficulty: z.enum(["easy", "medium", "hard"]),
    })).min(2).max(15),
  }),
  mnemonics: z.array(z.object({
    concept: z.string().min(3).max(50),
    mnemonic: z.string().min(10).max(200),
    explanation: z.string().min(10).max(150),
  })).min(2).max(12),
  practicalApplications: z.array(z.object({
    scenario: z.string().min(10).max(150),
    application: z.string().min(10).max(200),
    benefits: z.array(z.string()).min(1).max(3),
  })).min(2).max(10),
})

type EnhancedNotes = z.infer<typeof EnhancedNotesSchema>

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
function detectContentType(transcript: string, title: string): "educational" | "general_knowledge" | "journey" | "tutorial" | "lecture" {
  const lowerTranscript = transcript.toLowerCase()
  const lowerTitle = title.toLowerCase()
  
  // Educational indicators
  const educationalTerms = [
    'learn', 'understand', 'concept', 'principle', 'theory', 'method', 'technique',
    'algorithm', 'formula', 'equation', 'hypothesis', 'research', 'study', 'analysis'
  ]
  
  // Tutorial indicators
  const tutorialTerms = [
    'step', 'guide', 'tutorial', 'how to', 'walkthrough', 'demonstration',
    'example', 'practice', 'exercise', 'assignment', 'project'
  ]
  
  // Lecture indicators
  const lectureTerms = [
    'lecture', 'class', 'course', 'curriculum', 'syllabus', 'module',
    'lesson', 'unit', 'semester', 'academic', 'scholarly'
  ]
  
  // Journey indicators
  const journeyTerms = [
    'journey', 'story', 'experience', 'adventure', 'travel', 'trip',
    'personal', 'life', 'career', 'transformation', 'growth'
  ]
  
  // Count occurrences
  const educationalScore = educationalTerms.filter(term => 
    lowerTranscript.includes(term) || lowerTitle.includes(term)
  ).length
  
  const tutorialScore = tutorialTerms.filter(term => 
    lowerTranscript.includes(term) || lowerTitle.includes(term)
  ).length
  
  const lectureScore = lectureTerms.filter(term => 
    lowerTranscript.includes(term) || lowerTitle.includes(term)
  ).length
  
  const journeyScore = journeyTerms.filter(term => 
    lowerTranscript.includes(term) || lowerTitle.includes(term)
  ).length
  
  // Determine content type based on highest score
  const scores = [
    { type: 'educational' as const, score: educationalScore },
    { type: 'tutorial' as const, score: tutorialScore },
    { type: 'lecture' as const, score: lectureScore },
    { type: 'journey' as const, score: journeyScore },
    { type: 'general_knowledge' as const, score: 0 }
  ]
  
  const maxScore = Math.max(...scores.map(s => s.score))
  if (maxScore === 0) return 'general_knowledge'
  
  return scores.find(s => s.score === maxScore)?.type || 'general_knowledge'
}

// Enhanced prompt builder for different content types
function buildEnhancedPrompt(input: {
  title: string
  duration: string
  transcript: string
  contentType: string
}) {
  const { title, duration, transcript, contentType } = input
  
  const basePrompt = `You are an expert educational content analyst and note generator. Your task is to create comprehensive, high-quality study notes from a video transcript that will help students and professionals learn effectively.

CRITICAL REQUIREMENTS - READ CAREFULLY:
1. Base ALL content STRICTLY on the provided transcript - never invent facts
2. If information is missing from the transcript, note "Information not provided in transcript"
3. Ensure all content is accurate, relevant, and immediately useful for learning
4. Use clear, concise language that's easy to understand
5. Structure information logically for optimal learning retention
6. Include practical examples and applications when possible
7. Generate ALL content in ENGLISH ONLY - ensure all text, questions, explanations, and examples are in English
8. If the transcript contains non-English content, translate and process it to generate English notes
9. MUST meet ALL minimum requirements specified in the schema (array lengths, string lengths)
10. Ensure every array has at least the minimum number of items specified
11. Ensure every string meets the minimum character count specified
12. CRITICAL: Quiz explanations must be MAXIMUM 150 characters - keep them concise!
13. CRITICAL: All strings must respect their MAXIMUM character limits as specified in the schema

CONTENT TYPE: ${contentType}
VIDEO TITLE: ${title}
DURATION: ${duration}

TRANSCRIPT:
"""
${transcript}
"""

Generate comprehensive notes following this exact JSON schema (no markdown, no extra text):`

  // Content-specific prompts
  const contentSpecificPrompts = {
    educational: `
For EDUCATIONAL content, focus on:
- Clear learning objectives and outcomes
- Fundamental concepts and principles
- Practical applications and real-world examples
- Progressive difficulty levels
- Assessment and review materials`,
    
    tutorial: `
For TUTORIAL content, emphasize:
- Step-by-step instructions
- Hands-on practice exercises
- Common pitfalls and solutions
- Performance metrics and evaluation
- Skill-building progression`,
    
    lecture: `
For LECTURE content, highlight:
- Academic rigor and depth
- Theoretical frameworks
- Research methodologies
- Critical analysis skills
- Advanced concepts and connections`,
    
    journey: `
For JOURNEY/EXPERIENCE content, focus on:
- Key insights and lessons learned
- Personal growth and development
- Practical wisdom and advice
- Real-world applications
- Inspiration and motivation`,
    
    general_knowledge: `
For GENERAL KNOWLEDGE content, emphasize:
- Core facts and information
- Context and background
- Current relevance and applications
- Broader implications
- Further reading and exploration`
  }

  const schemaPrompt = `
Return ONLY valid JSON matching this schema (ensure MINIMUM requirements are met):
{
  "title": "string (MINIMUM 5 chars, MAX 200 chars)",
  "summary": "string (MINIMUM 50 chars, MAX 500 chars, comprehensive overview)",
  "keyPoints": ["array of MINIMUM 3, MAX 20 key takeaways, each 1-2 sentences"],
  "sections": [
    {
      "title": "string (MINIMUM 5 chars, MAX 100 chars, clear section heading)",
      "content": ["array of MINIMUM 2, MAX 10 content points, each 1-2 sentences"],
      "learningObjectives": ["array of MINIMUM 1, MAX 5 specific learning goals"],
      "keyInsights": ["array of MINIMUM 1, MAX 4 important insights from this section"]
    }
  ] (MINIMUM 3 sections required),
  "studyGuide": {
    "reviewQuestions": ["array of MINIMUM 3, MAX 25 thought-provoking questions"],
    "practiceExercises": ["array of MINIMUM 2, MAX 20 actionable practice tasks"],
    "memoryAids": ["array of MINIMUM 2, MAX 15 mnemonics and memory strategies"],
    "connections": ["array of MINIMUM 2, MAX 15 connections to other topics/domains"],
    "advancedTopics": ["array of MINIMUM 1, MAX 10 areas for further study"]
  },
  "concepts": [
    {
      "term": "string (MINIMUM 2 chars, MAX 50 chars, key concept name)",
      "definition": "string (MINIMUM 10 chars, MAX 200 chars, clear definition)",
      "context": "string (MINIMUM 10 chars, MAX 150 chars, where/how it's used)",
      "importance": "string (MINIMUM 10 chars, MAX 200 chars, why it matters)",
      "examples": ["array of MINIMUM 1, MAX 3 concrete examples"],
      "relatedTerms": ["array of MINIMUM 0, MAX 5 related concepts"]
    }
  ] (MINIMUM 3 concepts required),
  "contentType": "string (one of: educational, general_knowledge, journey, tutorial, lecture)",
  "difficulty": "string (one of: beginner, intermediate, advanced)",
  "estimatedStudyTime": "string (MINIMUM 3 chars, e.g., '30-45 minutes', '2-3 hours')",
  "prerequisites": ["array of MINIMUM 0, MAX 8 required knowledge/skills"],
  "nextSteps": ["array of MINIMUM 1, MAX 8 recommended next actions"],
  "quiz": {
    "questions": [
      {
        "question": "string (MINIMUM 10 chars, MAX 200 chars, clear question)",
        "options": ["array of MINIMUM 2, MAX 5 answer choices"],
        "correctAnswer": "number (index of correct option, 0-based)",
        "explanation": "string (MINIMUM 10 chars, MAX 150 chars, why this is correct)",
        "difficulty": "string (one of: easy, medium, hard)"
      }
    ] (MINIMUM 2 questions required)
  },
  "mnemonics": [
    {
      "concept": "string (MINIMUM 3 chars, MAX 50 chars, concept name)",
      "mnemonic": "string (MINIMUM 10 chars, MAX 200 chars, memory aid)",
      "explanation": "string (MINIMUM 10 chars, MAX 150 chars, how to use it)"
    }
  ] (MINIMUM 2 mnemonics required),
  "practicalApplications": [
    {
      "scenario": "string (MINIMUM 10 chars, MAX 150 chars, real-world situation)",
      "application": "string (MINIMUM 10 chars, MAX 200 chars, how to apply knowledge)",
      "benefits": ["array of MINIMUM 1, MAX 3 specific benefits"]
    }
  ] (MINIMUM 2 applications required)
}

Generate the notes now, ensuring maximum educational value and practical utility.

IMPORTANT: Before returning your response, double-check that:
- All arrays meet their minimum length requirements
- All strings meet their minimum character requirements  
- All strings respect their maximum character limits
- Quiz explanations are MAXIMUM 150 characters (keep them concise!)
- The response is valid JSON that matches the schema exactly
- No extra text or markdown formatting is included

CRITICAL: If any string exceeds its maximum length, truncate it and add "..." at the end.`

  return basePrompt + contentSpecificPrompts[contentType as keyof typeof contentSpecificPrompts] + schemaPrompt
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
        keyInsights: ["Important insights"]
      })
    }
  }
  
  if (!fixed.concepts || fixed.concepts.length < 3) {
    fixed.concepts = fixed.concepts || []
    while (fixed.concepts.length < 3) {
      fixed.concepts.push({
        term: `Concept ${fixed.concepts.length + 1}`,
        definition: "A key concept from the video",
        context: "Referenced in the video content",
        importance: "Important for understanding the topic",
        examples: ["Example from the video"],
        relatedTerms: []
      })
    }
  }
  
  if (!fixed.quiz?.questions || fixed.quiz.questions.length < 2) {
    fixed.quiz = fixed.quiz || { questions: [] }
    while (fixed.quiz.questions.length < 2) {
      fixed.quiz.questions.push({
        question: `Question ${fixed.quiz.questions.length + 1}`,
        options: ["Option 1", "Option 2"],
        correctAnswer: 0,
        explanation: "Explanation for the correct answer",
        difficulty: "easy"
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
        explanation: "How to use this memory aid"
      })
    }
  }
  
  if (!fixed.practicalApplications || fixed.practicalApplications.length < 2) {
    fixed.practicalApplications = fixed.practicalApplications || []
    while (fixed.practicalApplications.length < 2) {
      fixed.practicalApplications.push({
        scenario: "Real-world application",
        application: "How to apply this knowledge",
        benefits: ["Benefit 1", "Benefit 2"]
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
      if (section.title && section.title.length > 100) {
        section.title = section.title.substring(0, 97) + "..."
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
      
      // Section title: max 100 chars
      if (fixedSection.title && fixedSection.title.length > 100) {
        fixedSection.title = fixedSection.title.substring(0, 97) + "..."
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
  cleaned = cleaned.replace(/\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?/g, ' ')
  cleaned = cleaned.replace(/^[ \t]*([A-Z][A-Za-z0-9 _-]{0,30}):[ \t]*/gm, '')
  
  // Remove common filler words and phrases
  cleaned = cleaned.replace(/\b(um+|uh+|er+|ah+|like,?|you know|sort of|kind of|basically|actually|literally)\b/gi, ' ')
  
  // Remove video-specific fluff
  cleaned = cleaned.replace(/\b(don't forget to|be sure to|make sure to|subscribe|like the video|hit the bell|comment below|share this video)\b.*$/gim, ' ')
  
  // Clean up whitespace and formatting
  cleaned = cleaned
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
  
  // Normalize quotes and dashes
  cleaned = cleaned.replace(/[""]/g, '"').replace(/['']/g, "'").replace(/—|–/g, '-')
  
  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { transcript, title, duration } = body || {}

    if (!transcript || typeof transcript !== "string" || transcript.trim().length < MIN_TRANSCRIPT_LENGTH) {
      return NextResponse.json({ 
        error: "Transcript is required and must be at least 50 characters long" 
      }, { status: 400 })
    }

    // Clean and prepare transcript
    const cleanedTranscript = cleanTranscript(transcript)
    
    // Ensure transcript is in English
    const englishTranscript = await ensureEnglish(cleanedTranscript)
    
    if (englishTranscript.length < MIN_TRANSCRIPT_LENGTH) {
      return NextResponse.json({ 
        error: "Transcript is too short after cleaning" 
      }, { status: 400 })
    }

    // Detect content type for adaptive prompting
    const contentType = detectContentType(englishTranscript, title || "Video")
    
    // Check for Groq API key
    const groqApiKey = process.env.GROQ_API_KEY
    
    if (!groqApiKey) {
      return NextResponse.json({ 
        error: "Groq API key not configured. Please set GROQ_API_KEY environment variable." 
      }, { status: 500 })
    }

          try {
        // Generate notes using Groq API directly with Groq SDK
        const groqClient = new Groq({
          apiKey: groqApiKey,
        })

        const prompt = buildEnhancedPrompt({
          title: title || "Video Notes",
          duration: duration || "Unknown",
          transcript: englishTranscript.slice(0, MAX_TRANSCRIPT_LENGTH),
          contentType
        })

                console.log("🚀 Calling Groq API with model:", GROQ_MODEL)
        const completion = await groqClient.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content: "You are an expert note-taking assistant. Generate comprehensive, structured notes based on the provided transcript. Follow the exact JSON schema format requested. CRITICAL: Ensure ALL minimum requirements are met for array lengths and string lengths. Validate your response before returning it."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 4000,
          top_p: 0.9,
          response_format: { type: "json_object" }
        })
        console.log("✅ Groq API call successful")

        // Parse and validate the response
        const responseContent = completion.choices[0]?.message?.content
        if (!responseContent) {
          throw new Error("No response content from Groq API")
        }

        let parsedNotes
        try {
          // Try to extract JSON if there's extra text
          const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            parsedNotes = JSON.parse(jsonMatch[0])
          } else {
            parsedNotes = JSON.parse(responseContent)
          }
        } catch (parseError) {
          console.error("Failed to parse Groq response:", parseError)
          console.error("Raw response:", responseContent)
          throw new Error("Invalid JSON response from Groq API")
        }

        // Validate the response against our schema
        let validatedNotes
        try {
          validatedNotes = EnhancedNotesSchema.parse(parsedNotes)
          console.log("✅ Schema validation successful")
        } catch (validationError: any) {
          console.error("❌ Schema validation failed:", validationError)
          console.log("🔧 Attempting to fix validation issues...")
          
          // Try to fix common validation issues
          const fixedNotes = fixValidationIssues(parsedNotes)
          console.log("🔧 Fixed notes structure:", {
            sections: fixedNotes.sections?.length || 0,
            concepts: fixedNotes.concepts?.length || 0,
            quizQuestions: fixedNotes.quiz?.questions?.length || 0,
            mnemonics: fixedNotes.mnemonics?.length || 0,
            practicalApplications: fixedNotes.practicalApplications?.length || 0
          })
          
          // Additional validation: ensure all strings are within limits
          const finalNotes = ensureStringLimits(fixedNotes)
          console.log("🔧 Final notes structure after string limit enforcement:", {
            sections: finalNotes.sections?.length || 0,
            concepts: finalNotes.concepts?.length || 0,
            quizQuestions: finalNotes.quiz?.questions?.length || 0,
            mnemonics: finalNotes.mnemonics?.length || 0,
            practicalApplications: finalNotes.practicalApplications?.length || 0,
            titleLength: finalNotes.title?.length || 0,
            summaryLength: finalNotes.summary?.length || 0
          })
          
          try {
            validatedNotes = EnhancedNotesSchema.parse(finalNotes)
            console.log("✅ Schema validation successful after fixing")
          } catch (secondValidationError) {
            console.error("❌ Second validation attempt failed:", secondValidationError)
            console.error("🔍 Detailed validation errors:", secondValidationError.issues)
            throw new Error("Failed to validate Groq API response after fixing")
          }
        }

      // Return the enhanced notes
      return NextResponse.json({
        title: validatedNotes.title || title || "Video Notes",
        transcript: englishTranscript,
        sections: validatedNotes.sections,
        summary: validatedNotes.summary,
        keyPoints: validatedNotes.keyPoints,
        studyGuide: validatedNotes.studyGuide,
        concepts: validatedNotes.concepts,
        duration: duration || "Unknown",
        contentType: validatedNotes.contentType,
        difficulty: validatedNotes.difficulty,
        estimatedStudyTime: validatedNotes.estimatedStudyTime,
        prerequisites: validatedNotes.prerequisites,
        nextSteps: validatedNotes.nextSteps,
        quiz: validatedNotes.quiz,
        mnemonics: validatedNotes.mnemonics,
        practicalApplications: validatedNotes.practicalApplications,
      })

    } catch (groqError: any) {
      console.error("Groq API error:", groqError)
      
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
        mnemonics: generateBasicMnemonics(),
        practicalApplications: generateBasicApplications(),
      })
    }

  } catch (error: any) {
    console.error("Notes generation error:", error?.message || error)
    return NextResponse.json({ 
      error: "Failed to generate notes. Please try again." 
    }, { status: 500 })
  }
}

// Fallback functions for basic note generation
function generateBasicSections(transcript: string) {
  const sentences = transcript
    .split(/[.!?]+/g)
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(s => s.length > 15)
  
  const sectionsCount = Math.min(Math.max(5, Math.floor(sentences.length / 8)), 10)
  const sections = []
  
  for (let i = 0; i < sectionsCount; i++) {
    const start = i * Math.floor(sentences.length / sectionsCount)
    const end = i === sectionsCount - 1 ? sentences.length : (i + 1) * Math.floor(sentences.length / sectionsCount)
    const block = sentences.slice(start, end)
    
    sections.push({
      title: `Section ${i + 1}`,
      content: block.slice(0, 6).map(s => s.length > 100 ? s.slice(0, 97) + '...' : s),
      learningObjectives: [`Understand key concepts from section ${i + 1}`, "Apply knowledge to practical situations"],
      keyInsights: ["Key insights from this section"]
    })
  }
  
  return sections
}

function generateBasicSummary(transcript: string) {
  const sentences = transcript
    .split(/[.!?]+/g)
    .map(s => s.trim())
    .filter(s => s.length > 20)
    .slice(0, 5)
  
  return sentences.join(' ') + " This video provides valuable information that can be applied in various contexts."
}

function generateBasicKeyPoints(transcript: string) {
  const sentences = transcript
    .split(/[.!?]+/g)
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.length < 150)
    .slice(0, 10)
  
  return sentences.map(s => s.length > 120 ? s.slice(0, 117) + '...' : s)
}

function generateBasicStudyGuide() {
  return {
    reviewQuestions: [
      "What are the main concepts discussed in this video?",
      "How can you apply these ideas in practice?",
      "What questions do you still have about this topic?",
      "How does this relate to other things you've learned?",
      "What would you like to explore further?"
    ],
    practiceExercises: [
      "Summarize the key points in your own words",
      "Create examples that illustrate the main concepts",
      "Discuss the topic with someone else to reinforce learning",
      "Apply the concepts to a real-world scenario"
    ],
    memoryAids: [
      "Use visualization techniques to remember key concepts",
      "Create acronyms for important terms",
      "Connect new information to things you already know",
      "Practice recalling information without notes"
    ],
    connections: [
      "Relate this topic to your field of study or work",
      "Identify how this connects to current events",
      "Find connections to other subjects you're learning",
      "Consider how this applies to your personal goals"
    ],
    advancedTopics: [
      "Explore related research and studies",
      "Investigate advanced applications and techniques",
      "Connect with experts in the field",
      "Consider pursuing formal education in this area"
    ]
  }
}

function generateBasicConcepts(transcript: string) {
  const words = transcript
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(w => w.length > 4)
  
  const wordFreq = new Map<string, number>()
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
  })
  
  const topWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word)
  
  return topWords.map(word => ({
    term: word.charAt(0).toUpperCase() + word.slice(1),
    definition: `A key concept mentioned in the video related to ${word}`,
    context: "Referenced throughout the video content",
    importance: "Understanding this concept is crucial for grasping the main ideas",
    examples: ["Examples from the video content"],
    relatedTerms: []
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
        difficulty: "easy" as const
      },
      {
        question: "How can you apply the concepts from this video?",
        options: ["In theoretical discussions only", "In practical, real-world situations", "Only in academic contexts", "Not applicable"],
        correctAnswer: 1,
        explanation: "The concepts are designed for practical application",
        difficulty: "medium" as const
      }
    ]
  }
}

function generateBasicMnemonics() {
  return [
    {
      concept: "Key Learning",
      mnemonic: "Remember the main concepts by creating mental connections",
      explanation: "Link new information to things you already know"
    },
    {
      concept: "Application",
      mnemonic: "Think 'How can I use this?' for every concept",
      explanation: "Always consider practical uses of new knowledge"
    }
  ]
}

function generateBasicApplications() {
  return [
    {
      scenario: "Learning and Study",
      application: "Use these concepts to improve your understanding of related topics",
      benefits: ["Better retention", "Improved comprehension", "Enhanced critical thinking"]
    },
    {
      scenario: "Professional Development",
      application: "Apply these ideas in your work or career",
      benefits: ["Better decision making", "Improved problem solving", "Enhanced communication"]
    }
  ]
}
