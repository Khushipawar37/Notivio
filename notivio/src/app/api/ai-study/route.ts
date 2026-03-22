import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPTS: Record<string, string> = {
  summarize_key_points:
    "You are a study assistant. Given the student's notes, create a concise bullet-point summary of the most important facts and concepts. Use clear, exam-ready language. Format with markdown bullets.",
  summarize_narrative:
    "You are a study assistant. Given the student's notes, write a flowing paragraph explanation that captures the big picture. Help the student understand how concepts connect. Write in clear, engaging prose.",
  explain_simple:
    "You are a patient teacher explaining to a 12-year-old. Take the given text and explain it in the simplest possible terms using everyday analogies and examples. Avoid jargon entirely.",
  explain_standard:
    "You are a knowledgeable tutor. Explain the given text clearly with proper terminology, concise examples, and structured reasoning. Aim for clarity suitable for a university student.",
  explain_deep:
    "You are an expert professor. Give a thorough, in-depth explanation of the given text with multiple examples, edge cases, connections to related concepts, and nuanced understanding. Be comprehensive.",
  flashcards:
    'You are a study assistant. Generate flashcards from the given content. Return ONLY valid JSON array with objects having "question" and "answer" fields. Generate 5-8 high-quality flashcards.',
  quiz_mcq:
    'Generate MCQs from the content. Return ONLY valid JSON array. Each object: "question", "options" (4), "correct" (0-3), "explanation".',
  quiz_truefalse:
    'Generate true/false questions. Return ONLY valid JSON array. Each object: "statement", "answer" (boolean), "explanation".',
  quiz_short:
    'Generate short-answer questions. Return ONLY valid JSON array with "question", "model_answer", "key_points".',
  enhance:
    "Improve the text for clarity, readability, and academic quality while preserving meaning. Return only improved text.",
  mnemonics:
    'Return JSON with fields: "acronym", "story", "rhyme", "association", "memory_palace".',
  gap_fill:
    'Create fill-in-the-blank exercise and return JSON with "text_with_blanks" and "answers" array.',
  feynman_evaluate:
    'Evaluate student explanation and return JSON with "score", "correct_points", "vague_points", "missing_points", "guidance".',
  feynman_pick:
    'Pick one concept from notes and return JSON with "concept" and "prompt".',
  story_mode:
    "Convert the content into an engaging narrative while keeping facts accurate.",
  exam_predictor:
    'Predict likely exam questions and return JSON array with fields: "question", "type", "difficulty", "model_answer".',
  chat:
    "You are StudySpace AI. Answer primarily using the student's notes context. Be concise, clear, and encouraging. Use markdown for readability.",
};

function buildUserContent(body: Record<string, unknown>) {
  const feature = String(body.feature || "");
  const content = String(body.content || "");
  const selectedText = String(body.selectedText || "");
  const userMessage = String(body.userMessage || "");
  const difficulty = String(body.difficulty || "");

  if (feature === "chat") {
    return `Student notes:\n---\n${content}\n---\n\nStudent question: ${userMessage}`;
  }
  if (feature === "feynman_evaluate") {
    return `Original notes:\n---\n${content}\n---\n\nStudent explanation:\n${userMessage}`;
  }
  if (feature.startsWith("quiz_")) {
    return `${difficulty ? `Difficulty: ${difficulty}\n\n` : ""}Study material:\n${content}`;
  }
  if (feature.startsWith("explain_")) {
    return selectedText || content;
  }
  return selectedText || content;
}

async function callGroq(systemPrompt: string, userContent: string, stream = false) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: stream ? 0.7 : 0.6,
      max_tokens: 4096,
      stream,
    }),
  });

  return response;
}

async function handleStreamingChat(systemPrompt: string, userContent: string) {
  const response = await callGroq(systemPrompt, userContent, true);
  if (!response.ok || !response.body) {
    const errorText = await response.text();
    return NextResponse.json({ error: errorText || "AI service error" }, { status: 500 });
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = response.body.getReader();

  const stream = new ReadableStream({
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
            const parsed = JSON.parse(payload);
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

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const feature = String(body.feature || "");
    const systemPrompt = SYSTEM_PROMPTS[feature];

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }
    if (!systemPrompt) {
      return NextResponse.json({ error: `Unknown feature: ${feature}` }, { status: 400 });
    }

    const userContent = buildUserContent(body);
    const stream = Boolean(body.stream);

    if (feature === "chat" && stream) {
      return handleStreamingChat(systemPrompt, userContent);
    }

    const response = await callGroq(systemPrompt, userContent, false);
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText || "AI service error" }, { status: 500 });
    }
    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";
    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI study route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
