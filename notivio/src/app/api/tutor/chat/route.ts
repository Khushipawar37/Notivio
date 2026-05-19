import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { getOrCreateTutorProfile, logTutorEvent } from "@/server/tutor";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const bodySchema = z.object({
  message: z.string().min(1),
  mode: z.enum(["learn", "exam_prep", "practice", "revision", "planner"]).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["student", "tutor"]),
        text: z.string(),
      }),
    )
    .optional(),
  context: z.record(z.unknown()).optional(),
  sensitive: z.boolean().optional(),
});

const MODE_HINTS: Record<string, string> = {
  learn: "Teach clearly with step-by-step explanation and one short check question.",
  exam_prep: "Give concise, exam-ready answer: definition, key points, and likely framing.",
  practice: "Ask 1-3 practice questions first, then provide brief feedback.",
  revision: "Give compact revision summary and quick recall bullets.",
  planner: "Give realistic short study plan without pressure.",
};

async function streamGroq(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1400,
      stream: true,
      messages,
    }),
  });

  if (!response.ok || !response.body) {
    const text = await response.text();
    throw new Error(text || "Groq tutor request failed");
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = response.body.getReader();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
            const token = parsed.choices?.[0]?.delta?.content || "";
            if (token) controller.enqueue(encoder.encode(token));
          } catch {
            // ignore malformed chunks
          }
        }
      }
      controller.close();
    },
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const { message, history = [], mode = "learn", context = {}, sensitive = false } = parsed.data;
  const profile = await getOrCreateTutorProfile(user.id);
  const profileCtx = JSON.stringify({
    preferredTone: profile.preferredTone,
    preferredPersona: profile.preferredPersona,
    studentProfile: context.studentProfile ?? null,
  });

  await logTutorEvent({
    userId: user.id,
    actor: "student",
    type: "attempt",
    payload: { message, mode },
    redacted: sensitive,
  });

  const systemPrompt = [
    "You are the Notivio Personal Tutor.",
    "Answer the student's actual question directly and accurately.",
    "Do not ignore user intent. Do not force diagnostics when user asked for explanation.",
    "If user says they are beginner or they do not know topic, start from basics immediately.",
    "If uncertain, clearly say uncertainty and ask one clarifying question.",
    "Keep calm tone. Avoid hype and avoid unrelated statements.",
    MODE_HINTS[mode] ?? MODE_HINTS.learn,
  ].join(" ");

  const historyMessages = history.slice(-8).map((item) => ({
    role: item.role === "tutor" ? ("assistant" as const) : ("user" as const),
    content: item.text,
  }));

  const stream = await streamGroq([
    { role: "system", content: systemPrompt },
    { role: "system", content: `Student context: ${profileCtx}` },
    ...historyMessages,
    { role: "user", content: message.trim() },
  ]);

  await logTutorEvent({
    userId: user.id,
    actor: "tutor",
    type: "explanation",
    payload: { mode },
    reasoningSummary: "Baseline Groq tutor response generated with chat history context.",
    confidence: 0.7,
    suggestedNextSteps: [],
    redacted: sensitive,
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Tutor-Mode": mode,
    },
  });
}

