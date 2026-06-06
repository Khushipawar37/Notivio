import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/server/auth";
import { prisma } from "@/server/prisma";

const PROFILE_META_KEY = "__profile_meta__";

function parseSubjects(raw: string | null | undefined): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as { primarySubjects?: string[] };
    return Array.isArray(parsed.primarySubjects)
      ? parsed.primarySubjects.filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const user = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [flashcardsCount, notebooksCount, sessionsCount, profileMeta] =
    await Promise.all([
      prisma.flashcard.count({ where: { userId: user.id } }),
      prisma.notebook.count({ where: { userId: user.id } }),
      prisma.studySession.count({ where: { userId: user.id } }),
      prisma.workspaceState.findUnique({
        where: { userId_key: { userId: user.id, key: PROFILE_META_KEY } },
      }),
    ]);

  const subjects = parseSubjects(profileMeta?.activePageId);
  const topSubject = subjects[0] || "your top subject";

  const missions = [
    {
      id: "mission-deep-review",
      title: `Deep review: ${topSubject}`,
      points: 20,
      status: flashcardsCount > 20 ? "ready" : "in_progress",
      description: "Generate and review 15 flashcards for your next session.",
    },
    {
      id: "mission-consistency",
      title: "Consistency streak",
      points: 15,
      status: sessionsCount >= 5 ? "ready" : "in_progress",
      description: "Complete 5 focused study sessions this week.",
    },
    {
      id: "mission-knowledge-map",
      title: "Knowledge map refresh",
      points: 18,
      status: notebooksCount >= 3 ? "ready" : "in_progress",
      description: "Add one summary page to each active notebook.",
    },
  ];

  return NextResponse.json({
    missions,
    totals: {
      missionsCompleted: sessionsCount,
      insightPoints: flashcardsCount * 2 + sessionsCount * 5,
    },
  });
}
