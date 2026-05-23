import { Prisma } from "@prisma/client";
import { prisma } from "@/server/prisma";
import { isDbConnectivityError, isDbSchemaMissingError, withTimeout } from "@/server/db-guard";

function isMissingTableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  );
}

function isRecoverableTutorDbError(error: unknown) {
  return isMissingTableError(error) || isDbSchemaMissingError(error) || isDbConnectivityError(error);
}

export async function getOrCreateTutorProfile(userId: string) {
  try {
    return await withTimeout(
      prisma.tutorProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        preferredTone: "encouraging",
        preferredPersona: "patient",
        memoryEnabled: true,
      },
      }),
      1500,
      "tutor profile upsert",
    );
  } catch (error) {
    if (isRecoverableTutorDbError(error)) {
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
    return await withTimeout(
      prisma.conceptMetric.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }],
      take: limit,
      }),
      1500,
      "concept metrics query",
    );
  } catch (error) {
    if (isRecoverableTutorDbError(error)) {
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
    return await withTimeout(
      prisma.tutorEventLog.create({
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
      }),
      1500,
      "tutor event log insert",
    );
  } catch (error) {
    if (isRecoverableTutorDbError(error)) {
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
    existing = await withTimeout(
      prisma.conceptMetric.findUnique({
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
      }),
      1500,
      "concept metric lookup",
    );
  } catch (error) {
    if (isRecoverableTutorDbError(error)) {
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
    return await withTimeout(
      prisma.conceptMetric.upsert({
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
      }),
      1500,
      "concept metric upsert",
    );
  } catch (error) {
    if (isRecoverableTutorDbError(error)) {
      return null;
    }
    throw error;
  }
}

export async function listRecentTutorSessions(userId: string, limit = 12) {
  try {
    const conversations = await withTimeout(
      prisma.tutorConversation.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }],
      take: limit,
      include: {
        _count: {
          select: { messages: true },
        },
      },
      }),
      1500,
      "recent tutor sessions query",
    );

    return conversations.map((thread) => ({
      id: thread.id,
      date: thread.lastMessageAt.toISOString().slice(0, 10),
      topic: thread.title || thread.topic || "General",
      summary: thread.summary || "Session completed with active tutor guidance.",
      strength: thread.strength === "green" || thread.strength === "red" ? thread.strength : "amber",
      messageCount: thread._count.messages,
    }));
  } catch (error) {
    if (isRecoverableTutorDbError(error)) return [];
    throw error;
  }
}

export async function createTutorConversation(input: {
  userId: string;
  firstMessage: string;
  mode?: string;
}) {
  const topic = extractTopicFromMessage(input.firstMessage);
  const title = topic.length > 48 ? topic.slice(0, 48) : topic;
  try {
    return await withTimeout(
      prisma.tutorConversation.create({
        data: {
          userId: input.userId,
          title,
          topic,
          mode: input.mode ?? null,
          summary: `Started with: ${summarizeSessionReply(input.firstMessage)}`,
        },
      }),
      1500,
      "create tutor conversation",
    );
  } catch (error) {
    if (isRecoverableTutorDbError(error)) return null;
    throw error;
  }
}

export async function getTutorConversation(conversationId: string, userId: string) {
  try {
    return await withTimeout(
      prisma.tutorConversation.findFirst({
        where: { id: conversationId, userId },
      }),
      1500,
      "get tutor conversation",
    );
  } catch (error) {
    if (isRecoverableTutorDbError(error)) return null;
    throw error;
  }
}

export async function appendTutorConversationMessage(input: {
  conversationId: string;
  userId: string;
  role: "student" | "tutor";
  content: string;
}) {
  const role = input.role === "student" ? "student" : "tutor";
  try {
    await withTimeout(
      prisma.tutorConversationMessage.create({
        data: {
          conversationId: input.conversationId,
          userId: input.userId,
          role,
          content: input.content,
        },
      }),
      1500,
      "append tutor conversation message",
    );
    await withTimeout(
      prisma.tutorConversation.update({
        where: { id: input.conversationId },
        data: { lastMessageAt: new Date() },
      }),
      1500,
      "update tutor conversation timestamp",
    );
    return true;
  } catch (error) {
    if (isRecoverableTutorDbError(error)) return false;
    throw error;
  }
}

