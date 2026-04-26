import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
  source_summary:
    "Summarize this source for a student in 6-10 concise bullet points, focusing on core ideas and exam-relevant facts.",
  source_tags:
    'Return ONLY a JSON array of 5-10 short topic tags based on the content. Example: ["Mitosis","Cell Cycle"]',
  compare_sources:
    "Compare Source A and Source B. Return concise markdown with: overlaps, key differences, possible contradictions, and what to revise first.",
  chat:
    "You are StudySpace AI. Answer primarily using the student's notes context. Be concise, clear, and encouraging. Use markdown for readability.",
};

type JsonModeFeature =
  | "flashcards"
  | "quiz_mcq"
  | "quiz_truefalse"
  | "quiz_short"
  | "mnemonics"
  | "gap_fill"
  | "feynman_evaluate"
  | "feynman_pick"
  | "exam_predictor";

const JSON_MODE_FEATURES = new Set<string>([
  "flashcards",
  "quiz_mcq",
  "quiz_truefalse",
  "quiz_short",
  "mnemonics",
  "gap_fill",
  "feynman_evaluate",
  "feynman_pick",
  "exam_predictor",
]);

const flashcardSchema = z.array(
  z.object({
    question: z.string(),
    answer: z.string(),
  })
);

const mcqSchema = z.array(
  z.object({
    question: z.string(),
    options: z.array(z.string()).length(4),
    correct: z.number().int().min(0).max(3),
    explanation: z.string(),
  })
);

const trueFalseSchema = z.array(
  z.object({
    statement: z.string(),
    answer: z.boolean(),
    explanation: z.string(),
  })
);

const shortQuizSchema = z.array(
  z.object({
    question: z.string(),
    model_answer: z.string(),
    key_points: z.array(z.string()),
  })
);

const mnemonicSchema = z.object({
  acronym: z.string(),
  story: z.string(),
  rhyme: z.string(),
  association: z.string(),
  memory_palace: z.string(),
});

const gapFillSchema = z.object({
  text_with_blanks: z.string(),
  answers: z.array(z.string()),
});

const feynmanEvalSchema = z.object({
  score: z.number().min(0).max(10),
  correct_points: z.array(z.string()),
  vague_points: z.array(z.string()),
  missing_points: z.array(z.string()),
  guidance: z.string(),
});

const feynmanPickSchema = z.object({
  concept: z.string(),
  prompt: z.string(),
});

const examPredictSchema = z.array(
  z.object({
    question: z.string(),
    type: z.string(),
    difficulty: z.string(),
    model_answer: z.string(),
  })
);

const FEATURE_SCHEMAS: Record<JsonModeFeature, z.ZodTypeAny> = {
  flashcards: flashcardSchema,
  quiz_mcq: mcqSchema,
  quiz_truefalse: trueFalseSchema,
  quiz_short: shortQuizSchema,
  mnemonics: mnemonicSchema,
  gap_fill: gapFillSchema,
  feynman_evaluate: feynmanEvalSchema,
  feynman_pick: feynmanPickSchema,
  exam_predictor: examPredictSchema,
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

function jsonError(
  status: number,
  code: string,
  message: string,
  options?: { details?: string; retryable?: boolean }
) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        details: options?.details,
        retryable: options?.retryable,
      },
    },
    { status }
  );
}

function normalizeUpstreamError(status: number, raw: string) {
  const compact = raw.toLowerCase();
  if (status === 429 || compact.includes("rate limit")) {
    return {
      code: "RATE_LIMITED",
      message: "Rate limit reached for the AI provider.",
      retryable: true,
    };
  }
  if (status === 413 || compact.includes("token") || compact.includes("context length")) {
    return {
      code: "TOKEN_LIMIT_EXCEEDED",
      message: "Input is too large for this AI model.",
      retryable: false,
    };
  }
  if (status >= 500) {
    return {
      code: "UPSTREAM_UNAVAILABLE",
      message: "AI provider is temporarily unavailable.",
      retryable: true,
    };
  }
  return {
    code: "UPSTREAM_ERROR",
    message: "AI provider rejected the request.",
    retryable: status >= 500,
  };
}

function extractJsonPayload(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue trying extraction modes.
  }

  const fencedBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedBlock?.[1]) {
    try {
      return JSON.parse(fencedBlock[1].trim());
    } catch {
      // Continue.
    }
  }

  const firstCurly = trimmed.indexOf("{");
  const firstSquare = trimmed.indexOf("[");
  const firstIndexCandidates = [firstCurly, firstSquare].filter((i) => i >= 0);
  if (firstIndexCandidates.length === 0) return null;
  const firstIndex = Math.min(...firstIndexCandidates);

  const lastCurly = trimmed.lastIndexOf("}");
  const lastSquare = trimmed.lastIndexOf("]");
  const lastIndex = Math.max(lastCurly, lastSquare);
  if (lastIndex < firstIndex) return null;

  try {
    return JSON.parse(trimmed.slice(firstIndex, lastIndex + 1));
  } catch {
    return null;
  }
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
      return jsonError(500, "SERVER_MISCONFIGURED", "GROQ_API_KEY not configured");
    }
    if (!systemPrompt) {
      return jsonError(400, "UNKNOWN_FEATURE", `Unknown feature: ${feature}`);
    }

    const userContent = buildUserContent(body);
    if (!userContent.trim()) {
      return jsonError(400, "EMPTY_CONTENT", "No content provided.");
    }

    const stream = Boolean(body.stream);

    if (feature === "chat" && stream) {
      return handleStreamingChat(systemPrompt, userContent);
    }

    const response = await callGroq(systemPrompt, userContent, false);
    if (!response.ok) {
      const errorText = await response.text();
      const normalized = normalizeUpstreamError(response.status, errorText || "");
      return jsonError(response.status, normalized.code, normalized.message, {
        details: errorText || undefined,
        retryable: normalized.retryable,
      });
    }
    const data = await response.json();
    const result = String(data.choices?.[0]?.message?.content || "");

    if (!JSON_MODE_FEATURES.has(feature)) {
      return NextResponse.json({
        ok: true,
        feature,
        mode: "text",
        text: result,
        result,
      });
    }

    const parsed = extractJsonPayload(result);
    const schema = FEATURE_SCHEMAS[feature as JsonModeFeature];
    const validated = schema.safeParse(parsed);
    if (!validated.success) {
      return jsonError(502, "MODEL_JSON_INVALID", "AI returned malformed structured output.", {
        details: result.slice(0, 2000),
        retryable: true,
      });
    }

    return NextResponse.json({
      ok: true,
      feature,
      mode: "json",
      data: validated.data,
      result,
    });
  } catch (error) {
    console.error("AI study route error:", error);
    return jsonError(500, "INTERNAL_ERROR", "Internal server error", {
      details: error instanceof Error ? error.message : String(error),
      retryable: true,
    });
  }
}
