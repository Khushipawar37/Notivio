import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/server/auth";
import { PERSONAL_TUTOR_SYSTEM_PROMPT } from "@/app/lib/personal-tutor";
import { listConceptMetrics, logTutorEvent } from "@/server/tutor";
import { callGroqJson } from "@/server/groq-json";

const schema = z.object({
  diagnosis: z.string(),
  rootCauseLabel: z.enum([
    "foundational_gap",
    "conflation",
    "misconception",
    "retrieval_failure",
    "mixed",
  ]),
  remediationPlan: z.array(z.string()).min(2).max(3),
  confidence: z.number().min(0).max(1),
});

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    conceptId?: string;
    recentAttempts?: Array<Record<string, unknown>>;
    sensitive?: boolean;
  };

  const conceptId = String(body.conceptId ?? "").trim();
  if (!conceptId) {
    return NextResponse.json({ error: "conceptId is required" }, { status: 400 });
  }

  const metrics = await listConceptMetrics(user.id, 40);
  const conceptMetric = metrics.find((item) => item.conceptId === conceptId);

  const generated = await callGroqJson(
    `${PERSONAL_TUTOR_SYSTEM_PROMPT}
Analyze repeated errors for concept ${conceptId}.
Concept metric: ${JSON.stringify(conceptMetric ?? null)}
Recent attempts: ${JSON.stringify(body.recentAttempts ?? [])}

Return:
- one sentence diagnosis
- root-cause label
- 2-3 targeted remediation actions.`,
    schema
  );

  await logTutorEvent({
    userId: user.id,
    actor: "tutor",
    type: "diagnosis",
    payload: { conceptId, output: generated },
    reasoningSummary: generated.diagnosis,
    confidence: generated.confidence,
    suggestedNextSteps: generated.remediationPlan,
    redacted: Boolean(body.sensitive),
  });

  return NextResponse.json(generated);
}
