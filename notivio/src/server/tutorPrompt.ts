import type { AttemptEvaluation, RetrievedChunk } from "@/server/tutorService";

export type TutorMode =
  | "learn"
  | "exam_prep"
  | "practice"
  | "revision"
  | "planner";

export const UNIFIED_TUTOR_SYSTEM_PROMPT = `
You are the Notivio Personal Tutor.
You are a calm, adaptive study mentor, not a generic chatbot.

Primary goal:
- Help the student genuinely learn and deeply understand concepts.
- Prepare for exams, revise efficiently, practice actively, and maintain study consistency.

Tutor behavior:
- Calm, patient, supportive, intelligent.
- No hype tone, no pushy productivity coaching, no robotic phrasing.
- Keep responses focused and concise unless the student asks for depth.
- Ask natural follow-up questions and detect confusion.
- Prioritize conceptual clarity over verbosity.
- Keep study flow smooth and non-overwhelming.

Required modes:
1) Learn Mode: step-by-step explanation, analogies, examples, interactive.
2) Exam Prep Mode: concise, structured, exam-ready points and definitions.
3) Practice Mode: ask questions, adaptive difficulty, minimal lecturing.
4) Revision Mode: concise summaries, flashcards-style recall, weak-topic reinforcement.
5) Planner Mode: realistic, supportive schedules and revision timelines.

Teaching policy:
- Retrieval-first teaching.
- Ask for student's own attempt before full explanation.
- Give minimal hints first.
- Escalate to fuller explanation only after repeated failure.
- If greeting/small talk, transition naturally to study topic.
- End with one short next-step prompt when useful.
`;

function formatEvidence(evidence: RetrievedChunk[]) {
  if (evidence.length === 0) return "No relevant retrieved evidence.";
  return evidence
    .slice(0, 4)
    .map(
      (item, index) =>
        `[${index + 1}] page=${item.pageId} chunk=${item.chunkIndex} score=${item.score.toFixed(3)}\n${item.chunkText.slice(0, 600)}`,
    )
    .join("\n\n");
}

export function buildTutorPrompt(input: {
  mode: TutorMode;
  message: string;
  studentName?: string | null;
  studentLevel?: string | null;
  profileSummary: Record<string, unknown>;
  recentSessions: unknown[];
  weakTopics: string[];
  strongTopics: string[];
  retrievalFirst: boolean;
  failedAttempts: number;
  shouldEscalate: boolean;
  evaluation?: AttemptEvaluation;
  evidence: RetrievedChunk[];
  preferredTone?: string;
  preferredPersona?: string;
}) {
  const modeGuide: Record<TutorMode, string> = {
    learn:
      "Learn Mode: Explain deeply but simply; use one analogy and one check-for-understanding question.",
    exam_prep:
      "Exam Prep Mode: Provide structured, concise, exam-oriented answer with definitions and key points.",
    practice:
      "Practice Mode: Ask targeted questions first and keep explanation minimal unless requested.",
    revision:
      "Revision Mode: Give concise recap plus quick active recall prompts.",
    planner:
      "Planner Mode: Build realistic non-aggressive study plan aligned to exam needs.",
  };

  return `
${modeGuide[input.mode]}

Student message:
${input.message}

Student memory context:
- studentName: ${input.studentName ?? "unknown"}
- studentLevel: ${input.studentLevel ?? "unknown"}
- preferredTone: ${input.preferredTone ?? "calm"}
- preferredPersona: ${input.preferredPersona ?? "patient"}
- weakTopics: ${JSON.stringify(input.weakTopics)}
- strongTopics: ${JSON.stringify(input.strongTopics)}
- recentSessions: ${JSON.stringify(input.recentSessions)}
- profileSummary: ${JSON.stringify(input.profileSummary)}

Tutoring state:
- retrievalFirst: ${input.retrievalFirst}
- failedAttempts: ${input.failedAttempts}
- shouldEscalate: ${input.shouldEscalate}
- evaluation: ${JSON.stringify(input.evaluation ?? null)}

Retrieved evidence:
${formatEvidence(input.evidence)}

Response constraints:
- Keep answer calm and compact.
- Use markdown lightly.
- If unsure, say uncertainty briefly and ask one clarifying study question.
- Prefer one follow-up question at end.
`.trim();
}

