import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/server/auth";
import { prisma } from "@/server/prisma";

const PROFILE_META_KEY = "__profile_meta__";

type LearningMethod = "reading" | "flashcards" | "video";

interface ProfileMeta {
  fullName: string;
  institution: string;
  major: string;
  studyYear: string;
  primarySubjects: string[];
  weeklyStudyGoalHours: number;
  preferredLearningMethod: LearningMethod;
}

const DEFAULT_META: ProfileMeta = {
  fullName: "",
  institution: "",
  major: "",
  studyYear: "",
  primarySubjects: [],
  weeklyStudyGoalHours: 8,
  preferredLearningMethod: "reading",
};

function parseMeta(raw: string | null | undefined): ProfileMeta {
  if (!raw) return DEFAULT_META;

  try {
    const parsed = JSON.parse(raw) as Partial<ProfileMeta>;
    return {
      fullName: parsed.fullName ?? "",
      institution: parsed.institution ?? "",
      major: parsed.major ?? "",
      studyYear: parsed.studyYear ?? "",
      primarySubjects: Array.isArray(parsed.primarySubjects) ? parsed.primarySubjects : [],
      weeklyStudyGoalHours: Number(parsed.weeklyStudyGoalHours ?? 8),
      preferredLearningMethod:
        parsed.preferredLearningMethod === "flashcards" || parsed.preferredLearningMethod === "video"
          ? parsed.preferredLearningMethod
          : "reading",
    };
  } catch {
    return DEFAULT_META;
  }
}

async function getProfilePayload(userId: string) {
  const [userProfile, profileMetaState, notebooksCount, notesCount, flashcardsCount, completedSessions, weeklyStudySeconds, recentPages, recentNotebooks] =
    await Promise.all([
      prisma.userProfile.findUnique({ where: { id: userId } }),
      prisma.workspaceState.findUnique({
        where: { userId_key: { userId, key: PROFILE_META_KEY } },
      }),
      prisma.notebook.count({ where: { userId } }),
      prisma.page.count({ where: { userId } }),
      prisma.flashcard.count({ where: { userId } }),
      prisma.studySession.count({ where: { userId } }),
      prisma.studySession.aggregate({
        where: {
          userId,
          completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        _sum: { durationSeconds: true },
      }),
      prisma.page.findMany({
        where: { userId },
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.notebook.findMany({
        where: { userId },
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

  const meta = parseMeta(profileMetaState?.activePageId);
  const recentActivity = [...recentPages.map((page) => ({
    id: page.id,
    type: "note" as const,
    title: page.title,
    updatedAt: page.updatedAt,
  })), ...recentNotebooks.map((notebook) => ({
    id: notebook.id,
    type: "notebook" as const,
    title: notebook.title,
    updatedAt: notebook.updatedAt,
  }))]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  const weeklyHours = Number(((weeklyStudySeconds._sum.durationSeconds ?? 0) / 3600).toFixed(1));

  return {
    profile: {
      email: userProfile?.email ?? "",
      displayName: userProfile?.displayName ?? "",
      avatarUrl: userProfile?.imageUrl ?? "",
      fullName: meta.fullName || userProfile?.displayName || "",
      institution: meta.institution,
      major: meta.major,
      studyYear: meta.studyYear,
      primarySubjects: meta.primarySubjects,
      weeklyStudyGoalHours: meta.weeklyStudyGoalHours,
      preferredLearningMethod: meta.preferredLearningMethod,
    },
    stats: {
      totalNotebooks: notebooksCount,
      totalNotes: notesCount,
      flashcardsCreated: flashcardsCount,
      missionsCompleted: completedSessions,
      insightPoints: flashcardsCount * 2 + completedSessions * 5,
      weeklyStudyHours: weeklyHours,
      weeklyStudyGoalHours: meta.weeklyStudyGoalHours,
    },
    recentActivity,
  };
}

export async function GET() {
  const user = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await getProfilePayload(user.id);
  return NextResponse.json(payload);
}

export async function PUT(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<{
    displayName: string;
    avatarUrl: string;
    fullName: string;
    institution: string;
    major: string;
    studyYear: string;
    primarySubjects: string[];
    weeklyStudyGoalHours: number;
    preferredLearningMethod: LearningMethod;
  }>;

  await prisma.userProfile.update({
    where: { id: user.id },
    data: {
      displayName: body.displayName?.trim() || null,
      imageUrl: body.avatarUrl?.trim() || null,
    },
  });

  const sanitizedMeta: ProfileMeta = {
    fullName: body.fullName?.trim() || "",
    institution: body.institution?.trim() || "",
    major: body.major?.trim() || "",
    studyYear: body.studyYear?.trim() || "",
    primarySubjects: (body.primarySubjects ?? [])
      .map((subject) => subject.trim())
      .filter(Boolean),
    weeklyStudyGoalHours: Math.max(1, Number(body.weeklyStudyGoalHours ?? 8)),
    preferredLearningMethod:
      body.preferredLearningMethod === "flashcards" || body.preferredLearningMethod === "video"
        ? body.preferredLearningMethod
        : "reading",
  };

  await prisma.workspaceState.upsert({
    where: { userId_key: { userId: user.id, key: PROFILE_META_KEY } },
    update: { activePageId: JSON.stringify(sanitizedMeta) },
    create: {
      userId: user.id,
      key: PROFILE_META_KEY,
      activePageId: JSON.stringify(sanitizedMeta),
    },
  });

  const payload = await getProfilePayload(user.id);
  return NextResponse.json(payload);
}
