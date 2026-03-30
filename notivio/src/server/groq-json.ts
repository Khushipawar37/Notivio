import type { ZodType } from "zod";

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
  let parsed: unknown = {};
  try {
    parsed = JSON.parse(String(content || "{}"));
  } catch {
    parsed = {};
  }

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    throw new Error("Model JSON validation failed");
  }

  return validated.data;
}
