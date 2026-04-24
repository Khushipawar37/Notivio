import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { getOrCreateTutorProfile, logTutorEvent, updateConceptMetric } from "@/server/tutor";
import {
  asksTutorToAskFirst,
  buildDiagnosticQuestion,
  buildRootCauseAndRemediation,
  chooseTutorMode,
  extractLikelyTopic,
  evaluateAttemptAgainstEvidence,
  hasLearningIntent,
  inferConceptId,
  isGreetingMessage,
  isLikelySmallTalk,
  isTopicOnlyMessage,
  lowConfidenceResponse,
  minimalHint,
  provenancePointers,
  retrieveTutorEvidence,
  seemsAttempt,
  seemsProblemQuestion,
  socraticStarter,
  escalationExplanation,
} from "@/server/tutorService";

const bodySchema = z.object({
  message: z.string().min(1),
  state: z
    .object({
      failedAttempts: z.number().int().min(0).optional(),
      confidence: z.number().min(0).max(1).optional(),
      recentCorrectRate: z.number().min(0).max(1).optional(),
    })
    .optional(),
  context: z.record(z.unknown()).optional(),
  sensitive: z.boolean().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsedBody = bodySchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const message = parsedBody.data.message.trim();
  const state = parsedBody.data.state ?? {};
  const failedAttempts = state.failedAttempts ?? 0;
  const hasAttemptSignal = seemsAttempt(message);
  const mode = chooseTutorMode(state);
  const sensitive = Boolean(parsedBody.data.sensitive);

  const profile = await getOrCreateTutorProfile(user.id);
  const memoryEnabled = Boolean(profile.memoryEnabled);

  await logTutorEvent({
    userId: user.id,
    actor: "student",
    type: "attempt",
    payload: { message, context: parsedBody.data.context ?? null },
    redacted: sensitive,
  });

  if (isGreetingMessage(message)) {
    const reply =
      "Nice to meet you. What do you want to study right now? Share the subject and your current level (beginner/intermediate/advanced), and I will personalize the session.";
    await logTutorEvent({
      userId: user.id,
      actor: "tutor",
      type: "prompt",
      payload: { reply, mode, reason: "greeting_detected" },
      reasoningSummary: "Handled greeting and guided student into topic selection.",
      confidence: 0.9,
      suggestedNextSteps: ["Share one topic (for example: DBMS transactions) and your current level."],
      redacted: sensitive,
    });
    return NextResponse.json({
      tutorReply: reply,
      mode,
      shouldEscalate: false,
      remediation: [],
      provenance: [],
    });
  }

  if (isLikelySmallTalk(message) && !hasAttemptSignal) {
    const reply =
      "Glad to hear that. To start properly, tell me what subject you want to study today, and I will ask a tailored first diagnostic question.";
    await logTutorEvent({
      userId: user.id,
      actor: "tutor",
      type: "prompt",
      payload: { reply, mode, reason: "smalltalk_to_topic_transition" },
      reasoningSummary: "Handled conversational reply and redirected to study topic setup.",
      confidence: 0.88,
      suggestedNextSteps: ["Tell me the subject you want to study."],
      redacted: sensitive,
    });
    return NextResponse.json({
      tutorReply: reply,
      mode,
      shouldEscalate: false,
      remediation: [],
      provenance: [],
    });
  }

  const learningIntent = hasLearningIntent(message);
  const explicitAskFirst = asksTutorToAskFirst(message);
  const topicOnly = isTopicOnlyMessage(message);
  if ((learningIntent || explicitAskFirst || topicOnly) && !hasAttemptSignal) {
    const inferredTopic = extractLikelyTopic(message) ?? "your topic";
    const evidence = await retrieveTutorEvidence(user.id, inferredTopic, 6);
    const provenance = provenancePointers(evidence);
    const question = buildDiagnosticQuestion(inferredTopic, evidence);
    const tutorReply = [
      question,
      "Answer in 1-2 lines and I will adapt the next step to your level.",
      provenance.length ? `source: ${provenance.map((p) => `${p.pageId}:${p.chunkIndex}`).join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    await logTutorEvent({
      userId: user.id,
      actor: "tutor",
      type: "prompt",
      payload: { reply: tutorReply, mode, reason: explicitAskFirst ? "asked_question_first" : "topic_diagnostic" },
      reasoningSummary: "Started with a targeted diagnostic question based on user topic.",
      confidence: evidence.length > 0 ? 0.8 : 0.6,
      suggestedNextSteps: ["Answer the diagnostic question in 1-2 lines."],
      redacted: sensitive,
    });
    return NextResponse.json({
      tutorReply,
      mode,
      shouldEscalate: false,
      remediation: [],
      provenance,
    });
  }

  // Retrieval-first policy: ask for attempt before explaining if this looks like a fresh problem prompt.
  if (!hasAttemptSignal && failedAttempts === 0 && seemsProblemQuestion(message)) {
    const reply = socraticStarter();
    await logTutorEvent({
      userId: user.id,
      actor: "tutor",
      type: "prompt",
      payload: { reply, mode, reason: "attempt_first_gate" },
      reasoningSummary: "Prompted student attempt before explanation.",
      confidence: 0.8,
      suggestedNextSteps: ["Give a one-sentence attempt or type 'stuck'."],
      redacted: sensitive,
    });
    return NextResponse.json({
      tutorReply: reply,
      mode,
      shouldEscalate: false,
      remediation: [],
      provenance: [],
    });
  }

  if (!hasAttemptSignal && failedAttempts === 0) {
    const reply =
      "I read your message. Before I coach deeply, give me your attempt in 1-2 lines so I can diagnose what to fix first. If you want, I can ask a starter question instead.";
    await logTutorEvent({
      userId: user.id,
      actor: "tutor",
      type: "prompt",
      payload: { reply, mode, reason: "attempt_or_question_choice" },
      reasoningSummary: "Asked for attempt with conversational fallback option.",
      confidence: 0.7,
      suggestedNextSteps: ["Share a short attempt, or say 'ask me first'."],
      redacted: sensitive,
    });
    return NextResponse.json({
      tutorReply: reply,
      mode,
      shouldEscalate: false,
      remediation: [],
      provenance: [],
    });
  }

  const evidence = await retrieveTutorEvidence(user.id, message, 6);
  if (evidence.length === 0) {
    const reply = lowConfidenceResponse();
    await logTutorEvent({
      userId: user.id,
      actor: "tutor",
      type: "explanation",
      payload: { reply, mode, reason: "low_retrieval" },
      reasoningSummary: "Low-confidence response due to weak/empty retrieval.",
      confidence: 0.25,
      suggestedNextSteps: ["Provide narrower topic keywords."],
      redacted: sensitive,
    });
    return NextResponse.json({
      tutorReply: reply,
      mode,
      shouldEscalate: false,
      remediation: [],
      provenance: [],
    });
  }

  const evaluation = evaluateAttemptAgainstEvidence(message, evidence);
  const conceptId = inferConceptId(message, evidence);
  const provenance = provenancePointers(evidence);

  let tutorReply = "";
  let shouldEscalate = false;
  let rootCause: string | undefined;
  let remediation: string[] = [];
  let reasoningSummary = "";
  let confidence = 0.6;
  let eventType: "prompt" | "attempt" | "explanation" | "diagnosis" | "acceptance" = "explanation";

  if (evaluation.isCorrect) {
    const extensionFocus = evaluation.expectedKeyPoints[0] ?? "the core idea";
    tutorReply = [
      "Nice work. Your attempt captures the key idea.",
      `Extension question: can you apply this to a slightly different case involving ${extensionFocus}?`,
      `source: ${provenance.map((p) => `${p.pageId}:${p.chunkIndex}`).join(", ")}`,
    ].join("\n");
    reasoningSummary = "Attempt evaluated as sufficiently aligned with retrieved key points.";
    confidence = Math.min(0.95, 0.55 + evaluation.score * 0.4);
    eventType = "acceptance";
  } else if (failedAttempts >= 2) {
    tutorReply = [
      escalationExplanation(message, evaluation, evidence),
      `source: ${provenance.map((p) => `${p.pageId}:${p.chunkIndex}`).join(", ")}`,
    ].join("\n");
    const diagnosis = buildRootCauseAndRemediation(evaluation, failedAttempts);
    rootCause = diagnosis.rootCause;
    remediation = diagnosis.remediation;
    shouldEscalate = true;
    reasoningSummary = "Escalated to worked explanation after repeated failed attempts.";
    confidence = 0.72;
    eventType = "diagnosis";
  } else {
    const missingKey = evaluation.missingKeyPoints[0] ?? "the missing mechanism";
    tutorReply = [
      minimalHint(missingKey),
      "Try again in one sentence before I reveal more.",
      `source: ${provenance.map((p) => `${p.pageId}:${p.chunkIndex}`).join(", ")}`,
    ].join("\n");
    const diagnosis = buildRootCauseAndRemediation(evaluation, failedAttempts);
    rootCause = diagnosis.rootCause;
    remediation = diagnosis.remediation;
    shouldEscalate = true;
    reasoningSummary = "Minimal-hint path selected because key points were missing.";
    confidence = 0.6;
    eventType = "prompt";
  }

  if (memoryEnabled) {
    await updateConceptMetric({
      userId: user.id,
      conceptId,
      isCorrect: evaluation.isCorrect,
      confusionCandidates: evaluation.missingKeyPoints.slice(0, 3),
      wrongExample: evaluation.isCorrect ? undefined : message.slice(0, 220),
    });
  }

  await logTutorEvent({
    userId: user.id,
    actor: "tutor",
    type: eventType,
    payload: {
      mode,
      conceptId,
      evaluationScore: evaluation.score,
      expectedKeyPoints: evaluation.expectedKeyPoints,
      coveredKeyPoints: evaluation.coveredKeyPoints,
      missingKeyPoints: evaluation.missingKeyPoints,
      provenance,
      rootCause: rootCause ?? null,
    },
    reasoningSummary,
    confidence,
    suggestedNextSteps:
      remediation.length > 0
        ? remediation
        : evaluation.isCorrect
          ? ["Answer the extension question in one sentence."]
          : ["Retry with the minimal hint."],
    redacted: sensitive,
  });

  return NextResponse.json({
    tutorReply,
    mode,
    rootCause,
    remediation,
    shouldEscalate,
    provenance,
  });
}
