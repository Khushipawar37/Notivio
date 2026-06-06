import { z } from "zod";

export const ReviewQuestionSchema = z.object({
  question: z.string().min(8),
  answer: z.string().min(8),
});

export const PracticeExerciseSchema = z.object({
  prompt: z.string().min(8),
  solution: z.string().optional().default(""),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
});

export const MnemonicSchema = z.object({
  topic: z.string().min(2),
  text: z.string().min(4),
  type: z
    .enum(["acronym", "story", "chunking", "rhythm", "visual"])
    .optional()
    .default("acronym"),
});

export const ConceptSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(6),
  example: z.string().optional().default(""),
});

export const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  // Prefer content + bullets, but allow either to be present
  content: z.string().optional().default(""),
  bullets: z.array(z.string()).optional().default([]),
});

export const StudyGuideSchema = z.object({
  reviewQuestions: z.array(ReviewQuestionSchema).max(20).default([]),
  practiceExercises: z.array(PracticeExerciseSchema).max(20).default([]),
  mnemonics: z.array(MnemonicSchema).max(20).default([]),
  connections: z.array(z.string()).max(20).default([]), // cross-topic links, real-life tie-ins
});

export const NotesSchema = z.object({
  title: z.string().optional().default("Video Notes"),
  summary: z.object({
    short: z.string().min(20).max(120), // concise, ≤ ~120 words
    detailed: z.string().min(100), // rich longform
  }),
  keyPoints: z.array(z.string()).min(6).max(16),
  concepts: z.array(ConceptSchema).min(6).max(24),
  studyGuide: StudyGuideSchema,
  sections: z.array(SectionSchema).min(5).max(24),
});

export type ReviewQuestion = z.infer<typeof ReviewQuestionSchema>;
export type PracticeExercise = z.infer<typeof PracticeExerciseSchema>;
export type Mnemonic = z.infer<typeof MnemonicSchema>;
export type Concept = z.infer<typeof ConceptSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type StudyGuide = z.infer<typeof StudyGuideSchema>;
export type NotesResponse = z.infer<typeof NotesSchema>;
