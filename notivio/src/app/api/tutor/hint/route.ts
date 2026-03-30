import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/server/auth";
import { detectTone, formatTutorStylePrefix, PERSONAL_TUTOR_SYSTEM_PROMPT } from "@/app/lib/personal-tutor";
import { getOrCreateTutorProfile, listConceptMetrics, logTutorEvent } from "@/server/tutor";
import { callGroqJson } from "@/server/groq-json";

const schema = z.object({
  hint: z.string(),
  nextState: z.object({
    attempts: z.number().int().min(0),
    escalate: z.boolean(),
  }),
  confidence: z.number().min(0).max(1),
  reasoningSummary: z.string(),
  nextSteps: z.array(z.string()).min(1).max(3),
});

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    question?: string;
    studentAttempt?: string;
    state?: { attempts?: number };
    confidence?: number;
    sensitive?: boolean;
  };

  const question = String(body.question ?? "").trim();
  const studentAttempt = String(body.studentAttempt ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const attempts = Number(body.state?.attempts ?? 0);
  const escalate = attempts >= 2;

  const [profile, metrics] = await Promise.all([
    getOrCreateTutorProfile(user.id),
    listConceptMetrics(user.id, 20),
  ]);

  const tone = detectTone({
    confidence: Number(body.confidence ?? 0.6),
    recentCorrectRate: 0.6,
    failedAttempts: attempts,
  });

  const stylePrefix = formatTutorStylePrefix(
    tone,
    (profile.preferredPersona as "strict" | "patient" | "neutral") ?? "patient"
  );

  const object = await callGroqJson(
    `${PERSONAL_TUTOR_SYSTEM_PROMPT}
${stylePrefix}
Hint attempt count: ${attempts}
Escalate explanation now: ${escalate}

Student profile: ${JSON.stringify(profile)}
Recent concept metrics: ${JSON.stringify(metrics.slice(0, 8))}
Question: ${question}
Student attempt: ${studentAttempt || "(none)"}

If escalate=true, provide alternate analogy then ask student to explain back in one sentence.
Return minimal hint otherwise.`,
    schema
  );

  const response = {
    ...object,
    nextState: {
      attempts: attempts + 1,
      escalate,
    },
  };

  await logTutorEvent({
    userId: user.id,
    actor: "tutor",
    type: "explanation",
    payload: { question, studentAttempt, hint: response.hint, attempts: response.nextState.attempts },
    reasoningSummary: response.reasoningSummary,
    confidence: response.confidence,
    suggestedNextSteps: response.nextSteps,
    redacted: Boolean(body.sensitive),
  });

  return NextResponse.json(response);
}
