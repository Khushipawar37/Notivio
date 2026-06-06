import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/server/auth";
import { PERSONAL_TUTOR_SYSTEM_PROMPT } from "@/app/lib/personal-tutor";
import { listConceptMetrics, logTutorEvent } from "@/server/tutor";
import { callGroqJson } from "@/server/groq-json";

const schema = z.object({
  briefing: z.string(),
  prioritizedTopics: z.array(z.string()).min(2).max(7),
  thirtyMinPlan: z.array(z.string()).min(2).max(6),
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

  let metrics = [] as Awaited<ReturnType<typeof listConceptMetrics>>;
  try {
    metrics = await listConceptMetrics(user.id, 60);
  } catch {
    metrics = [];
  }
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

  let generated;
  try {
    generated = await callGroqJson(
      `${PERSONAL_TUTOR_SYSTEM_PROMPT}
Create a one-paragraph pre-exam briefing with concrete exam-day priorities (no score prediction).
Exam: ${examName}
Exam date: ${examDate || "not provided"}
Weak topics: ${JSON.stringify(weakest)}
Exam schedule context: ${JSON.stringify(body.examSchedule ?? [])}

Return JSON only with this exact shape:
{
  "briefing": "string",
  "prioritizedTopics": ["string", "string"],
  "thirtyMinPlan": ["string", "string"],
  "confidence": 0.0
}
Rules:
- No markdown.
- No extra keys.
- Keep confidence between 0 and 1.
- Use 2-6 items for thirtyMinPlan and 2-7 for prioritizedTopics.`,
      schema,
    );
  } catch (error) {
    const weakTopics = weakest.map((item) => item.conceptId).slice(0, 3);
    generated = {
      briefing: `I couldn't generate a model-backed briefing reliably right now. Based on your current weakest topics (${weakTopics.join(", ") || "general study areas"}), focus on active recall, prioritized review, and short exam-day planning.`,
      prioritizedTopics: weakTopics.length > 0 ? weakTopics : ["review core concepts"],
      thirtyMinPlan: [
        `Spend 10 minutes practicing ${weakTopics[0] ?? "your weakest concept"} with active recall.`,
        "Write one concise summary of the main idea in your own words.",
        "Use the remaining time to test yourself with one quick application question.",
      ],
      confidence: 0.35,
    };

    await logTutorEvent({
      userId: user.id,
      actor: "tutor",
      type: "prompt",
      payload: { examName, examDate, output: generated, error: String(error) },
      reasoningSummary: "Fallback exam briefing generated after model JSON validation failed.",
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
