"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ChatRole = "student" | "tutor";
type TutorMode = "learn" | "practice";
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

function practiceGreeting(type: PracticeType) {
  const labelMap: Record<PracticeType, string> = {
    timed_test: "timed test",
    short_answer: "short answer test",
    mcq: "MCQ test",
    fill_ups: "fill-ups test",
    mixed_custom: "mixed pattern test",
    feynman: "Feynman test",
    brainstorm: "brainstorm session",
  };
  if (type === "timed_test") {
    return `Practice mode is ready for a ${labelMap[type]}. In your first prompt, include topic, level, difficulty, number of questions, and total minutes.`;
  }
  if (type === "brainstorm") {
    return "Brainstorm mode is ready. Send the topic you want to explore, and I’ll teach it briefly, challenge your thinking, and keep asking sharper follow-up questions.";
  }
  if (type === "feynman") {
    return "Feynman mode is ready. Send the topic, and I’ll explain it simply, then ask you to teach it back and spot any gaps.";
  }
  return `Practice mode is ready for a ${labelMap[type]}. Send the topic you want to study, and I’ll generate questions that build from basics to deeper reasoning.`;
}

function formatTimer(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
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

interface AttachmentContext {
  name: string;
  type: string;
  size: number;
  extractedText: string;
}

function parseQuestionCount(raw: string): number | null {
  const text = raw.toLowerCase();
  const match =
    text.match(/(\d+)\s*(?:questions?|qs?)\b/) ??
    text.match(/\b(?:questions?|qs?)\s*(?:of|=|:)?\s*(\d+)\b/) ??
    text.match(/\b(\d+)\b/);
  const count = match?.[1] ? Number(match[1]) : NaN;
  if (!Number.isFinite(count) || count <= 0 || count > 200) return null;
  return Math.floor(count);
}

function parseMinutes(raw: string): number | null {
  const text = raw.toLowerCase();
  const match =
    text.match(/(\d+)\s*(?:mins?|minutes?)\b/) ??
    text.match(/\b(?:time|duration)\s*(?:of|=|:)?\s*(\d+)\b/);
  const mins = match?.[1] ? Number(match[1]) : NaN;
  if (!Number.isFinite(mins) || mins <= 0 || mins > 600) return null;
  return Math.floor(mins);
}

function hasQuestionLikeContent(text: string) {
  return /(^|\n)\s*(\d+[\).]|q\d+[:.)]|question\s*\d+[:.)])/.test(text) || /\?/.test(text);
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
  const [practiceConfigured, setPracticeConfigured] = useState(false);
  const [practiceQuestionCount, setPracticeQuestionCount] = useState<number | null>(null);
  const [practiceTimedMinutes, setPracticeTimedMinutes] = useState<number | null>(null);
  const [timedTestStarted, setTimedTestStarted] = useState(false);
  const [timedTestExpired, setTimedTestExpired] = useState(false);
  const [timedTestEvaluated, setTimedTestEvaluated] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const [learnFiles, setLearnFiles] = useState<File[]>([]);
  const [learnAttachmentContext, setLearnAttachmentContext] = useState<AttachmentContext[]>([]);
  const seededRef = useRef(false);
  const chatAttachRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef("");
  const timedTestAutoSubmitRef = useRef(false);
  const activeRequestAbortRef = useRef<AbortController | null>(null);

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

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ block: "end" });
    });
  }, [messages]);

  const contextOneLiner = useMemo(() => {
    const weak = profile?.summary.topInconsistentTopics?.[0]?.conceptId;
    return weak ? `Last time you mixed up ${weak}. Explain mechanism first, then one counter-example.` : "Focus today: retrieval first, then correction.";
  }, [profile]);

  const allSessions = profile?.sessions ?? [];
  const visibleSessions = showAllSessions ? allSessions : allSessions.slice(0, 4);
  useEffect(() => {
    if (!timerRunning || practiceType !== "timed_test" || !timedTestStarted) return;
    const timer = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timerRunning, practiceType, timedTestStarted]);

  useEffect(() => {
    if (mode !== "practice" || practiceType !== "timed_test") return;
    if (!timedTestStarted || timedTestExpired || timerSecondsLeft > 0) return;

    setTimedTestExpired(true);
    setTimerRunning(false);
    activeRequestAbortRef.current?.abort();
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "tutor" && last.text === "Time is up. This test has ended.") return prev;
      return [...prev, { id: uid(), role: "tutor", text: "Time is up. This test has ended." }];
    });
  }, [mode, practiceType, timedTestExpired, timedTestStarted, timerSecondsLeft]);

  const resetPracticeChatForOption = (nextType: PracticeType) => {
    setConversationId(null);
    setInput("");
    setPracticeConfigured(false);
    setPracticeQuestionCount(null);
    setPracticeTimedMinutes(null);
    setTimedTestStarted(false);
    setTimedTestExpired(false);
    setTimedTestEvaluated(false);
    timedTestAutoSubmitRef.current = false;
    setTimerSecondsLeft(0);
    setTimerRunning(false);
    activeRequestAbortRef.current?.abort();
    activeRequestAbortRef.current = null;
    setMessages([{ id: uid(), role: "tutor", text: practiceGreeting(nextType) }]);
  };

  const handlePracticeTypeSelect = (nextType: PracticeType) => {
    setPracticeType(nextType);
    setTimerRunning(false);
    resetPracticeChatForOption(nextType);
  };

  const handleModeSelect = (nextMode: TutorMode) => {
    setMode(nextMode);
    setError(null);
    if (nextMode === "practice") {
      setTimerRunning(false);
      resetPracticeChatForOption(practiceType);
      return;
    }
    setConversationId(null);
    setMessages([{ id: uid(), role: "tutor", text: introMessage(profile) }]);
  };

  const sendChatText = async (rawText: string, options: { timedOutSubmission?: boolean } = {}) => {
    const trimmed = rawText.trim();
    if (!trimmed || loading) return;
    let effectiveQuestionCount = practiceQuestionCount;
    let effectiveTimedMinutes = practiceTimedMinutes;
    if (mode === "practice" && !practiceConfigured) {
      const parsedQuestions = parseQuestionCount(trimmed);
      const parsedMinutes = practiceType === "timed_test" ? parseMinutes(trimmed) : null;
      if (practiceType === "timed_test" && (!parsedQuestions || !parsedMinutes)) {
        const askText =
          practiceType === "timed_test"
            ? "Before we begin, tell me both values in one message: number of questions and total time in minutes. Example: 10 questions, 15 minutes."
            : "Before we begin, tell me how many questions you want. Example: 8 questions.";
        setMessages((prev) => [...prev, { id: uid(), role: "student", text: trimmed }, { id: uid(), role: "tutor", text: askText }]);
        setInput("");
        return;
      }
      setPracticeConfigured(true);
      if (parsedQuestions) {
        setPracticeQuestionCount(parsedQuestions);
        effectiveQuestionCount = parsedQuestions;
      } else if (practiceType === "brainstorm" || practiceType === "feynman") {
        effectiveQuestionCount = 5;
      }
      if (practiceType === "timed_test" && parsedMinutes) {
        setPracticeTimedMinutes(parsedMinutes);
        effectiveTimedMinutes = parsedMinutes;
      }
    }
    const finalMessage = `${
      mode === "practice"
        ? buildModePromptPrefix({ timedOutSubmission: options.timedOutSubmission, effectiveQuestionCount, effectiveTimedMinutes })
        : buildModePromptPrefix()
    }\n\nStudent request: ${trimmed}`;
    const historyForRequest = messages.map((msg) => ({ role: msg.role, text: msg.text }));

    setMessages((prev) => [...prev, { id: uid(), role: "student", text: trimmed }]);
    setInput("");
    setLoading(true);
    setError(null);

    const placeholderId = uid();
    setMessages((prev) => [...prev, { id: placeholderId, role: "tutor", text: "" }]);

    try {
      const abortController = new AbortController();
      activeRequestAbortRef.current = abortController;
      const response = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          message: finalMessage,
          conversationId: conversationId ?? undefined,
          mode,
          history: historyForRequest,
          context: {
            studentProfile: profile,
            sessionHistory: allSessions,
            practiceType,
            practiceQuestionCount,
            practiceTimedMinutes,
            learnFiles: learnFiles.map((f) => ({ name: f.name, type: f.type, size: f.size })),
            learnAttachmentContext: learnAttachmentContext.map((item) => ({ name: item.name, extractedText: item.extractedText.slice(0, 3000) })),
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
        if (
          mode === "practice" &&
          practiceType === "timed_test" &&
          !timedTestStarted &&
          !timedTestExpired &&
          Boolean(effectiveTimedMinutes && effectiveTimedMinutes > 0) &&
          hasQuestionLikeContent(acc)
        ) {
          setTimedTestStarted(true);
          setTimerSecondsLeft((effectiveTimedMinutes ?? 0) * 60);
          setTimerRunning(true);
        }
        setMessages((prev) => prev.map((msg) => (msg.id === placeholderId ? { ...msg, text: acc } : msg)));
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setMessages((prev) => prev.filter((msg) => msg.id !== placeholderId));
        return;
      }
      setMessages((prev) => prev.filter((msg) => msg.id !== placeholderId));
      setError(err instanceof Error ? err.message : "Tutor response failed");
    } finally {
      if (activeRequestAbortRef.current?.signal.aborted) {
        activeRequestAbortRef.current = null;
      }
      if (options.timedOutSubmission) {
        setTimedTestEvaluated(true);
      }
      setLoading(false);
      void loadProfile();
    }
  };

  const sendChat = async () => {
    await sendChatText(input);
  };

  const extractAttachmentContext = useCallback(async (files: File[]) => {
    if (!files.length) {
      setLearnAttachmentContext([]);
      return;
    }
    const contexts = await Promise.all(
      files.map(async (file) => {
        try {
          const formData = new FormData();
          formData.append("file", file);
          const response = await fetch("/api/pdf-extract", { method: "POST", body: formData });
          if (!response.ok) throw new Error("extract-failed");
          const payload = (await response.json()) as { text?: string };
          const extractedText = (payload.text ?? "").trim().slice(0, 8000);
          return { name: file.name, type: file.type, size: file.size, extractedText };
        } catch {
          return { name: file.name, type: file.type, size: file.size, extractedText: "" };
        }
      }),
    );
    setLearnAttachmentContext(contexts.filter((item) => item.extractedText.length > 0));
  }, []);

  useEffect(() => {
    if (mode !== "practice" || practiceType !== "timed_test") return;
    if (!timedTestStarted || timedTestExpired || timerSecondsLeft > 0 || timedTestAutoSubmitRef.current) return;

    timedTestAutoSubmitRef.current = true;
    setTimedTestExpired(true);
    setTimerRunning(false);
    activeRequestAbortRef.current?.abort();

    const submittedAnswer = inputRef.current.trim();
    if (!submittedAnswer) {
      setTimedTestEvaluated(true);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "tutor" && last.text === "Time is up. This test has ended.") return prev;
        return [...prev, { id: uid(), role: "tutor", text: "Time is up. This test has ended. You can keep chatting below." }];
      });
      return;
    }

    void sendChatText(submittedAnswer, { timedOutSubmission: true });
  }, [mode, practiceType, timedTestExpired, timedTestStarted, timerSecondsLeft]);

  const buildModePromptPrefix = (options?: {
    timedOutSubmission?: boolean;
    effectiveQuestionCount?: number | null;
    effectiveTimedMinutes?: number | null;
  }) => {
    if (mode === "practice") {
      if (practiceType === "timed_test" && options?.timedOutSubmission) {
        return `Practice mode: timed test. Time has expired, so evaluate the student's submitted answers now, give corrections and scoring, then continue normally if the student asks follow-up questions. Total questions: ${options.effectiveQuestionCount ?? "not set"}. Timed minutes: ${options.effectiveTimedMinutes ?? "not set"}.`;
      }
      if (practiceType === "timed_test" && timedTestEvaluated) {
        return `Practice mode: timed test completed. The student's answers have already been evaluated, so continue the conversation naturally as a tutor. Total questions: ${practiceQuestionCount ?? "not set"}. Timed minutes: ${practiceTimedMinutes ?? "not set"}.`;
      }
      if (practiceType === "brainstorm") {
        return `Practice mode: brainstorm. Stay strictly on the student's topic. Give a short useful explanation first, then ask 3-5 strategic follow-up questions that probe why, how, what-if, comparisons, edge cases, and misconceptions. Do not ask for a question count. Do not drift to unrelated topics.`;
      }
      if (practiceType === "feynman") {
        return `Practice mode: feynman. Explain the student's topic simply and clearly, then ask them to restate it in their own words and identify any gaps. Follow with a few probing questions that reveal misconceptions. Do not ask for a question count.`;
      }
      return `Practice mode: ${practiceType}. Use the student's topic as the anchor. Ask questions that progress from basic understanding to application and reasoning. If a question count was provided, respect it; otherwise use a sensible default of 5. Do not invent a topic.`;
    }
    const attachmentContext = learnAttachmentContext
      .map((item, index) => `Source ${index + 1} (${item.name}): ${item.extractedText.slice(0, 4000)}`)
      .join("\n\n");
    return `Learn mode. Use uploaded references if provided: ${learnFiles.map((f) => f.name).join(", ") || "none"}.\n${attachmentContext ? `Attached source text:\n${attachmentContext}` : ""}`;
  };

  return (
    <main className="min-h-screen bg-[#f6f1e9] px-4 pb-10 pt-32">
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-stretch">
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

        <section className="flex min-h-[calc(100vh-8rem)] flex-col rounded-2xl border border-[#dccbb4] bg-[#fffdf8] shadow-sm">
          <header className="border-b border-[#eadfcf] px-4 py-3">
            <h1 className="font-serif text-2xl text-[#4f3d2d]">The Tutor</h1>
            <p className="text-xs text-[#8e775e]">A personal AI tutor that asks before it tells.</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {([["learn", "Learn"], ["practice", "Practice"]] as Array<[TutorMode, string]>).map(([value, label]) => (
                <button key={value} onClick={() => handleModeSelect(value)} className={`rounded-md border px-2 py-1 text-xs ${mode === value ? "border-[#8a7559] bg-[#efe5d5] text-[#5d4a34]" : "border-[#d8c6b2] text-[#7d6850]"}`}>{label}</button>
              ))}
            </div>
            {error ? <p className="mt-1 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p> : null}
          </header>

          <div className="border-b border-[#eadfcf] px-4 py-3 space-y-2">
            {mode === "learn" ? (
              <div>
                <p className="text-xs text-[#8e775e]">Use the Attach button near chat input to add image/PDF doubts.</p>
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
                    <button key={value} onClick={() => handlePracticeTypeSelect(value)} className={`rounded-md border px-2 py-1 text-xs ${practiceType === value ? "border-[#8a7559] bg-[#efe5d5] text-[#5d4a34]" : "border-[#d8c6b2] text-[#7d6850]"}`}>{label}</button>
                  ))}
                </div>
                <p className="text-[11px] text-[#7d6850]">
                  First prompt flow: include number of questions. For timed test, include both question count and time in minutes.
                </p>
                {practiceType === "timed_test" ? (
                  <div className="rounded-lg border border-[#d8c6b2] bg-white p-2">
                <p className="text-[11px] text-[#7d6850]">Live timer ({practiceQuestionCount ?? "?"} questions)</p>
                    <p className={`mt-0.5 text-xl font-bold ${timedTestExpired ? "text-red-700" : timerSecondsLeft <= 30 && timedTestStarted ? "text-red-600" : "text-[#5d4a34]"}`}>
                      {timedTestStarted ? formatTimer(timerSecondsLeft) : "Waiting"}
                    </p>
                    <p className="mt-1 text-[11px] text-[#7d6850]">
                      {timedTestEvaluated
                        ? "Time ended. Your answers were submitted and you can keep chatting below."
                        : timedTestExpired
                          ? "Time ended. Your answers are being submitted now."
                          : timedTestStarted
                            ? "Timer started with the first question."
                            : "Timer will start when the first question appears."}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

          </div>

          <div className="flex-1 min-h-0 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((message) => (
              <div key={message.id} className={`max-w-[86%] rounded-xl px-3 py-2 text-sm ${message.role === "tutor" ? "bg-[#efe5d5] text-[#5d4a34]" : "ml-auto bg-[#8a7559] text-white"}`}>
                {message.role === "tutor" && message.text.trim().length === 0 ? <TutorTypingLoader /> : renderTutorMessage(message.text)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <footer className="flex-none border-t border-[#eadfcf] bg-[#fffdf8] px-4 pb-4 pt-3">
            <div className="flex gap-2">
              <input
                ref={chatAttachRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setLearnFiles(files);
                  void extractAttachmentContext(files);
                }}
              />
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendChat(); } }} placeholder={mode === "practice" && practiceType === "timed_test" && timedTestExpired && !timedTestEvaluated ? "Time is up. Sending your answers now..." : "Explain your current understanding..."} className="h-20 flex-1 rounded-md border border-[#d8c6b2] p-2 text-sm text-[#5d4a34] disabled:cursor-not-allowed disabled:bg-[#f4efe7]" />
              <button
                onClick={() => chatAttachRef.current?.click()}
                className="rounded-md border border-[#d8c6b2] px-3 py-2 text-xs font-semibold text-[#6c5944]"
                title="Attach PDF or image"
              >
                Attach
              </button>
              <button onClick={() => void sendChat()} disabled={loading} className="rounded-md bg-[#8a7559] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Sending..." : "Send"}</button>
            </div>
            {learnFiles.length > 0 ? <p className="mt-1 text-[11px] text-[#7d6850]">Attached: {learnFiles.map((f) => f.name).join(", ")}</p> : null}
            {mode === "learn" && learnAttachmentContext.length > 0 ? (
              <p className="mt-1 text-[11px] text-[#7d6850]">Source-ready: {learnAttachmentContext.map((item) => item.name).join(", ")}</p>
            ) : null}
          </footer>
        </section>
      </div>
    </main>
  );
}
