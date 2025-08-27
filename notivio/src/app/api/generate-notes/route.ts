import { type NextRequest, NextResponse } from "next/server"

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
    const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 20)
    const paragraphs = transcript.split(/\n\s*\n/).filter((p) => p.trim().length > 50)

    // Use paragraphs if available, otherwise create logical breaks
    const textBlocks = paragraphs.length > 3 ? paragraphs : createLogicalBreaks(sentences)

    const sectionsCount = Math.min(Math.max(textBlocks.length, 6), 10)
    const sections = []

    for (let i = 0; i < sectionsCount; i++) {
      const blockIndex = Math.floor((i / sectionsCount) * textBlocks.length)
      const currentBlock = textBlocks[blockIndex] || textBlocks[textBlocks.length - 1]

      // Extract key themes and create meaningful titles
      const title = generateSectionTitle(currentBlock, i + 1)
      const content = generateSectionContent(currentBlock)
      const learningObjectives = generateLearningObjectives(currentBlock, title)

      sections.push({
        title,
        content,
        learningObjectives,
      })
    }

    return sections
  } catch (error) {
    console.error("Error generating sections:", error)
    return generateBasicSections(transcript)
  }
}

async function generateDetailedSummary(transcript: string) {
  try {
    const words = transcript.split(/\s+/).filter((w) => w.length > 2)
    const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 20)

    // Extract key themes and topics
    const keyTerms = extractKeyTerms(words)
    const mainTopics = identifyMainTopics(sentences, keyTerms)

    let summary = ""

    // Main Topic & Context
    summary += `**Main Topic & Context**\n\n`
    summary += `This video explores ${mainTopics[0] || "important concepts"} and provides valuable insights into ${mainTopics[1] || "the subject matter"}. `
    summary += `The content is structured to help viewers understand key principles and their practical applications. `
    summary += `This educational material covers essential topics that are fundamental to mastering the subject.\n\n`

    // Core Content
    summary += `**Core Content**\n\n`
    const contentSections = createContentSections(sentences, keyTerms)
    contentSections.forEach((section, index) => {
      summary += `**${section.heading}**\n`
      summary += `${section.content}\n\n`
    })

    // Key Insights
    summary += `**Key Insights**\n\n`
    summary += `The most important takeaways from this video include understanding ${keyTerms.slice(0, 3).join(", ")} and their interconnected relationships. `
    summary += `These concepts form the foundation for deeper learning and practical application in real-world scenarios.\n\n`

    // Practical Applications
    summary += `**Practical Applications**\n\n`
    summary += `The knowledge presented in this video can be applied in various professional and academic contexts. `
    summary += `Students can use these concepts to solve problems, make informed decisions, and build upon this foundation for advanced learning. `
    summary += `The principles discussed are particularly valuable for those seeking to develop expertise in this field.`

    return summary
  } catch (error) {
    console.error("Error generating summary:", error)
    return "This video provides comprehensive educational content with valuable insights and practical knowledge for student learning and development."
  }
}