export async function listConversationMessages(input: {
  conversationId: string;
  userId: string;
  limit?: number;
}) {
  const limit = input.limit ?? 20;
  try {
    const rows = await withTimeout(
      prisma.tutorConversationMessage.findMany({
        where: { conversationId: input.conversationId, userId: input.userId },
        orderBy: [{ createdAt: "desc" }],
        take: limit,
      }),
      1500,
      "list conversation messages",
    );
    return rows.reverse();
  } catch (error) {
    if (isRecoverableTutorDbError(error)) return [];
    throw error;
  }
}

export async function updateTutorConversationMeta(input: {
  conversationId: string;
  firstStudentMessage: string;
  tutorReply: string;
  strength: "green" | "amber" | "red";
}) {
  try {
    const existing = await withTimeout(
      prisma.tutorConversation.findUnique({
        where: { id: input.conversationId },
        select: { title: true, topic: true },
      }),
      1500,
      "get tutor conversation before meta update",
    );
    const newTopicCandidate = extractTopicFromMessage(input.firstStudentMessage);
    const existingTopic = (existing?.title || existing?.topic || "General").trim();
    const topic =
      !isWeakTopicLabel(existingTopic) && isWeakTopicLabel(newTopicCandidate)
        ? existingTopic
        : newTopicCandidate;
    const title = topic.length > 48 ? topic.slice(0, 48) : topic;

    return await withTimeout(
      prisma.tutorConversation.update({
        where: { id: input.conversationId },
        data: {
          title,
          topic,
          summary: summarizeSessionReply(input.tutorReply),
          strength: input.strength,
          lastMessageAt: new Date(),
        },
      }),
      1500,
      "update tutor conversation meta",
    );
  } catch (error) {
    if (isRecoverableTutorDbError(error)) return null;
    throw error;
  }
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "can",
  "do",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "please",
  "study",
  "tell",
  "that",
  "the",
  "to",
  "understand",
  "want",
  "what",
  "with",
  "last",
  "next",
  "topic",
  "topics",
  "now",
  "brief",
]);

const GENERIC_TOPIC_WORDS = new Set([
  "general",
  "last",
  "next",
  "topic",
  "topics",
  "study",
  "revision",
  "revise",
  "brief",
  "doubt",
  "question",
  "help",
]);

function titleCase(input: string) {
  return input
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function isWeakTopicLabel(topic: string) {
  const clean = topic.trim().toLowerCase();
  if (!clean) return true;
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  if (words.length === 1 && GENERIC_TOPIC_WORDS.has(words[0])) return true;
  const genericCount = words.filter((word) => GENERIC_TOPIC_WORDS.has(word)).length;
  return genericCount === words.length;
}

export function extractTopicFromMessage(message: string) {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (!normalized) return "General";

  const patterns = [
    /\b(?:learn|study|revise|practice|prepare)\s+(?:about\s+)?(.+?)(?:[.?!,]|$)/i,
    /\b(?:topic|chapter|concept)\s*(?:is|:)\s*(.+?)(?:[.?!,]|$)/i,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const cleaned = match[1].replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();
      if (cleaned.length >= 3) return titleCase(cleaned.split(" ").slice(0, 6).join(" "));
    }
  }

  const keywords = normalized
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word));
  if (keywords.length === 0) return "General";
  return titleCase(keywords.slice(0, 4).join(" "));
}

export function summarizeSessionReply(reply: string) {
  const compact = reply.replace(/\s+/g, " ").trim();
  if (!compact) return "Guided explanation delivered with an active recall follow-up.";
  return compact.length > 150 ? `${compact.slice(0, 147)}...` : compact;
}

export function inferSessionStrength(reply: string) {
  const text = reply.toLowerCase();
  if (text.includes("great") || text.includes("correct") || text.includes("well done")) return "green" as const;
  if (text.includes("confus") || text.includes("mistake") || text.includes("incorrect") || text.includes("struggle")) return "red" as const;
  return "amber" as const;
}
