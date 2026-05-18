import type { ZodType } from "zod";

function extractJsonObject(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    const candidate = fencedMatch[1].trim();
    if (candidate.startsWith("{") && candidate.endsWith("}")) return candidate;
  }

  const firstBrace = trimmed.indexOf("{");
  if (firstBrace < 0) return trimmed;
  let depth = 0;
  for (let index = firstBrace; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return trimmed.slice(firstBrace, index + 1);
  }
  return trimmed;
}

export async function callGroqJson<T>(
  prompt: string,
  schema: ZodType<T>
): Promise<T> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not configured");
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
        { role: "system", content: "Return valid JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Groq request failed");
  }

  const raw = await response.json();
  const content = raw?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error(`Groq response missing valid content: ${JSON.stringify(raw)}`);
  }

  const jsonCandidate = extractJsonObject(content);
  let parsed: unknown = {};
  try {
    parsed = JSON.parse(jsonCandidate);
  } catch (error) {
    throw new Error(`Groq returned invalid JSON: ${String(content)}; parse error: ${String(error)}`);
  }

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Model JSON validation failed: ${JSON.stringify(validated.error.issues)}; raw content: ${String(content)}`,
    );
  }

  return validated.data;
}
