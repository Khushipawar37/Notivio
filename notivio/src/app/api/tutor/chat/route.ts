import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/server/auth";
import {
  detectTone,
  formatTutorStylePrefix,
  PERSONAL_TUTOR_SYSTEM_PROMPT,
} from "@/app/lib/personal-tutor";
import { getOrCreateTutorProfile, listConceptMetrics, logTutorEvent } from "@/server/tutor";

const schema = z.object({
  tutorReply: z.string(),
  mode: z.enum(["encouraging", "direct", "curious"]),
  confidence: z.number().min(0).max(1),
  reasoningSummary: z.string(),
  rootCause: z.string().optional(),
  remediation: z.array(z.string()).max(3),
  nextSteps: z.array(z.string()).min(1).max(3),
  shouldEscalate: z.boolean(),
  askBackcheck: z.boolean(),
});

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    message?: string;
    context?: Record<string, unknown>;
    state?: { failedAttempts?: number; recentCorrectRate?: number; confidence?: number };
    sensitive?: boolean;
  };

  const message = String(body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const [profile, metrics] = await Promise.all([
    getOrCreateTutorProfile(user.id),
    listConceptMetrics(user.id, 30),
  ]);

  const failedAttempts = Number(body.state?.failedAttempts ?? 0);
  const recentCorrectRate = Number(body.state?.recentCorrectRate ?? 0.6);
  const confidence = Number(body.state?.confidence ?? 0.6);

  const tone = detectTone({
    confidence,
    recentCorrectRate,
    failedAttempts,
  });
  const stylePrefix = formatTutorStylePrefix(
    tone,
    (profile.preferredPersona as "strict" | "patient" | "neutral") ?? "patient"
  );

  const prompt = `${PERSONAL_TUTOR_SYSTEM_PROMPT}
${stylePrefix}
Failed attempts so far: ${failedAttempts}
Recent performance estimate: ${recentCorrectRate}

Student profile: ${JSON.stringify(profile)}
Concept metrics: ${JSON.stringify(metrics.slice(0, 12))}
Session context: ${JSON.stringify(body.context ?? {})}
Student message: ${message}

Constraints:
- retrieval-first if needed
- minimal-hint-first
- if failedAttempts >= 3, provide alternate explanation + ask student to explain back in 1 sentence
- if repeated error pattern appears, provide one-line root cause + 2-3 remediation actions

Return JSON only with keys:
tutorReply, mode, confidence, reasoningSummary, rootCause, remediation, nextSteps, shouldEscalate, askBackcheck`;

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a strict JSON API. Return valid JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: text || "Tutor model request failed" }, { status: 500 });
  }

  const raw = await response.json();
  const content = raw?.choices?.[0]?.message?.content;
  let decoded: unknown = {};
  try {
    decoded = JSON.parse(String(content || "{}"));
  } catch {
    decoded = {};
  }
  const parsed = schema.safeParse(decoded);
  if (!parsed.success) {
    return NextResponse.json(
      {
        tutorReply:
          "Let's reset with one small step. In 2-3 sentences, tell me what you currently think this means.",
        mode: tone,
        confidence: 0.45,
        reasoningSummary: "Fallback response due to parse mismatch.",
        rootCause: undefined,
        remediation: ["State your current definition", "Give one example"],
        nextSteps: ["Try a short explanation now."],
        shouldEscalate: failedAttempts >= 2,
        askBackcheck: true,
      },
      { status: 200 }
    );
  }
  const generated = { object: parsed.data };

  await logTutorEvent({
    userId: user.id,
    actor: "student",
    type: "attempt",
    payload: { message },
    redacted: Boolean(body.sensitive),
  });
  await logTutorEvent({
    userId: user.id,
    actor: "tutor",
    type: "explanation",
    payload: {
      tutorReply: generated.object.tutorReply,
      mode: generated.object.mode,
      rootCause: generated.object.rootCause ?? null,
    },
    reasoningSummary: generated.object.reasoningSummary,
    confidence: generated.object.confidence,
    suggestedNextSteps: generated.object.nextSteps,
    redacted: Boolean(body.sensitive),
  });

  return NextResponse.json(generated.object);
}
