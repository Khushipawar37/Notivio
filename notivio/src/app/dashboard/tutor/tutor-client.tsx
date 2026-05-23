"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ChatRole = "student" | "tutor";
type TutorMode = "learn" | "practice" | "planner";
type PracticeType = "timed_test" | "short_answer" | "mcq" | "fill_ups" | "mixed_custom" | "feynman" | "brainstorm";

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
}

interface SessionCard {
  id: string;
  date: string;
  topic: string;
  summary: string;
  strength: "green" | "amber" | "red";
  messageCount?: number;
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
  if (!profile) return "Hello, I am your tutor. Tell me what you want to study right now and your current level.";
  if (profile.openingContext.isFirstSession) return "Welcome. What do you want to study today?";
  if (profile.openingContext.lastTopic && profile.openingContext.lastTopic.toLowerCase() !== "general") {
    return `Welcome back. We can continue from ${profile.openingContext.lastTopic}, or switch topics.`;
  }
  return "Welcome back. What do you want to study right now?";
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function renderTutorMessage(text: string) {
  return text.split("\n").map((line, i) => <p key={`${line}-${i}`} className="whitespace-pre-wrap leading-relaxed">{renderInlineBold(line)}</p>);
}

function TutorTypingLoader() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#d6c3ad] bg-[#f7ecdd] px-2.5 py-1">
      {[0, 1, 2].map((index) => (
        <span key={index} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8a7559]" style={{ animationDelay: `${index * 0.14}s`, animationDuration: "0.9s" }} />
      ))}
    </div>
  );
}