async function generateKeyPoints(transcript: string) {
  try {
    const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 30)
    const words = transcript.toLowerCase().split(/\s+/)

    // Find important sentences based on key indicators
    const importantSentences = sentences.filter((sentence) => {
      const lowerSentence = sentence.toLowerCase()
      return (
        lowerSentence.includes("important") ||
        lowerSentence.includes("key") ||
        lowerSentence.includes("essential") ||
        lowerSentence.includes("remember") ||
        lowerSentence.includes("crucial") ||
        lowerSentence.includes("main") ||
        lowerSentence.includes("first") ||
        lowerSentence.includes("second") ||
        lowerSentence.includes("finally") ||
        lowerSentence.includes("therefore") ||
        lowerSentence.includes("because") ||
        lowerSentence.includes("result")
      )
    })

    // Extract key terms and create points around them
    const keyTerms = extractKeyTerms(words)
    const keyPoints = []

    // Add points from important sentences
    importantSentences.slice(0, 4).forEach((sentence) => {
      const cleanSentence = sentence.trim().replace(/^[^a-zA-Z]*/, "")
      if (cleanSentence.length > 50 && cleanSentence.length < 200) {
        keyPoints.push(cleanSentence)
      }
    })

    // Add points based on key terms if we need more
    while (keyPoints.length < 6 && keyTerms.length > 0) {
      const term = keyTerms.shift()
      const relatedSentence = sentences.find(
        (s) =>
          s.toLowerCase().includes(term.toLowerCase()) &&
          s.length > 50 &&
          s.length < 200 &&
          !keyPoints.some((kp) => kp.toLowerCase().includes(term.toLowerCase())),
      )

      if (relatedSentence) {
        keyPoints.push(relatedSentence.trim().replace(/^[^a-zA-Z]*/, ""))
      }
    }

    // Ensure we have at least 6 points
    while (keyPoints.length < 6) {
      const randomSentence = sentences[Math.floor(Math.random() * sentences.length)]
      if (randomSentence && randomSentence.length > 50 && randomSentence.length < 200) {
        const cleanSentence = randomSentence.trim().replace(/^[^a-zA-Z]*/, "")
        if (!keyPoints.includes(cleanSentence)) {
          keyPoints.push(cleanSentence)
        }
      }
    }

    return keyPoints.slice(0, 8)
  } catch (error) {
    console.error("Error generating key points:", error)
    return [
      "Understanding the fundamental concepts presented in this educational content",
      "Learning practical applications and real-world implementations of key ideas",
      "Developing critical thinking skills through comprehensive analysis",
      "Building foundational knowledge for advanced learning and problem-solving",
      "Connecting theoretical concepts with practical examples and case studies",
      "Mastering essential principles that form the basis of the subject matter",
    ]
  }
}

async function generateStudyGuide(transcript: string) {
  try {
    const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 20)
    const keyTerms = extractKeyTerms(transcript.split(/\s+/))
    const topics = identifyMainTopics(sentences, keyTerms)

    const studyGuide = {
      reviewQuestions: [
        `What are the main principles of ${topics[0] || "the subject"} as discussed in this video?`,
        `How do the concepts of ${keyTerms[0] || "key topics"} and ${keyTerms[1] || "related ideas"} work together?`,
        `Why is understanding ${topics[1] || "these concepts"} important for practical application?`,
        `What examples were provided to illustrate the main points, and how do they support the theory?`,
        `How would you apply these concepts to solve a real-world problem in this field?`,
        `What are the potential challenges or limitations of the approaches discussed?`,
        `How do these ideas connect to other concepts you've learned in related subjects?`,
      ],
      practiceExercises: [
        `Create a mind map connecting all the key concepts discussed in the video, showing their relationships and dependencies.`,
        `Write a one-page explanation of the main topic as if teaching it to someone with no prior knowledge of the subject.`,
        `Develop three real-world scenarios where you could apply the principles learned, including potential challenges and solutions.`,
        `Compare and contrast the different approaches or methods mentioned in the video, analyzing their strengths and weaknesses.`,
      ],
      memoryAids: [
        `Use the acronym method to remember the key steps or principles in the order they were presented.`,
        `Create visual associations between new concepts and familiar objects or experiences from your daily life.`,
        `Develop a story or narrative that connects all the main points in a logical, memorable sequence.`,
        `Use the "teach-back" method: explain each concept aloud as if teaching a friend, identifying areas that need more review.`,
      ],
      connections: [
        `These concepts relate directly to problem-solving methodologies used in business, engineering, and scientific research.`,
        `The principles discussed connect to broader themes in education, psychology, and human development studies.`,
        `This knowledge forms a foundation for advanced topics in the field and interdisciplinary applications.`,
      ],
    }

    return studyGuide
  } catch (error) {
    console.error("Error generating study guide:", error)
    return {
      reviewQuestions: [
        "What are the main concepts discussed in this video?",
        "How do these ideas apply to real-world situations?",
        "What examples were used to illustrate key points?",
        "Why are these concepts important to understand?",
        "How do the different topics connect to each other?",
        "What practical applications can you identify?",
      ],
      practiceExercises: [
        "Create a summary of the main points in your own words",
        "Develop examples that illustrate the key concepts",
        "Practice explaining the ideas to someone else",
        "Apply the concepts to a real-world scenario",
      ],
      memoryAids: [
        "Create acronyms for key concepts and processes",
        "Use visual associations to remember important points",
        "Develop stories or analogies that make concepts memorable",
      ],
      connections: [
        "Consider how this topic relates to other subjects you're studying",
        "Think about real-world applications in your field of interest",
        "Connect these ideas to current events or personal experiences",
      ],
    }
  }
}

