"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ChatRole = "student" | "tutor";

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  meta?: string;
}

interface SessionCard {
  date: string;
  topic: string;
  summary: string;
  strength: "green" | "amber" | "red";
}

interface TutorProfileResponse {
  preferredTone: string;
  preferredPersona: string;
  memoryEnabled: boolean;
  sessions: SessionCard[];
  openingContext: {
    isFirstSession: boolean;
    daysSinceLastSession: number | null;
    lastTopic: string | null;
  };
  summary: {
    topStrengths: Array<{ conceptId: string; correctRate: number }>;
    topInconsistentTopics: Array<{ conceptId: string; correctRate: number }>;
    recommendedHabit: string;
  };
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function introMessage(profile: TutorProfileResponse | null) {
  if (!profile) {
    return "Hello, I am your tutor. Before we start, tell me what subject you are working on and how confident you feel right now.";
  }

  const { openingContext } = profile;
  if (openingContext.isFirstSession) {
    return "Hey! I am your tutor. I will challenge you honestly, remember what we work on, and help you understand instead of memorizing. First: what subject are you studying right now, and how are you feeling about it?";
  }

  if ((openingContext.daysSinceLastSession ?? 99) === 0) {
    return "Welcome back already, good sign. How did the rest of your day go after our last session? What actually stuck?";
  }

  if ((openingContext.daysSinceLastSession ?? 99) <= 3) {
    return `Good to see you again. Last time we worked on ${openingContext.lastTopic ?? "your previous topic"}. Before we continue, tell me what you still remember in your own words.`;
  }

  return `Welcome back. It has been a few days since we worked on ${openingContext.lastTopic ?? "your previous topic"}. Give me a quick memory check before we move forward.`;
}

export function TutorClient() {
  const [profile, setProfile] = useState<TutorProfileResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [examName, setExamName] = useState("Upcoming Exam");
  const [examDate, setExamDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [endingSession, setEndingSession] = useState(false);
  const seededRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/tutor/profile");
      if (!response.ok) return;
      const data = (await response.json()) as TutorProfileResponse;
      setProfile(data);
    };
    void load();
  }, []);

  useEffect(() => {
    if (!profile || seededRef.current) return;
    seededRef.current = true;
    const timer = setTimeout(() => {
      setMessages([
        {
          id: uid(),
          role: "tutor",
          text: introMessage(profile),
          meta: "Tutor opening",
        },
      ]);
    }, 1500);
    return () => clearTimeout(timer);
  }, [profile]);

  const contextOneLiner = useMemo(() => {
    const weak = profile?.summary.topInconsistentTopics?.[0]?.conceptId;
    if (!weak) return "Focus today: retrieval first, then correction.";
    return `Last time you mixed up ${weak}. Explain mechanism first, then one counter-example.`;
  }, [profile]);

  const sendChat = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { id: uid(), role: "student", text: trimmed }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          state: { failedAttempts, confidence: 0.6, recentCorrectRate: 0.6 },
          context: {
            studentProfile: profile,
            sessionHistory: profile?.sessions ?? [],
          },
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Tutor response failed");
      }

      const data = (await response.json()) as {
        tutorReply: string;
        mode: "encouraging" | "direct" | "curious";
        rootCause?: string;
        remediation?: string[];
        shouldEscalate: boolean;
      };

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "tutor",
          text: data.tutorReply,
          meta: [
            `mode: ${data.mode}`,
            data.rootCause ? `root cause: ${data.rootCause}` : "",
            data.remediation?.length ? `fix: ${data.remediation.join("; ")}` : "",
          ]
            .filter(Boolean)
            .join(" | "),
        },
      ]);
      setFailedAttempts((value) => (data.shouldEscalate ? value + 1 : 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tutor response failed");
    } finally {
      setLoading(false);
    }
  };

  const runExamBrief = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/tutor/exam-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examName, examDate }),
      });
      if (!response.ok) throw new Error("Exam briefing failed");
      const data = (await response.json()) as {
        briefing: string;
        prioritizedTopics?: string[];
        "30minPlan"?: string[];
      };
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "tutor",
          text: data.briefing,
          meta: [
            ...(data.prioritizedTopics ?? []).slice(0, 3),
            ...(data["30minPlan"] ?? []).slice(0, 2),
          ].join(" | "),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Exam briefing failed");
    } finally {
      setLoading(false);
    }
  };

  const endSession = () => {
    if (endingSession) return;
    setEndingSession(true);
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "tutor",
        text: "Before you go, without looking at anything, what is the one thing from today you want to remember? One sentence only.",
        meta: "Closing 1/3",
      },
      {
        id: uid(),
        role: "tutor",
        text:
          "Honest summary: you are improving on recall, but your application step still needs cleaner reasoning. Next session we should focus on one worked example chain.",
        meta: "Closing 2/3",
      },
      {
        id: uid(),
        role: "tutor",
        text: "Next session hook: we will pick up exactly from your weakest application pattern. I will remember this point.",
        meta: "Closing 3/3",
      },
    ]);
  };

  return (
    <main className="min-h-screen bg-[#f6f1e9] px-4 pb-16 pt-32">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#dccbb4] bg-[#fffdf8] p-4 shadow-sm">
          <h2 className="font-serif text-xl text-[#4f3d2d]">Session History</h2>
          <p className="mt-1 text-xs text-[#8e775e]">{contextOneLiner}</p>
          <div className="mt-3 space-y-2">
            {(profile?.sessions ?? []).length === 0 ? (
              <p className="rounded-lg bg-[#f5ebdd] p-2 text-xs text-[#7a6852]">
                No prior tutor sessions yet.
              </p>
            ) : (
              (profile?.sessions ?? []).map((session) => (
                <div key={`${session.date}-${session.topic}`} className="rounded-lg border border-[#e8dccd] bg-white p-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#5d4a34]">{session.topic}</p>
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${
                        session.strength === "green"
                          ? "bg-green-500"
                          : session.strength === "red"
                            ? "bg-red-500"
                            : "bg-amber-500"
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[#8e775e]">{session.date}</p>
                  <p className="mt-1 text-[11px] text-[#6f5b43] line-clamp-2">{session.summary}</p>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="flex min-h-[74vh] flex-col rounded-2xl border border-[#dccbb4] bg-[#fffdf8] shadow-sm">
          <header className="border-b border-[#eadfcf] px-4 py-3">
            <h1 className="font-serif text-2xl text-[#4f3d2d]">The Tutor</h1>
            <p className="text-xs text-[#8e775e]">A personal AI tutor that asks before it tells.</p>
            {error ? (
              <p className="mt-1 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p>
            ) : null}
          </header>

          <div className="flex-1 space-y-3 overflow-auto px-4 py-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[86%] rounded-xl px-3 py-2 text-sm ${
                  message.role === "tutor"
                    ? "bg-[#efe5d5] text-[#5d4a34]"
                    : "ml-auto bg-[#8a7559] text-white"
                }`}
              >
                <p>{message.text}</p>
                {message.meta ? <p className="mt-1 text-[11px] opacity-80">{message.meta}</p> : null}
              </div>
            ))}
          </div>

          <div className="border-t border-[#eadfcf] px-4 py-2">
            <p className="text-xs text-[#8e775e]">Your tutor is ready.</p>
          </div>

          <footer className="px-4 pb-4">
            <div className="mb-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px_140px_130px]">
              <input
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Exam name"
                className="rounded-md border border-[#d8c6b2] px-2 py-1.5 text-xs text-[#5d4a34]"
              />
              <input
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                type="date"
                className="rounded-md border border-[#d8c6b2] px-2 py-1.5 text-xs text-[#5d4a34]"
              />
              <button
                onClick={() => void runExamBrief()}
                disabled={loading}
                className="rounded-md border border-[#d8c6b2] px-2 py-1.5 text-xs text-[#6f5b43] disabled:opacity-60"
              >
                Pre-Exam Brief
              </button>
              <button
                onClick={endSession}
                disabled={endingSession}
                className="rounded-md border border-[#d8c6b2] px-2 py-1.5 text-xs text-[#6f5b43] disabled:opacity-60"
              >
                End Session
              </button>
            </div>

            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendChat();
                  }
                }}
                placeholder="Explain your current understanding..."
                className="h-20 flex-1 rounded-md border border-[#d8c6b2] p-2 text-sm text-[#5d4a34]"
              />
              <button
                onClick={() => void sendChat()}
                disabled={loading}
                className="rounded-md bg-[#8a7559] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
