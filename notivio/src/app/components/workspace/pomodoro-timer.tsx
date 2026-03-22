"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, BookOpen, X, Timer } from "lucide-react";

interface PomodoroTimerProps {
  onSessionComplete?: (type: "study" | "break", durationSeconds: number) => void;
}

const STUDY_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

export function PomodoroTimer({ onSessionComplete }: PomodoroTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [sessions, setSessions] = useState(0);
  const [totalStudySeconds, setTotalStudySeconds] = useState(0);
  const [isMinimized, setIsMinimized] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("studyspace-pomodoro");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        sessions?: number;
        totalStudySeconds?: number;
        isMinimized?: boolean;
      };
      setSessions(parsed.sessions ?? 0);
      setTotalStudySeconds(parsed.totalStudySeconds ?? 0);
      setIsMinimized(parsed.isMinimized ?? true);
    } catch {
      // ignore malformed local state
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "studyspace-pomodoro",
      JSON.stringify({ sessions, totalStudySeconds, isMinimized })
    );
  }, [sessions, totalStudySeconds, isMinimized]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        if (!isBreak) setTotalStudySeconds((prev) => prev + 1);
      }, 1000);
    }

    if (timeLeft === 0) {
      if (!isBreak) {
        setSessions((prev) => prev + 1);
        onSessionComplete?.("study", STUDY_TIME);
        setIsBreak(true);
        setTimeLeft(BREAK_TIME);
      } else {
        onSessionComplete?.("break", BREAK_TIME);
        setIsBreak(false);
        setTimeLeft(STUDY_TIME);
        setIsRunning(false);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, isBreak, onSessionComplete]);

  const toggleRun = () => setIsRunning(!isRunning);
  const reset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(STUDY_TIME);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = isBreak
    ? ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100
    : ((STUDY_TIME - timeLeft) / STUDY_TIME) * 100;

  const formatTotalTime = () => {
    const hrs = Math.floor(totalStudySeconds / 3600);
    const mins = Math.floor((totalStudySeconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={`fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg border transition-all duration-300 hover:scale-105 ${
          isRunning
            ? isBreak
              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300 animate-pulse"
              : "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
            : "bg-[#1a1a2e] border-white/10 text-white/40 hover:text-white/60"
        }`}
        title="Pomodoro Timer"
      >
        <Timer className="w-5 h-5" />
        {isRunning && (
          <span className="absolute -top-1 -right-1 text-[10px] font-mono font-bold bg-[#1a1a2e] border border-white/10 rounded-full px-1.5 py-0.5">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-64 bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          {isBreak ? (
            <Coffee className="w-4 h-4 text-emerald-400" />
          ) : (
            <BookOpen className="w-4 h-4 text-indigo-400" />
          )}
          <span className="text-xs font-medium text-white/60">
            {isBreak ? "Break Time" : "Study Session"}
          </span>
        </div>
        <button onClick={() => setIsMinimized(true)} className="p-1 rounded hover:bg-white/5 text-white/30">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Timer */}
      <div className="px-4 py-5 text-center">
        {/* Circular progress */}
        <div className="relative w-28 h-28 mx-auto mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke={isBreak ? "rgb(52,211,153)" : "rgb(99,102,241)"}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
              className="transition-all duration-1000 ease-linear"
              style={{ opacity: 0.6 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono font-bold text-white/80">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/50 transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleRun}
            className={`p-3 rounded-xl transition-all duration-200 ${
              isBreak
                ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
                : "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300"
            }`}
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <div className="w-10" /> {/* Spacer for symmetry */}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between text-xs text-white/30">
        <span>{sessions} sessions</span>
        <span>{formatTotalTime()} studied</span>
      </div>
    </div>
  );
}
