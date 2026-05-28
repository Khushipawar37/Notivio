import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { isDbConnectivityError, isDbSchemaMissingError } from "@/server/db-guard";
import {
  appendTutorConversationMessage,
  createTutorConversation,
  extractTopicFromMessage,
  getTutorConversation,
  getOrCreateTutorProfile,
  inferSessionStrength,
  listConversationMessages,
  listRecentTutorSessions,
  logTutorEvent,
  summarizeSessionReply,
  updateTutorConversationMeta,
} from "@/server/tutor";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const bodySchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
  mode: z.enum(["learn", "practice", "planner"]).optional(),
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

function getModeHint(mode: "learn" | "practice" | "planner", practiceType?: string) {
  if (mode === "learn") {
    return "Teach clearly with step-by-step explanation and one short check question.";
  }

  if (mode === "planner") {
    return "Create a deep, date-wise study timetable. Break each subject into units/topics and allocate daily study time blocks with revision windows.";
  }

  if (practiceType === "brainstorm") {
    return [
      "Run a brainstorm session anchored to the student's exact topic.",
      "First answer or frame the topic briefly so the student learns something useful immediately.",
      "Then ask 3-5 strategic follow-up questions that probe why, how, what-if, compare/contrast, edge cases, and likely misconceptions.",
      "Do not ask for a question count, and do not switch to unrelated topics.",
      "Keep the questions specific, non-generic, and progressively harder.",
    ].join(" ");
  }

  if (practiceType === "feynman") {
    return [
      "Run a Feynman-style session.",
      "Explain the topic simply first, then ask the student to restate it in their own words.",
      "Probe for gaps, misconceptions, and weak spots with targeted follow-up questions.",
      "Do not ask for a question count.",
    ].join(" ");
  }

  return [
    "Run an active practice session anchored to the student's topic.",
    "Stay on the requested subject and do not invent a different one.",
    "Ask a mix of recall, application, and reasoning questions.",
    "If the user did not specify a question count, default to a sensible number instead of asking for one.",
    "When the student asks for teaching, give a short explanation before questioning them.",
    "Wait for student answers, then evaluate with scoring and correction.",
  ].join(" ");
}

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

  const { message, conversationId, history = [], mode = "learn", context = {}, sensitive = false } = parsed.data;
  const practiceType = typeof context.practiceType === "string" ? context.practiceType : undefined;
  const [profile, userProfile, recentSessions] = await Promise.all([
    getOrCreateTutorProfile(user.id),
    prisma.userProfile.findUnique({
      where: { id: user.id },
      select: { displayName: true, email: true },
    }),
    listRecentTutorSessions(user.id, 6),
  ]);
  const profileCtx = JSON.stringify({
    userDetails: {
      displayName: userProfile?.displayName ?? user.displayName ?? null,
      email: userProfile?.email ?? user.primaryEmail ?? null,
    },
    preferredTone: profile.preferredTone,
    preferredPersona: profile.preferredPersona,
    previousSessions: recentSessions,
    studentProfile: context.studentProfile ?? null,
  });

  let activeConversationId = conversationId ?? null;
  let dbMemoryAvailable = true;
  try {
    if (activeConversationId) {
      const existing = await getTutorConversation(activeConversationId, user.id);
      if (!existing) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
    } else {
      const created = await createTutorConversation({ userId: user.id, firstMessage: message, mode });
      if (!created) {
        dbMemoryAvailable = false;
      } else {
        activeConversationId = created.id;
      }
    }
    if (dbMemoryAvailable && activeConversationId) {
      const saved = await appendTutorConversationMessage({
        conversationId: activeConversationId,
        userId: user.id,
        role: "student",
        content: message.trim(),
      });
      if (!saved) dbMemoryAvailable = false;
    }
  } catch (error) {
    if (isDbConnectivityError(error) || isDbSchemaMissingError(error)) {
      dbMemoryAvailable = false;
      activeConversationId = null;
    } else {
      throw error;
    }
  }

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
    "Format every response for readability using short sections and bullet points.",
    "Write section labels as bold markdown headings like **Concept:**, **Key Points:**, **Example:**.",
    "Use '-' for bullet points, never '*' bullets.",
    "Use this response template when possible:",
    "1) Direct answer (1-2 lines).",
    "2) Key points (3-6 bullets).",
    "3) Example (if helpful, 2-4 bullets).",
    "4) Quick check question (one line).",
    "Do not output long unbroken paragraphs.",
    getModeHint(mode, practiceType),
  ].join(" ");

  const dbThreadHistory = dbMemoryAvailable && activeConversationId
    ? await listConversationMessages({
        conversationId: activeConversationId,
        userId: user.id,
        limit: 20,
      }).catch((error) => {
        if (isDbConnectivityError(error) || isDbSchemaMissingError(error)) return [];
        throw error;
      })
    : [];

  const fallbackHistoryMessages = history.slice(-8).map((item) => ({
    role: item.role === "tutor" ? ("assistant" as const) : ("user" as const),
    content: item.text,
  }));
  const historyMessages = dbThreadHistory.length
    ? dbThreadHistory.slice(-12).map((item) => ({
        role: item.role === "tutor" ? ("assistant" as const) : ("user" as const),
        content: item.content,
      }))
    : fallbackHistoryMessages;

  const stream = await streamGroq([
    { role: "system", content: systemPrompt },
    { role: "system", content: `Student context: ${profileCtx}` },
    ...historyMessages,
    { role: "user", content: message.trim() },
  ]);
  const reader = stream.getReader();
  const encoder = new TextEncoder();
  let fullReply = "";

  const proxyStream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          const text = chunk.value ? new TextDecoder().decode(chunk.value, { stream: true }) : "";
          if (text) fullReply += text;
          controller.enqueue(encoder.encode(text));
        }
      } finally {
        controller.close();
        const topic = extractTopicFromMessage(message);
        const sessionSummary = summarizeSessionReply(fullReply);
        const sessionStrength = inferSessionStrength(fullReply);
        await logTutorEvent({
          userId: user.id,
          actor: "tutor",
          type: "explanation",
          payload: {
            mode,
            sessionTopic: topic,
            sessionSummary,
            sessionStrength,
            source: "tutor-chat",
          },
          reasoningSummary: sessionSummary,
          confidence: 0.8,
          suggestedNextSteps: [],
          redacted: sensitive,
        });
        if (dbMemoryAvailable && activeConversationId) {
          const firstStudentInThread =
            dbThreadHistory.find((item) => item.role === "student")?.content ?? message;
          await appendTutorConversationMessage({
            conversationId: activeConversationId,
            userId: user.id,
            role: "tutor",
            content: fullReply,
          }).catch(() => null);
          await updateTutorConversationMeta({
            conversationId: activeConversationId,
            firstStudentMessage: firstStudentInThread,
            tutorReply: fullReply,
            strength: sessionStrength,
          }).catch(() => null);
        }
      }
    },
  });

  return new Response(proxyStream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Tutor-Mode": mode,
      "X-Conversation-Id": activeConversationId ?? "",
    },
  });
}
