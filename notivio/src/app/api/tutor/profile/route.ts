import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/server/auth";
import { getOrCreateTutorProfile, listConceptMetrics, listRecentTutorSessions } from "@/server/tutor";

export async function GET() {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile, conceptMetrics, sessions] = await Promise.all([
    getOrCreateTutorProfile(user.id),
    listConceptMetrics(user.id, 30),
    listRecentTutorSessions(user.id, 12),
  ]);

  const strengths = conceptMetrics
    .map((metric) => ({
      conceptId: metric.conceptId,
      correctRate: metric.attempts > 0 ? metric.correct / metric.attempts : 0,
    }))
    .filter((entry) => entry.correctRate >= 0.75)
    .slice(0, 3);

  const inconsistent = conceptMetrics
    .map((metric) => ({
      conceptId: metric.conceptId,
      correctRate: metric.attempts > 0 ? metric.correct / metric.attempts : 0,
    }))
    .filter((entry) => entry.correctRate > 0 && entry.correctRate < 0.75)
    .slice(0, 3);

  const lastSessionDate = sessions[0]?.date ? new Date(`${sessions[0].date}T00:00:00Z`) : null;
  const daysSinceLastSession = lastSessionDate
    ? Math.floor((Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return NextResponse.json({
    id: profile.id,
    preferredTone: profile.preferredTone,
    preferredPersona: profile.preferredPersona,
    memoryEnabled: profile.memoryEnabled,
    studyPatterns: profile.studyPatterns ?? { days: [], times: [] },
    conceptMetrics,
    sessions,
    openingContext: {
      isFirstSession: sessions.length === 0,
      daysSinceLastSession,
      lastTopic: sessions[0]?.topic ?? null,
    },
    summary: {
      topStrengths: strengths,
      topInconsistentTopics: inconsistent,
      recommendedHabit:
        "Use 10-minute blank-page retrieval blocks at your most consistent study time before reading notes.",
    },
  });
}
