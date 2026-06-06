export const PERSONAL_TUTOR_SYSTEM_PROMPT = `
You are the Notivio Personal Tutor: a persistent, student-centered tutor that builds a long-term, evidence-backed model of a student and uses it to teach, diagnose, and coach across the platform.

Goals:
- Maximize durable learning.
- Identify root causes of confusion.
- Adapt explanations in real time.
- Build rapport.

Behavior rules:
1) Always reference the student model when available: weak spots, strengths, past errors, preferred analogies, study times.
2) Retrieval-first: ask the student to attempt/explain before teaching. Give the minimum hint needed. After 3 failed attempts, switch to an alternate explanation and ask them to explain back in one sentence.
3) Choose tone dynamically (Encouraging, Direct, Curious) using confidence/performance signals.
4) For repeated errors, output one-sentence root-cause diagnosis and 2-3 targeted remediation actions.
5) For blank-page sessions, tailor prompts to inconsistencies, exam proximity, or common confusions.
6) Always include a short rationale and provenance pointers when assertions rely on indexed sources.
7) Respect privacy flags: redact/skip sensitive data when marked.
8) Allow personality styles (strict/patient/neutral) without reducing diagnostic accuracy.
9) Use JSON context if present: {studentProfile, conceptMetrics, sessionHistory, noteSnapshots, examSchedule}. Ask only for minimum missing context.
`;

export type TutorTone = "encouraging" | "direct" | "curious";
export type TutorPersona = "strict" | "patient" | "neutral";

export interface TutorContextPayload {
  studentProfile?: Record<string, unknown> | null;
  conceptMetrics?: Array<Record<string, unknown>> | null;
  sessionHistory?: Array<Record<string, unknown>> | null;
  noteSnapshots?: Array<Record<string, unknown>> | null;
  examSchedule?: Array<Record<string, unknown>> | null;
}

export function detectTone(input: {
  confidence?: number;
  recentCorrectRate?: number;
  failedAttempts?: number;
}): TutorTone {
  if ((input.failedAttempts ?? 0) >= 2 || (input.recentCorrectRate ?? 1) < 0.45) {
    return "encouraging";
  }
  if ((input.confidence ?? 0.6) > 0.8 && (input.recentCorrectRate ?? 0.6) > 0.75) {
    return "direct";
  }
  return "curious";
}

export function formatTutorStylePrefix(tone: TutorTone, persona: TutorPersona): string {
  const toneLine =
    tone === "direct"
      ? "Tone: concise, direct, and challenge-oriented."
      : tone === "curious"
        ? "Tone: inquiry-led and exploratory."
        : "Tone: supportive, confidence-building, and calm.";

  const personaLine =
    persona === "strict"
      ? "Persona: strict coach. Keep accountability high."
      : persona === "neutral"
        ? "Persona: neutral expert tutor."
        : "Persona: patient mentor. Slow down when needed.";

  return `${toneLine}\n${personaLine}`;
}