async function generateKeyConcepts(transcript: string) {
  try {
    const words = transcript.toLowerCase().split(/\s+/)
    const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 20)

    // Extract key terms and their contexts
    const keyTerms = extractKeyTerms(words)
    const concepts = []

    for (const term of keyTerms.slice(0, 8)) {
      // Find sentences that define or explain this term
      const contextSentences = sentences.filter((s) => s.toLowerCase().includes(term.toLowerCase()))

      if (contextSentences.length > 0) {
        const definition = generateDefinition(term, contextSentences)
        const context = contextSentences[0].trim()
        const importance = generateImportance(term, contextSentences)

        concepts.push({
          term: capitalizeWords(term),
          definition,
          context: context.length > 150 ? context.substring(0, 147) + "..." : context,
          importance,
        })
      }
    }

    // Add general concepts if we don't have enough
    while (concepts.length < 4) {
      const generalConcepts = [
        {
          term: "Learning Objectives",
          definition:
            "The specific goals and outcomes that students should achieve after studying this material. These objectives guide the learning process and help measure understanding.",
          context: "Throughout the educational content presentation",
          importance: "Essential for focused learning and assessment of knowledge acquisition",
        },
        {
          term: "Practical Application",
          definition:
            "The real-world use and implementation of theoretical concepts and principles discussed in the video content.",
          context: "Demonstrated through examples and case studies",
          importance: "Bridges the gap between theory and practice, making learning relevant and actionable",
        },
        {
          term: "Critical Thinking",
          definition:
            "The analytical process of evaluating information, questioning assumptions, and drawing logical conclusions based on evidence.",
          context: "Encouraged throughout the learning material",
          importance: "Fundamental skill for academic success and professional development",
        },
      ]

      const conceptToAdd = generalConcepts[concepts.length % generalConcepts.length]
      if (!concepts.some((c) => c.term === conceptToAdd.term)) {
        concepts.push(conceptToAdd)
      }
    }

    return concepts
  } catch (error) {
    console.error("Error generating concepts:", error)
    return [
      {
        term: "Educational Content",
        definition:
          "Structured information designed to teach specific concepts, skills, or knowledge to learners in an organized and accessible format.",
        context: "Presented throughout the video material",
        importance: "Forms the foundation for learning and skill development in the subject area",
      },
    ]
  }
}

// Helper functions for enhanced text processing

function extractKeyTerms(words: string[]): string[] {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "can",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "me",
    "him",
    "her",
    "us",
    "them",
  ])

  const wordFreq = new Map<string, number>()

  words.forEach((word) => {
    const cleanWord = word.replace(/[^\w]/g, "").toLowerCase()
    if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
      wordFreq.set(cleanWord, (wordFreq.get(cleanWord) || 0) + 1)
    }
  })

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word)
}

function identifyMainTopics(sentences: string[], keyTerms: string[]): string[] {
  const topics = []

  // Look for topic indicators
  const topicIndicators = ["about", "discuss", "explain", "learn", "understand", "explore", "focus on", "cover"]

  for (const sentence of sentences.slice(0, 10)) {
    for (const indicator of topicIndicators) {
      if (sentence.toLowerCase().includes(indicator)) {
        const words = sentence.split(/\s+/)
        const indicatorIndex = words.findIndex((w) => w.toLowerCase().includes(indicator))
        if (indicatorIndex >= 0 && indicatorIndex < words.length - 2) {
          const topicPhrase = words.slice(indicatorIndex + 1, indicatorIndex + 4).join(" ")
          topics.push(topicPhrase.replace(/[^\w\s]/g, "").trim())
        }
      }
    }
  }

  // Add key terms as topics if we don't have enough
  while (topics.length < 3 && keyTerms.length > topics.length) {
    topics.push(keyTerms[topics.length])
  }

  return topics.slice(0, 5)
}

