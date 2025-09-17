export interface ChunkedNoteResult {
  chunkId: string;
  title: string;
  summary: string;
  keyPoints: string[];
  sections: Array<{
    title: string;
    content: string[];
    learningObjectives: string[];
    keyInsights: string[];
  }>;
  concepts: Array<{
    term: string;
    definition: string;
    context: string;
    importance: string;
    examples: string[];
    relatedTerms: string[];
  }>;
  studyGuide: {
    reviewQuestions: string[];
    practiceExercises: string[];
    memoryAids: string[];
    connections: string[];
    advancedTopics: string[];
  };
  quiz: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
      difficulty: string;
    }>;
  };
}

export interface CombinedNotes {
  title: string;
  transcript: string;
  sections: Array<{
    title: string;
    content: string[];
    learningObjectives: string[];
    keyInsights: string[];
  }>;
  summary: string;
  keyPoints: string[];
  duration: string;
  contentType: string;
  difficulty: string;
  estimatedStudyTime: string;
  prerequisites: string[];
  nextSteps: string[];
  studyGuide: {
    reviewQuestions: string[];
    practiceExercises: string[];
    memoryAids: string[];
    connections: string[];
    advancedTopics: string[];
  };
  concepts: Array<{
    term: string;
    definition: string;
    context: string;
    importance: string;
    examples: string[];
    relatedTerms: string[];
  }>;
  quiz: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
      difficulty: string;
    }>;
  };
}

/**
 * Combine multiple chunked note results into a single comprehensive note set
 */
export function combineChunkedNotes(
  chunkedResults: ChunkedNoteResult[],
  originalTranscript: string,
  videoTitle: string,
  duration: string
): CombinedNotes {
  if (chunkedResults.length === 0) {
    throw new Error("No chunked results to combine");
  }

  if (chunkedResults.length === 1) {
    // Single chunk - return as is with additional metadata
    const result = chunkedResults[0];
    return {
      title: videoTitle || result.title,
      transcript: originalTranscript,
      sections: result.sections,
      summary: result.summary,
      keyPoints: result.keyPoints,
      duration,
      contentType: "educational",
      difficulty: "intermediate",
      estimatedStudyTime: estimateStudyTime(originalTranscript.length),
      prerequisites: [],
      nextSteps: ["Review key concepts", "Practice with examples"],
      studyGuide: result.studyGuide,
      concepts: result.concepts,
      quiz: result.quiz,
    };
  }

  // Multiple chunks - intelligent combination
  return {
    title: videoTitle || combineTitle(chunkedResults),
    transcript: originalTranscript,
    sections: combineSections(chunkedResults),
    summary: combineSummaries(chunkedResults),
    keyPoints: combineKeyPoints(chunkedResults),
    duration,
    contentType: "educational",
    difficulty: determineDifficulty(chunkedResults),
    estimatedStudyTime: estimateStudyTime(originalTranscript.length),
    prerequisites: combinePrerequisites(chunkedResults),
    nextSteps: combineNextSteps(chunkedResults),
    studyGuide: combineStudyGuides(chunkedResults),
    concepts: combineConcepts(chunkedResults),
    quiz: combineQuizzes(chunkedResults),
  };
}

/**
 * Combine titles from multiple chunks
 */
function combineTitle(results: ChunkedNoteResult[]): string {
  // Use the first non-generic title, or create a comprehensive one
  const titles = results
    .map((r) => r.title)
    .filter((t) => !t.includes("Video Notes") && !t.includes("Section"));

  if (titles.length > 0) {
    return titles[0];
  }

  return "Comprehensive Video Notes";
}

/**
 * Intelligently combine sections from multiple chunks
 */
