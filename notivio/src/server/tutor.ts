import { Prisma } from "@prisma/client";
import { prisma } from "@/server/prisma";

function isMissingTableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  );
}

export async function getOrCreateTutorProfile(userId: string) {
  try {
    return await prisma.tutorProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        preferredTone: "encouraging",
        preferredPersona: "patient",
        memoryEnabled: true,
      },
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        id: `fallback-${userId}`,
        userId,
        preferredTone: "encouraging",
        preferredPersona: "patient",
        memoryEnabled: false,
        studyPatterns: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    throw error;
  }
}

export async function listConceptMetrics(userId: string, limit = 50) {
  try {
    return await prisma.conceptMetric.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }],
      take: limit,
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function logTutorEvent(input: {
  userId: string;
  actor: "student" | "tutor" | "system";
  type: "prompt" | "attempt" | "explanation" | "diagnosis" | "acceptance";
  payload: Record<string, unknown>;
  reasoningSummary?: string;
  confidence?: number;
  suggestedNextSteps?: string[];
  snapshotPointer?: string;
  redacted?: boolean;
}) {
  try {
    return await prisma.tutorEventLog.create({
      data: {
        userId: input.userId,
        actor: input.actor,
        type: input.type,
        payload: input.payload as unknown as Prisma.InputJsonValue,
        reasoningSummary: input.reasoningSummary,
        confidence: input.confidence,
        suggestedNextSteps: input.suggestedNextSteps ?? [],
        snapshotPointer: input.snapshotPointer,
        redacted: input.redacted ?? false,
      },
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function updateConceptMetric(input: {
  userId: string;
  conceptId: string;
  isCorrect: boolean;
  confusionCandidates?: string[];
  wrongExample?: string;
}) {
  let existing:
    | {
        confusions: string[];
        lastWrongExamples: string[];
      }
    | null = null;

  try {
    existing = await prisma.conceptMetric.findUnique({
      where: {
        userId_conceptId: {
          userId: input.userId,
          conceptId: input.conceptId,
        },
      },
      select: {
        confusions: true,
        lastWrongExamples: true,
      },
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw error;
  }

  const nextConfusions = Array.from(
    new Set([...(existing?.confusions ?? []), ...(input.confusionCandidates ?? [])])
  ).slice(0, 8);

  const nextWrongExamples = input.isCorrect
    ? existing?.lastWrongExamples ?? []
    : Array.from(new Set([...(existing?.lastWrongExamples ?? []), input.wrongExample ?? ""]))
        .filter(Boolean)
        .slice(0, 5);

  try {
    return await prisma.conceptMetric.upsert({
      where: {
        userId_conceptId: {
          userId: input.userId,
          conceptId: input.conceptId,
        },
      },
      update: {
        attempts: { increment: 1 },
        correct: { increment: input.isCorrect ? 1 : 0 },
        confusions: nextConfusions,
        lastWrongExamples: nextWrongExamples,
        lastAttempt: new Date(),
      },
      create: {
        userId: input.userId,
        conceptId: input.conceptId,
        attempts: 1,
        correct: input.isCorrect ? 1 : 0,
        confusions: nextConfusions,
        lastWrongExamples: nextWrongExamples,
        lastAttempt: new Date(),
      },
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function listRecentTutorSessions(userId: string, limit = 12) {
  try {
    const events = await prisma.tutorEventLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit * 8,
      select: {
        createdAt: true,
        payload: true,
        reasoningSummary: true,
      },
    });

    const buckets = new Map<string, { date: string; topic: string; summary: string; strength: "green" | "amber" | "red" }>();
    for (const event of events) {
      const date = event.createdAt.toISOString().slice(0, 10);
      if (buckets.has(date)) continue;

      const payload = (event.payload as Record<string, unknown>) || {};
      const topic =
        (typeof payload.conceptId === "string" && payload.conceptId) ||
        (typeof payload.message === "string" && payload.message.split(" ").slice(0, 4).join(" ")) ||
        "General";
      const summary = event.reasoningSummary || "Session completed with active tutor guidance.";
      const lower = summary.toLowerCase();
      const strength: "green" | "amber" | "red" = lower.includes("strong")
        ? "green"
        : lower.includes("gap") || lower.includes("struggle")
          ? "red"
          : "amber";

      buckets.set(date, { date, topic, summary, strength });
      if (buckets.size >= limit) break;
    }
    return Array.from(buckets.values());
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}