function createLogicalBreaks(sentences: string[]): string[] {
  const blocks = []
  const blockSize = Math.max(Math.floor(sentences.length / 8), 3)

  for (let i = 0; i < sentences.length; i += blockSize) {
    const block = sentences.slice(i, i + blockSize).join(". ")
    if (block.trim().length > 100) {
      blocks.push(block)
    }
  }

  return blocks
}

function generateSectionTitle(content: string, sectionNumber: number): string {
  const words = content.split(/\s+/).slice(0, 20)
  const keyWords = words.filter(
    (w) =>
      w.length > 4 &&
      !["this", "that", "with", "from", "they", "have", "been", "will", "would", "could", "should"].includes(
        w.toLowerCase(),
      ),
  )

  if (keyWords.length >= 2) {
    return `${capitalizeWords(keyWords[0])} and ${capitalizeWords(keyWords[1])}`
  } else if (keyWords.length === 1) {
    return `Understanding ${capitalizeWords(keyWords[0])}`
  } else {
    return `Learning Section ${sectionNumber}`
  }
}

function generateSectionContent(content: string): string[] {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 30)
  const contentPoints = []

  // Take key sentences and enhance them
  for (let i = 0; i < Math.min(sentences.length, 5); i++) {
    let sentence = sentences[i].trim()
    if (sentence.length > 20) {
      // Clean up the sentence
      sentence = sentence.replace(/^[^a-zA-Z]*/, "").trim()
      if (sentence.length > 200) {
        sentence = sentence.substring(0, 197) + "..."
      }
      contentPoints.push(sentence)
    }
  }

  // Ensure we have at least 3 content points
  while (contentPoints.length < 3) {
    contentPoints.push(
      `Important concept ${contentPoints.length + 1} from this section provides valuable learning insights.`,
    )
  }

  return contentPoints.slice(0, 6)
}

function generateLearningObjectives(content: string, title: string): string[] {
  return [
    `Understand the key concepts related to ${title.toLowerCase()}`,
    `Apply the principles discussed in practical scenarios`,
    `Analyze the relationships between different ideas presented`,
  ]
}

function createContentSections(sentences: string[], keyTerms: string[]): Array<{ heading: string; content: string }> {
  const sections = []
  const sectionSize = Math.max(Math.floor(sentences.length / 4), 2)

  for (let i = 0; i < 4; i++) {
    const startIdx = i * sectionSize
    const endIdx = Math.min((i + 1) * sectionSize, sentences.length)
    const sectionSentences = sentences.slice(startIdx, endIdx)

    const heading = keyTerms[i] ? capitalizeWords(keyTerms[i]) : `Key Concept ${i + 1}`
    const content = sectionSentences.slice(0, 3).join(". ") + "."

    sections.push({ heading, content })
  }

  return sections
}

function generateDefinition(term: string, contextSentences: string[]): string {
  const relevantSentence =
    contextSentences.find(
      (s) =>
        s.toLowerCase().includes("is") || s.toLowerCase().includes("means") || s.toLowerCase().includes("refers to"),
    ) || contextSentences[0]

  return `${capitalizeWords(term)} refers to the concepts and principles discussed in the educational content. This term encompasses the key ideas that are essential for understanding the subject matter and its practical applications.`
}

function generateImportance(term: string, contextSentences: string[]): string {
  return `Understanding ${term} is crucial for mastering the subject matter and applying the concepts in real-world situations.`
}

function capitalizeWords(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

function generateBasicSections(transcript: string) {
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