function combineSections(
  results: ChunkedNoteResult[]
): CombinedNotes["sections"] {
  const allSections: CombinedNotes["sections"] = [];
  const sectionTitleMap = new Map<string, number>();

  results.forEach((result, chunkIndex) => {
    if (result.sections && Array.isArray(result.sections)) {
      result.sections.forEach((section) => {
        const normalizedTitle = section.title.toLowerCase().trim();

        // Check if we already have a similar section
        const existingIndex = sectionTitleMap.get(normalizedTitle);

        if (existingIndex !== undefined) {
          // Merge with existing section
          const existing = allSections[existingIndex];
          existing.content = [...existing.content, ...(section.content || [])];
          existing.learningObjectives = deduplicateArray([
            ...existing.learningObjectives,
            ...(section.learningObjectives || []),
          ]);
          existing.keyInsights = deduplicateArray([
            ...existing.keyInsights,
            ...(section.keyInsights || []),
          ]);
        } else {
          // Add as new section
          const newSection = {
            title: section.title,
            content: [...(section.content || [])],
            learningObjectives: [...(section.learningObjectives || [])],
            keyInsights: [...(section.keyInsights || [])],
          };

          allSections.push(newSection);
          sectionTitleMap.set(normalizedTitle, allSections.length - 1);
        }
      });
    }
  });

  // Limit to reasonable number of sections and clean up content
  return allSections.slice(0, 12).map((section) => ({
    ...section,
    content: deduplicateArray(section.content).slice(0, 8),
    learningObjectives: deduplicateArray(section.learningObjectives).slice(
      0,
      4
    ),
    keyInsights: deduplicateArray(section.keyInsights).slice(0, 3),
  }));
}

/**
 * Combine summaries from multiple chunks into a coherent overview
 */
