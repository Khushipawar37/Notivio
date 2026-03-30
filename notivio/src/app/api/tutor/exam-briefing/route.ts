import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/server/auth";
import { PERSONAL_TUTOR_SYSTEM_PROMPT } from "@/app/lib/personal-tutor";
import { listConceptMetrics, logTutorEvent } from "@/server/tutor";
import { callGroqJson } from "@/server/groq-json";

const schema = z.object({
  briefing: z.string(),
  prioritizedTopics: z.array(z.string()).min(3).max(7),
  thirtyMinPlan: z.array(z.string()).min(3).max(6),
  confidence: z.number().min(0).max(1),
});

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    examName?: string;
    examDate?: string;
    examSchedule?: Array<Record<string, unknown>>;
    sensitive?: boolean;
  };

  const metrics = await listConceptMetrics(user.id, 60);
  const weakest = metrics
    .map((metric) => ({
      conceptId: metric.conceptId,
      correctRate: metric.attempts > 0 ? metric.correct / metric.attempts : 0,
      recency: metric.lastAttempt?.toISOString() ?? null,
    }))
    .sort((a, b) => a.correctRate - b.correctRate)
    .slice(0, 8);

  const examName = String(body.examName ?? "Upcoming exam");
  const examDate = String(body.examDate ?? "");

  const generated = await callGroqJson(
    `${PERSONAL_TUTOR_SYSTEM_PROMPT}
Create a one-paragraph pre-exam briefing with concrete exam-day priorities (no score prediction).
Exam: ${examName}
Exam date: ${examDate || "not provided"}
Weak topics: ${JSON.stringify(weakest)}
Exam schedule context: ${JSON.stringify(body.examSchedule ?? [])}

Also generate a 30-minute actionable plan.`,
    schema
  );

  await logTutorEvent({
    userId: user.id,
    actor: "tutor",
    type: "prompt",
    payload: { examName, examDate, output: generated },
    reasoningSummary: "Compiled exam priorities from concept weakness and recency.",
    confidence: generated.confidence,
    suggestedNextSteps: generated.thirtyMinPlan,
    redacted: Boolean(body.sensitive),
  });

  return NextResponse.json({
    briefing: generated.briefing,
    prioritizedTopics: generated.prioritizedTopics,
    "30minPlan": generated.thirtyMinPlan,
    confidence: generated.confidence,
  });
}
