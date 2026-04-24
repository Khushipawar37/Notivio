import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { listConceptMetrics, logTutorEvent } from "@/server/tutor";

const bodySchema = z.object({
  conceptId: z.string().optional(),
  recentAttempts: z.array(z.record(z.unknown())).optional(),
});

function buildDiagnosis(args: {
  conceptId: string;
  attempts: number;
  correct: number;
  confusions: string[];
  wrongExamples: string[];
}) {
  const rate = args.attempts > 0 ? args.correct / args.attempts : 0;
  const confusion = args.confusions[0] ?? "core mechanism mapping";
  if (args.attempts === 0) {
    return {
      rootCause: `Root cause: insufficient observed attempts for ${args.conceptId}; diagnosis is provisional.`,
      remediation: [
        "Do 3 quick retrieval attempts without notes.",
        "Submit one worked example and one non-example.",
        "Request re-diagnosis after the attempts.",
      ],
      confidence: 0.35,
    };
  }
  if (rate < 0.5) {
    return {
      rootCause: `Root cause: repeated confusion around ${confusion} within ${args.conceptId}.`,
      remediation: [
        "Practice cause -> mechanism -> result summaries for this concept.",
        "Use two contrast pairs: correct case vs non-case.",
        "Explain back in one sentence after each attempt.",
      ],
      confidence: 0.78,
    };
  }
  return {
    rootCause: `Root cause: intermittent retrieval slips in ${args.conceptId}, not a full conceptual gap.`,
    remediation: [
      "Run spaced retrieval: 2 minutes now, 2 minutes later.",
      "Tighten definitions to <=10 words per key term.",
      "Check one application question per session.",
    ],
    confidence: 0.67,
  };
}

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = bodySchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const conceptId = (body.data.conceptId ?? "").trim();
  const metrics = await listConceptMetrics(user.id, 60);
  const metric =
    metrics.find((item) => item.conceptId === conceptId) ??
    metrics[0] ?? {
      conceptId: conceptId || "general_concept",
      attempts: 0,
      correct: 0,
      confusions: [],
      lastWrongExamples: [],
    };

  const result = buildDiagnosis({
    conceptId: metric.conceptId,
    attempts: metric.attempts,
    correct: metric.correct,
    confusions: metric.confusions,
    wrongExamples: metric.lastWrongExamples,
  });

  await logTutorEvent({
    userId: user.id,
    actor: "tutor",
    type: "diagnosis",
    payload: {
      conceptId: metric.conceptId,
      attempts: metric.attempts,
      correct: metric.correct,
      confusions: metric.confusions,
      recentAttempts: body.data.recentAttempts ?? [],
    },
    reasoningSummary: result.rootCause,
    confidence: result.confidence,
    suggestedNextSteps: result.remediation,
  });

  return NextResponse.json({
    rootCause: result.rootCause,
    remediation: result.remediation,
    confidence: result.confidence,
  });
}
