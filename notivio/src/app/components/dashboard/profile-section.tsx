"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, Upload } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Progress } from "../../components/ui/progress";
import StatsRow from "./StatsRow";
import MissionList from "./MissionList";

interface ProfileSectionProps {
  darkMode?: boolean;
}

interface ProfilePayload {
  profile: {
    email: string;
    fullName: string;
    displayName: string;
    avatarUrl: string;
    institution: string;
    major: string;
    studyYear: string;
    primarySubjects: string[];
    weeklyStudyGoalHours: number;
    preferredLearningMethod: "reading" | "flashcards" | "video";
  };
  stats: {
    totalNotebooks: number;
    totalNotes: number;
    flashcardsCreated: number;
    missionsCompleted: number;
    insightPoints: number;
    weeklyStudyHours: number;
    weeklyStudyGoalHours: number;
  };
  recentActivity: Array<{
    id: string;
    type: "note" | "notebook";
    title: string;
    updatedAt: string;
  }>;
}

interface MissionPayload {
  missions: Array<{
    id: string;
    title: string;
    description: string;
    points: number;
    status: string;
  }>;
}

const emptyPayload: ProfilePayload = {
  profile: {
    email: "",
    fullName: "",
    displayName: "",
    avatarUrl: "",
    institution: "",
    major: "",
    studyYear: "",
    primarySubjects: [],
    weeklyStudyGoalHours: 8,
    preferredLearningMethod: "reading",
  },
  stats: {
    totalNotebooks: 0,
    totalNotes: 0,
    flashcardsCreated: 0,
    missionsCompleted: 0,
    insightPoints: 0,
    weeklyStudyHours: 0,
    weeklyStudyGoalHours: 8,
  },
  recentActivity: [],
};

function gravatarFromEmail(email: string): string {
  const safe = encodeURIComponent(email.trim().toLowerCase() || "student@notivio.app");
  return `https://www.gravatar.com/avatar/${safe}?d=identicon&s=200`;
}

export default function ProfileSection({ darkMode = false }: ProfileSectionProps) {
  const [payload, setPayload] = useState<ProfilePayload>(emptyPayload);
  const [missions, setMissions] = useState<MissionPayload["missions"]>([]);
  const [subjectsInput, setSubjectsInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, missionsRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/asc/summary").catch(() => null),
        ]);

        if (!profileRes.ok) throw new Error("Failed to load profile.");

        const profileData = (await profileRes.json()) as ProfilePayload;
        setPayload(profileData);
        setSubjectsInput(profileData.profile.primarySubjects.join(", "));

        if (missionsRes && missionsRes.ok) {
          const missionData = (await missionsRes.json()) as MissionPayload;
          setMissions(missionData.missions ?? []);
        }
      } catch (error) {
        setNotice("Could not load profile data right now.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const avatarPreview = useMemo(() => {
    return payload.profile.avatarUrl || gravatarFromEmail(payload.profile.email);
  }, [payload.profile.avatarUrl, payload.profile.email]);

  const studyProgress = Math.min(
    100,
    Math.round((payload.stats.weeklyStudyHours / Math.max(1, payload.stats.weeklyStudyGoalHours)) * 100),
  );

  const updateProfileField = (field: keyof ProfilePayload["profile"], value: string | number) => {
    setPayload((current) => ({
      ...current,
      profile: { ...current.profile, [field]: value },
    }));
  };

  const saveProfile = async () => {
    setSaving(true);
    setNotice(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload.profile,
          primarySubjects: subjectsInput
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) throw new Error("Profile update failed.");

      const updated = (await response.json()) as ProfilePayload;
      setPayload(updated);
      setSubjectsInput(updated.profile.primarySubjects.join(", "));
      setNotice("Profile updated successfully.");
    } catch {
      setNotice("Unable to save profile right now.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#8a7559]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card
        className={`rounded-xl border shadow-sm ${
          darkMode ? "border-gray-700 bg-gray-800 text-white" : "border-[#c6ac8f]/30 bg-white"
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl text-[#6f5b43]">
            Welcome back, {payload.profile.displayName || "Student"} - here's your study snapshot.
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
            <div className="space-y-3">
              <img
                src={avatarPreview}
                alt="Profile avatar"
                className="h-32 w-32 rounded-full border border-[#c6ac8f]/30 object-cover"
              />
              <label className="block text-xs font-medium text-muted-foreground">Avatar URL</label>
              <div className="flex gap-2">
                <Input
                  value={payload.profile.avatarUrl}
                  onChange={(event) => updateProfileField("avatarUrl", event.target.value)}
                  placeholder="https://..."
                />
                <Button type="button" variant="outline" size="icon" className="shrink-0">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={payload.profile.fullName}
                onChange={(event) => updateProfileField("fullName", event.target.value)}
                placeholder="Full name"
              />
              <Input
                value={payload.profile.displayName}
                onChange={(event) => updateProfileField("displayName", event.target.value)}
                placeholder="Display name"
              />
              <Input
                value={payload.profile.institution}
                onChange={(event) => updateProfileField("institution", event.target.value)}
                placeholder="Institution"
              />
              <Input
                value={payload.profile.major}
                onChange={(event) => updateProfileField("major", event.target.value)}
                placeholder="Major"
              />
              <Input
                value={payload.profile.studyYear}
                onChange={(event) => updateProfileField("studyYear", event.target.value)}
                placeholder="Study year"
              />
              <Input
                type="number"
                min={1}
                value={payload.profile.weeklyStudyGoalHours}
                onChange={(event) =>
                  updateProfileField("weeklyStudyGoalHours", Number(event.target.value))
                }
                placeholder="Weekly study goal (hours)"
              />
              <Input
                className="md:col-span-2"
                value={subjectsInput}
                onChange={(event) => setSubjectsInput(event.target.value)}
                placeholder="Primary subjects (comma separated)"
              />
              <select
                value={payload.profile.preferredLearningMethod}
                onChange={(event) =>
                  updateProfileField(
                    "preferredLearningMethod",
                    event.target.value as ProfilePayload["profile"]["preferredLearningMethod"],
                  )
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm md:col-span-2"
              >
                <option value="reading">Preferred method: Reading</option>
                <option value="flashcards">Preferred method: Flashcards</option>
                <option value="video">Preferred method: Video</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={saveProfile} disabled={saving} className="bg-[#8a7559] hover:bg-[#7a664f]">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save profile
            </Button>
            <Button asChild variant="outline">
              <Link href="/notes">Import from YouTube</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/flashcards">Generate Flashcards</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Create Notebook</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Join Study Circle</Link>
            </Button>
          </div>

          {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
        </CardContent>
      </Card>

      <StatsRow stats={payload.stats} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl border-[#c6ac8f]/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#6f5b43]">Study Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Weekly hours</span>
              <span>
                {payload.stats.weeklyStudyHours}h / {payload.stats.weeklyStudyGoalHours}h
              </span>
            </div>
            <Progress
              value={studyProgress}
              className="h-2 bg-[#c6ac8f]/20"
              indicatorClassName="bg-[#8a7559]"
            />
          </CardContent>
        </Card>

        <Card className="rounded-xl border-[#c6ac8f]/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#6f5b43]">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payload.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent notebooks or notes edited yet.</p>
            ) : (
              payload.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-lg border border-[#c6ac8f]/20 bg-[#fffdf9] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-[#6f5b43]">{activity.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{activity.type}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.updatedAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <MissionList missions={missions} />
    </div>
  );
}
