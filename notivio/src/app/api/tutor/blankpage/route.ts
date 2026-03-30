import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/server/auth";
import { detectTone, formatTutorStylePrefix, PERSONAL_TUTOR_SYSTEM_PROMPT } from "@/app/lib/personal-tutor";
import { getOrCreateTutorProfile, listConceptMetrics, logTutorEvent, updateConceptMetric } from "@/server/tutor";
import { callGroqJson } from "@/server/groq-json";

const schema = z.object({
  promptFrame: z.string(),
  suggestions: z.array(z.string()).min(2).max(4),
  conceptId: z.string(),
  confidence: z.number().min(0).max(1),
  correctness: z.enum(["correct", "partial", "incorrect"]),
  reasoningSummary: z.string(),
  nextSteps: z.array(z.string()).min(1).max(3),
});

function fallbackConceptId(text: string) {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  return words.slice(0, 3).join("_") || "general_concept";
}

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    submission?: string;
    confidence?: number;
    context?: Record<string, unknown>;
    sensitive?: boolean;
  };

  const submission = String(body.submission ?? "").trim();
  if (!submission) {
    return NextResponse.json({ error: "submission is required" }, { status: 400 });
  }

  const [profile, metrics] = await Promise.all([
    getOrCreateTutorProfile(user.id),
    listConceptMetrics(user.id, 25),
  ]);

  const recentCorrectRate =
    metrics.length > 0
      ? metrics.reduce((sum, metric) => sum + (metric.attempts > 0 ? metric.correct / metric.attempts : 0), 0) /
        metrics.length
      : 0.6;

  const tone = detectTone({
    confidence: Number(body.confidence ?? 0.6),
    recentCorrectRate,
    failedAttempts: 0,
  });

  const stylePrefix = formatTutorStylePrefix(
    tone,
    (profile.preferredPersona as "strict" | "patient" | "neutral") ?? "patient"
  );

  let result: z.infer<typeof schema>;

  try {
    const object = await callGroqJson(
      `${PERSONAL_TUTOR_SYSTEM_PROMPT}
${stylePrefix}

Student profile: ${JSON.stringify(profile)}
Concept metrics (recent): ${JSON.stringify(metrics.slice(0, 10))}
Context: ${JSON.stringify(body.context ?? {})}

Blank-page submission:
${submission}

Return tailored promptFrame + suggestions + conceptId + confidence + correctness + reasoningSummary + nextSteps.`,
      schema
    );
    result = object;
  } catch {
    result = {
      promptFrame:
        "Last step: explain the core mechanism in 2-3 sentences from memory before checking notes.",
      suggestions: [
        "Define the core concept in one sentence.",
        "Give one concrete example and one non-example.",
        "State the most common confusion to avoid.",
      ],
      conceptId: fallbackConceptId(submission),
      confidence: 0.52,
      correctness: "partial",
      reasoningSummary: "Partial retrieval with missing mechanism detail.",
      nextSteps: [
        "Do a 3-minute re-explanation without notes.",
        "Attempt two quick application questions.",
      ],
    };
  }

  const isCorrect = result.correctness === "correct";

  await Promise.all([
    updateConceptMetric({
      userId: user.id,
      conceptId: result.conceptId || fallbackConceptId(submission),
      isCorrect,
      wrongExample: !isCorrect ? submission.slice(0, 220) : undefined,
    }),
    logTutorEvent({
      userId: user.id,
      actor: "student",
      type: "attempt",
      payload: { prompt: "blankpage_submission", submission },
      redacted: Boolean(body.sensitive),
    }),
    logTutorEvent({
      userId: user.id,
      actor: "tutor",
      type: "prompt",
      payload: { promptFrame: result.promptFrame, suggestions: result.suggestions },
      reasoningSummary: result.reasoningSummary,
      confidence: result.confidence,
      suggestedNextSteps: result.nextSteps,
      redacted: Boolean(body.sensitive),
    }),
  ]);

  return NextResponse.json({
    promptFrame: result.promptFrame,
    suggestions: result.suggestions,
    conceptUpdates: {
      conceptId: result.conceptId,
      correctness: result.correctness,
      confidence: result.confidence,
    },
    reasoningSummary: result.reasoningSummary,
    nextSteps: result.nextSteps,
    provenance: ["concept-metrics", "blank-page-submission"],
  });
}