export function TutorClient() {
  const [profile, setProfile] = useState<TutorProfileResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<TutorMode>("learn");
  const [error, setError] = useState<string | null>(null);
  const [practiceType, setPracticeType] = useState<PracticeType>("timed_test");
  const [customPracticeFormat, setCustomPracticeFormat] = useState("");
  const [testDurationMins, setTestDurationMins] = useState("30");
  const [plannerExamDate, setPlannerExamDate] = useState("");
  const [plannerDailyHours, setPlannerDailyHours] = useState("4");
  const [learnFiles, setLearnFiles] = useState<File[]>([]);
  const [plannerDatesheet, setPlannerDatesheet] = useState<File | null>(null);
  const [plannerSyllabus, setPlannerSyllabus] = useState<File | null>(null);
  const seededRef = useRef(false);

  const loadProfile = useCallback(async () => {
    const response = await fetch("/api/tutor/profile");
    if (!response.ok) return;
    setProfile((await response.json()) as TutorProfileResponse);
  }, []);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    setMessages([{ id: uid(), role: "tutor", text: introMessage(profile) }]);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    setMessages((prev) => (prev.length === 1 && prev[0]?.role === "tutor" ? [{ ...prev[0], text: introMessage(profile) }] : prev));
  }, [profile]);

  const contextOneLiner = useMemo(() => {
    const weak = profile?.summary.topInconsistentTopics?.[0]?.conceptId;
    return weak ? `Last time you mixed up ${weak}. Explain mechanism first, then one counter-example.` : "Focus today: retrieval first, then correction.";
  }, [profile]);

  const allSessions = profile?.sessions ?? [];
  const visibleSessions = showAllSessions ? allSessions : allSessions.slice(0, 4);

  const buildModePromptPrefix = () => {
    if (mode === "practice") {
      return `Practice mode: ${practiceType}. Duration: ${testDurationMins} mins. Custom format: ${customPracticeFormat || "none"}. Generate questions first, wait for answers, then evaluate.`;
    }
    if (mode === "planner") {
      return `Planner mode. Exam date: ${plannerExamDate || "not provided"}. Daily hours: ${plannerDailyHours}. Create a deep timetable by subjects then units/topics. Ask for missing datesheet/syllabus details if needed.`;
    }
    return `Learn mode. Use uploaded references if provided: ${learnFiles.map((f) => f.name).join(", ") || "none"}.`;
  };

  const sendChat = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const finalMessage = `${buildModePromptPrefix()}\n\nStudent request: ${trimmed}`;
    const historyForRequest = messages.map((msg) => ({ role: msg.role, text: msg.text }));

    setMessages((prev) => [...prev, { id: uid(), role: "student", text: trimmed }]);
    setInput("");
    setLoading(true);
    setError(null);

    const placeholderId = uid();
    setMessages((prev) => [...prev, { id: placeholderId, role: "tutor", text: "" }]);

    try {
      const response = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: finalMessage,
          conversationId: conversationId ?? undefined,
          mode,
          history: historyForRequest,
          context: {
            studentProfile: profile,
            sessionHistory: allSessions,
            practiceType,
            testDurationMins,
            customPracticeFormat,
            plannerExamDate,
            plannerDailyHours,
            learnFiles: learnFiles.map((f) => ({ name: f.name, type: f.type, size: f.size })),
            datesheetFile: plannerDatesheet ? { name: plannerDatesheet.name, type: plannerDatesheet.type, size: plannerDatesheet.size } : null,
            syllabusFile: plannerSyllabus ? { name: plannerSyllabus.name, type: plannerSyllabus.type, size: plannerSyllabus.size } : null,
          },
        }),
      });

      if (!response.ok) throw new Error((await response.text()) || "Tutor response failed");
      const nextConversationId = response.headers.get("X-Conversation-Id");
      if (nextConversationId) setConversationId(nextConversationId);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Tutor stream unavailable");
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        acc += decoder.decode(chunk.value, { stream: true });
        setMessages((prev) => prev.map((msg) => (msg.id === placeholderId ? { ...msg, text: acc } : msg)));
      }
    } catch (err) {
      setMessages((prev) => prev.filter((msg) => msg.id !== placeholderId));
      setError(err instanceof Error ? err.message : "Tutor response failed");
    } finally {
      setLoading(false);
      void loadProfile();
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f1e9] px-4 pb-16 pt-32">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#dccbb4] bg-[#fffdf8] p-4 shadow-sm">
          <h2 className="font-serif text-xl text-[#4f3d2d]">Session History</h2>
          <p className="mt-1 text-xs text-[#8e775e]">{contextOneLiner}</p>
          <div className="mt-3 space-y-2">
            {allSessions.length === 0 ? <p className="rounded-lg bg-[#f5ebdd] p-2 text-xs text-[#7a6852]">No prior tutor sessions yet.</p> : visibleSessions.map((session) => (
              <div key={session.id} className="rounded-lg border border-[#e8dccd] bg-white p-2">
                <div className="flex items-center justify-between"><p className="text-xs font-semibold text-[#5d4a34]">{session.topic}</p><span className={`inline-block h-2.5 w-2.5 rounded-full ${session.strength === "green" ? "bg-green-500" : session.strength === "red" ? "bg-red-500" : "bg-amber-500"}`} /></div>
                <p className="mt-1 text-[11px] text-[#8e775e]">{session.date}</p>
                <p className="mt-1 text-[11px] text-[#6f5b43] line-clamp-2">{session.summary}</p>
              </div>
            ))}
            {allSessions.length > 4 ? <button onClick={() => setShowAllSessions((prev) => !prev)} className="w-full rounded-lg border border-[#d8c6b2] bg-[#f8efe2] px-2 py-1.5 text-xs font-medium text-[#6c5944]">{showAllSessions ? "Show recent 4" : `View more (${allSessions.length - 4})`}</button> : null}
          </div>
        </aside>

        <section className="flex min-h-[74vh] flex-col rounded-2xl border border-[#dccbb4] bg-[#fffdf8] shadow-sm">
          <header className="border-b border-[#eadfcf] px-4 py-3">
            <h1 className="font-serif text-2xl text-[#4f3d2d]">The Tutor</h1>
            <p className="text-xs text-[#8e775e]">A personal AI tutor that asks before it tells.</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {([ ["learn", "Learn"], ["practice", "Practice"], ["planner", "Planner"] ] as Array<[TutorMode, string]>).map(([value, label]) => (
                <button key={value} onClick={() => setMode(value)} className={`rounded-md border px-2 py-1 text-xs ${mode === value ? "border-[#8a7559] bg-[#efe5d5] text-[#5d4a34]" : "border-[#d8c6b2] text-[#7d6850]"}`}>{label}</button>
              ))}
            </div>
            {error ? <p className="mt-1 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p> : null}
          </header>

          <div className="border-b border-[#eadfcf] px-4 py-3 space-y-2">
            {mode === "learn" ? (
              <div>
                <p className="text-xs font-semibold text-[#6f5b43]">Upload doubt references (image or PDF)</p>
                <input type="file" accept="image/*,.pdf" multiple onChange={(e) => setLearnFiles(Array.from(e.target.files ?? []))} className="mt-1 block w-full text-xs" />
                {learnFiles.length > 0 ? <p className="mt-1 text-xs text-[#8e775e]">Attached: {learnFiles.map((f) => f.name).join(", ")}</p> : null}
              </div>
            ) : null}

            {mode === "practice" ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#6f5b43]">Practice session type</p>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    ["timed_test", "Timed Test"],
                    ["short_answer", "Short Answer"],
                    ["mcq", "MCQ"],
                    ["fill_ups", "Fill Ups"],
                    ["mixed_custom", "Mixed Format"],
                    ["feynman", "Feynman Test"],
                    ["brainstorm", "Brainstorm"],
                  ] as Array<[PracticeType, string]>).map(([value, label]) => (
                    <button key={value} onClick={() => setPracticeType(value)} className={`rounded-md border px-2 py-1 text-xs ${practiceType === value ? "border-[#8a7559] bg-[#efe5d5] text-[#5d4a34]" : "border-[#d8c6b2] text-[#7d6850]"}`}>{label}</button>
                  ))}
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <input value={testDurationMins} onChange={(e) => setTestDurationMins(e.target.value)} placeholder="Test duration in mins" className="rounded-md border border-[#d8c6b2] px-2 py-1 text-xs" />
                  <input value={customPracticeFormat} onChange={(e) => setCustomPracticeFormat(e.target.value)} placeholder="Custom pattern (for mixed format)" className="rounded-md border border-[#d8c6b2] px-2 py-1 text-xs" />
                </div>
              </div>
            ) : null}

            {mode === "planner" ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#6f5b43]">Planner intake (datesheet + syllabus)</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <input type="date" value={plannerExamDate} onChange={(e) => setPlannerExamDate(e.target.value)} className="rounded-md border border-[#d8c6b2] px-2 py-1 text-xs" />
                  <input value={plannerDailyHours} onChange={(e) => setPlannerDailyHours(e.target.value)} placeholder="Daily study hours" className="rounded-md border border-[#d8c6b2] px-2 py-1 text-xs" />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div><p className="text-[11px] text-[#7d6850]">Upload datesheet</p><input type="file" accept="image/*,.pdf" onChange={(e) => setPlannerDatesheet(e.target.files?.[0] ?? null)} className="block w-full text-xs" /></div>
                  <div><p className="text-[11px] text-[#7d6850]">Upload syllabus</p><input type="file" accept="image/*,.pdf" onChange={(e) => setPlannerSyllabus(e.target.files?.[0] ?? null)} className="block w-full text-xs" /></div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex-1 space-y-3 overflow-auto px-4 py-3">
            {messages.map((message) => (
              <div key={message.id} className={`max-w-[86%] rounded-xl px-3 py-2 text-sm ${message.role === "tutor" ? "bg-[#efe5d5] text-[#5d4a34]" : "ml-auto bg-[#8a7559] text-white"}`}>
                {message.role === "tutor" && message.text.trim().length === 0 ? <TutorTypingLoader /> : renderTutorMessage(message.text)}
              </div>
            ))}
          </div>

          <footer className="border-t border-[#eadfcf] px-4 pb-4 pt-3">
            <div className="flex gap-2">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendChat(); } }} placeholder="Explain your current understanding..." className="h-20 flex-1 rounded-md border border-[#d8c6b2] p-2 text-sm text-[#5d4a34]" />
              <button onClick={() => void sendChat()} disabled={loading} className="rounded-md bg-[#8a7559] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Sending..." : "Send"}</button>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
