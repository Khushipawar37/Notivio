import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { logTutorEvent } from "@/server/tutor";
import { evaluateAttemptAgainstEvidence, minimalHint, provenancePointers, retrieveTutorEvidence } from "@/server/tutorService";

const bodySchema = z.object({
  conceptId: z.string().optional(),
  attempt: z.string().optional(),
  context: z.record(z.unknown()).optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = bodySchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const attempt = (body.data.attempt ?? "").trim();
  const conceptId = (body.data.conceptId ?? "").trim();
  const query = attempt || conceptId || "current learning topic";

  const evidence = await retrieveTutorEvidence(user.id, query, 6);
  const provenance = provenancePointers(evidence);

  let hintLevel: "minimal" | "worked-example" = "minimal";
  let hint = "Hint (minimal): Restate the core definition in 10 words before adding details.";

  if (attempt && evidence.length > 0) {
    const evaluation = evaluateAttemptAgainstEvidence(attempt, evidence);
    const missing = evaluation.missingKeyPoints[0] ?? "the core mechanism";
    hint = minimalHint(missing);
    if (evaluation.score < 0.25) {
      hintLevel = "worked-example";
      hint = `${hint}\nWorked-example direction: write cause -> mechanism -> result in 3 short lines.`;
    }
  } else if (evidence.length > 0) {
    const anchor = evidence[0].chunkText.slice(0, 120);
    hint = `Hint (minimal): Start from this anchor and paraphrase it: "${anchor}"`;
  }

  await logTutorEvent({
    userId: user.id,
    actor: "tutor",
    type: "prompt",
    payload: { conceptId: conceptId || null, hint, hintLevel, provenance },
    reasoningSummary: "Generated targeted hint from retrieved evidence.",
    confidence: evidence.length > 0 ? 0.7 : 0.45,
    suggestedNextSteps: ["Try again in one sentence."],
  });

  return NextResponse.json({
    hint,
    hintLevel,
    provenance,
  });
}