function combineSummaries(results: ChunkedNoteResult[]): string {
  const summaries = results
    .map((r) => r.summary)
    .filter((s) => s && s.length > 20);

  if (summaries.length === 0) {
    return "This video covers important topics that provide valuable insights and practical knowledge.";
  }

  if (summaries.length === 1) {
    return summaries[0];
  }

  // Create a comprehensive summary by combining key elements
  const combinedSummary = summaries
    .map((summary) =>
      summary.replace(/^This (video|section|part)/, "The content")
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  // Ensure it's not too long
  if (combinedSummary.length > 450) {
    return combinedSummary.substring(0, 447) + "...";
  }

  return combinedSummary;
}

/**
 * Combine and deduplicate key points
 */
function combineKeyPoints(results: ChunkedNoteResult[]): string[] {
  const allKeyPoints = results.flatMap((r) => r.keyPoints || []);
  const deduplicatedPoints = deduplicateArray(allKeyPoints);

  // Limit to most important points
  return deduplicatedPoints.slice(0, 15);
}

/**
 * Combine study guides from multiple chunks
 */
function combineStudyGuides(
  results: ChunkedNoteResult[]
): CombinedNotes["studyGuide"] {
  const combined = {
    reviewQuestions: [] as string[],
    practiceExercises: [] as string[],
    memoryAids: [] as string[],
    connections: [] as string[],
    advancedTopics: [] as string[],
  };

  results.forEach((result) => {
    if (result.studyGuide) {
      combined.reviewQuestions.push(
        ...(result.studyGuide.reviewQuestions || [])
      );
      combined.practiceExercises.push(
        ...(result.studyGuide.practiceExercises || [])
      );
      combined.memoryAids.push(...(result.studyGuide.memoryAids || []));
      combined.connections.push(...(result.studyGuide.connections || []));
      combined.advancedTopics.push(...(result.studyGuide.advancedTopics || []));
    }
  });

  return {
    reviewQuestions: deduplicateArray(combined.reviewQuestions).slice(0, 20),
    practiceExercises: deduplicateArray(combined.practiceExercises).slice(
      0,
      15
    ),
    memoryAids: deduplicateArray(combined.memoryAids).slice(0, 12),
    connections: deduplicateArray(combined.connections).slice(0, 12),
    advancedTopics: deduplicateArray(combined.advancedTopics).slice(0, 8),
  };
}

/**
 * Combine and deduplicate concepts
 */
function combineConcepts(
  results: ChunkedNoteResult[]
): CombinedNotes["concepts"] {
  const conceptMap = new Map<string, CombinedNotes["concepts"][0]>();

  results.forEach((result) => {
    if (result.concepts && Array.isArray(result.concepts)) {
      result.concepts.forEach((concept) => {
        const key = concept.term.toLowerCase().trim();

        if (conceptMap.has(key)) {
          // Merge with existing concept
          const existing = conceptMap.get(key)!;
          existing.examples = deduplicateArray([
            ...existing.examples,
            ...(concept.examples || []),
          ]);
          existing.relatedTerms = deduplicateArray([
            ...existing.relatedTerms,
            ...(concept.relatedTerms || []),
          ]);

          // Use the longer, more detailed definition
          if (
            concept.definition &&
            concept.definition.length > existing.definition.length
          ) {
            existing.definition = concept.definition;
          }
          if (
            concept.importance &&
            concept.importance.length > existing.importance.length
          ) {
            existing.importance = concept.importance;
          }
        } else {
          conceptMap.set(key, {
            ...concept,
            examples: concept.examples || [],
            relatedTerms: concept.relatedTerms || [],
          });
        }
      });
    }
  });

  return Array.from(conceptMap.values()).slice(0, 25);
}

/**
 * Combine quiz questions from multiple chunks
 */
function combineQuizzes(results: ChunkedNoteResult[]): CombinedNotes["quiz"] {
  const allQuestions = results.flatMap((r) => r.quiz?.questions || []);

  // Remove duplicate questions based on question text
  const questionMap = new Map<string, CombinedNotes["quiz"]["questions"][0]>();

  allQuestions.forEach((question) => {
    const key = question.question.toLowerCase().trim();
    if (!questionMap.has(key)) {
      questionMap.set(key, question);
    }
  });

  const uniqueQuestions = Array.from(questionMap.values());

  // Balance difficulty levels
  const easyQuestions = uniqueQuestions
    .filter((q) => q.difficulty === "easy")
    .slice(0, 4);
  const mediumQuestions = uniqueQuestions
    .filter((q) => q.difficulty === "medium")
    .slice(0, 4);
  const hardQuestions = uniqueQuestions
    .filter((q) => q.difficulty === "hard")
    .slice(0, 2);

  return {
    questions: [...easyQuestions, ...mediumQuestions, ...hardQuestions].slice(
      0,
      10
    ),
  };
}

/**
 * Determine overall difficulty based on chunked results
 */
function determineDifficulty(
  results: ChunkedNoteResult[]
): "beginner" | "intermediate" | "advanced" {
  // Simple heuristic based on content complexity
  const avgConceptsPerChunk =
    results.reduce((sum, r) => sum + (r.concepts?.length || 0), 0) /
    results.length;
  const avgSectionsPerChunk =
    results.reduce((sum, r) => sum + (r.sections?.length || 0), 0) /
    results.length;

  if (avgConceptsPerChunk > 8 || avgSectionsPerChunk > 6) {
    return "advanced";
  } else if (avgConceptsPerChunk > 5 || avgSectionsPerChunk > 4) {
    return "intermediate";
  } else {
    return "beginner";
  }
}

/**
 * Estimate study time based on content length
 */
function estimateStudyTime(transcriptLength: number): string {
  const minutes = Math.max(15, Math.floor(transcriptLength / 1000) * 2);

  if (minutes < 60) {
    return `${minutes}-${minutes + 15} minutes`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}-${hours + 1} hours`;
  }
}

/**
 * Combine prerequisites from multiple chunks
 */
function combinePrerequisites(results: ChunkedNoteResult[]): string[] {
  // For now, return empty array as prerequisites are not in the chunked results
  // This could be enhanced to analyze content complexity and suggest prerequisites
  return [];
}

/**
 * Combine next steps from multiple chunks
 */
function combineNextSteps(results: ChunkedNoteResult[]): string[] {
  const defaultSteps = [
    "Review and summarize key concepts",
    "Practice applying the knowledge",
    "Explore related topics for deeper understanding",
    "Discuss the concepts with peers or mentors",
  ];

  return defaultSteps;
}

/**
 * Remove duplicate items from an array based on string similarity
 */
function deduplicateArray(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  items.forEach((item) => {
    const normalized = item.toLowerCase().trim().replace(/\s+/g, " ");

    // Check for exact matches first
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(item);
      return;
    }

    // Check for similar items (simple similarity check)
    let isDuplicate = false;
    for (const existing of seen) {
      if (calculateSimilarity(normalized, existing) > 0.8) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.add(normalized);
      result.push(item);
    }
  });

  return result;
}

/**
 * Calculate simple string similarity (Jaccard similarity)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));

  const intersection = new Set([...words1].filter((word) => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}
