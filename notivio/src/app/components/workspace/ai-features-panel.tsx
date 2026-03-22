"use client";

import React, { useCallback, useState } from "react";
import {
  Sparkles,
  FileText,
  Brain,
  Target,
  Zap,
  Lightbulb,
  BookOpen,
  GraduationCap,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Puzzle,
  ClipboardCheck,
} from "lucide-react";

interface AIFeaturesPanelProps {
  content: string;
  selectedText: string;
  onSaveFlashcards?: (cards: Flashcard[]) => void;
  onInsertToNotebook?: (text: string) => void;
}

interface Flashcard {
  question: string;
  answer: string;
}

interface MCQQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface TFQuestion {
  statement: string;
  answer: boolean;
  explanation: string;
}

interface FeynmanEvalResult {
  score: number;
  correct_points: string[];
  vague_points: string[];
  missing_points: string[];
  guidance: string;
}

type FeatureId =
  | "summarize"
  | "explain"
  | "flashcards"
  | "quiz"
  | "enhance"
  | "gap_fill"
  | "feynman"
  | "story"
  | "exam_predict";

async function callAI(feature: string, content: string, extra: Record<string, string> = {}) {
  const res = await fetch("/api/ai-study", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feature, content, ...extra }),
  });
  if (!res.ok) throw new Error("AI request failed");
  const data = await res.json();
  return data.result;
}

function parseJSON(text: string) {
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    const match2 = text.match(/\{[\s\S]*\}/);
    if (match2) return JSON.parse(match2[0]);
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function AIFeaturesPanel({
  content,
  selectedText,
  onSaveFlashcards,
  onInsertToNotebook,
}: AIFeaturesPanelProps) {
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const [summaryMode, setSummaryMode] = useState<"key_points" | "narrative">("key_points");
  const [explainLevel, setExplainLevel] = useState<"simple" | "standard" | "deep">("standard");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [quizType, setQuizType] = useState<"mcq" | "truefalse" | "short">("mcq");
  const [quizDifficulty, setQuizDifficulty] = useState<string>("medium");
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>([]);
  const [tfQuestions, setTfQuestions] = useState<TFQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number | boolean | string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [gapFillResult, setGapFillResult] = useState<{ text_with_blanks: string; answers: string[] } | null>(null);
  const [gapFillUserAnswers, setGapFillUserAnswers] = useState<Record<number, string>>({});
  const [gapFillChecked, setGapFillChecked] = useState(false);
  const [feynmanConcept, setFeynmanConcept] = useState<{ concept: string; prompt: string } | null>(null);
  const [feynmanExplanation, setFeynmanExplanation] = useState("");
  const [feynmanEval, setFeynmanEval] = useState<FeynmanEvalResult | null>(null);

  const textToUse = selectedText || content;
  const hasContent = textToUse.trim().length > 0;

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const pushToNotebook = useCallback(
    (heading: string, body: string) => {
      if (!onInsertToNotebook || !body.trim()) return;
      onInsertToNotebook(`\n\n${heading}\n${body}\n`);
    },
    [onInsertToNotebook]
  );

  const resetFeature = () => {
    setResult("");
    setFlashcards([]);
    setFlippedCards(new Set());
    setMcqQuestions([]);
    setTfQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setGapFillResult(null);
    setGapFillUserAnswers({});
    setGapFillChecked(false);
    setFeynmanConcept(null);
    setFeynmanExplanation("");
    setFeynmanEval(null);
  };

  const handleSummarize = async () => {
    if (!hasContent) return;
    setLoading(true);
    resetFeature();
    try {
      const res = await callAI(`summarize_${summaryMode}`, textToUse);
      setResult(res);
      pushToNotebook("Summary", res);
    } catch {
      setResult("Error generating summary. Please try again.");
    }
    setLoading(false);
  };

  const handleExplain = async () => {
    if (!hasContent) return;
    setLoading(true);
    resetFeature();
    try {
      const res = await callAI(`explain_${explainLevel}`, textToUse);
      setResult(res);
      pushToNotebook("Explanation", res);
    } catch {
      setResult("Error generating explanation. Please try again.");
    }
    setLoading(false);
  };

  const handleFlashcards = async () => {
    if (!hasContent) return;
    setLoading(true);
    resetFeature();
    try {
      const res = await callAI("flashcards", textToUse);
      const cards = parseJSON(res);
      if (cards && Array.isArray(cards)) {
        setFlashcards(cards);
        onSaveFlashcards?.(cards);
        const asText = cards.map((card, index) => `${index + 1}. Q: ${card.question}\nA: ${card.answer}`).join("\n\n");
        pushToNotebook("Flashcards", asText);
      } else {
        setResult("Failed to parse flashcards. Raw response:\n" + res);
      }
    } catch {
      setResult("Error generating flashcards.");
    }
    setLoading(false);
  };

  const handleQuiz = async () => {
    if (!hasContent) return;
    setLoading(true);
    resetFeature();
    try {
      const res = await callAI(`quiz_${quizType}`, textToUse, { difficulty: quizDifficulty });
      const parsed = parseJSON(res);
      if (parsed && Array.isArray(parsed)) {
        if (quizType === "mcq") {
          setMcqQuestions(parsed);
          const asText = parsed
            .map(
              (q: MCQQuestion, i: number) =>
                `${i + 1}. ${q.question}\nA) ${q.options[0]}\nB) ${q.options[1]}\nC) ${q.options[2]}\nD) ${q.options[3]}\nAnswer: ${String.fromCharCode(65 + q.correct)}\nWhy: ${q.explanation}`
            )
            .join("\n\n");
          pushToNotebook("Quiz (MCQ)", asText);
        } else if (quizType === "truefalse") {
          setTfQuestions(parsed);
          const asText = parsed
            .map((q: TFQuestion, i: number) => `${i + 1}. ${q.statement}\nAnswer: ${q.answer ? "True" : "False"}\nWhy: ${q.explanation}`)
            .join("\n\n");
          pushToNotebook("Quiz (True/False)", asText);
        } else {
          setResult(res);
          pushToNotebook("Quiz (Short Answer)", res);
        }
      } else {
        setResult("Failed to parse quiz. Raw:\n" + res);
      }
    } catch {
      setResult("Error generating quiz.");
    }
    setLoading(false);
  };

  const handleEnhance = async () => {
    if (!hasContent) return;
    setLoading(true);
    resetFeature();
    try {
      const res = await callAI("enhance", textToUse);
      setResult(res);
      pushToNotebook("Enhanced Text", res);
    } catch {
      setResult("Error enhancing text.");
    }
    setLoading(false);
  };

  const handleGapFill = async () => {
    if (!hasContent) return;
    setLoading(true);
    resetFeature();
    try {
      const res = await callAI("gap_fill", textToUse);
      const parsed = parseJSON(res);
      if (parsed && parsed.text_with_blanks) {
        setGapFillResult(parsed);
        const asText = `${parsed.text_with_blanks}\n\nAnswers: ${parsed.answers.join(", ")}`;
        pushToNotebook("Gap Fill Exercise", asText);
      } else {
        setResult(res);
      }
    } catch {
      setResult("Error generating gap fill.");
    }
    setLoading(false);
  };

  const handleFeynmanStart = async () => {
    if (!hasContent) return;
    setLoading(true);
    resetFeature();
    try {
      const res = await callAI("feynman_pick", textToUse);
      const parsed = parseJSON(res);
      if (parsed) setFeynmanConcept(parsed);
      else setResult(res);
    } catch {
      setResult("Error starting Feynman test.");
    }
    setLoading(false);
  };

  const handleFeynmanSubmit = async () => {
    if (!feynmanExplanation.trim()) return;
    setLoading(true);
    try {
      const res = await callAI("feynman_evaluate", textToUse, { userMessage: feynmanExplanation });
      const parsed = parseJSON(res);
      if (parsed) {
        setFeynmanEval(parsed);
        const asText = `Score: ${parsed.score}/10\nCorrect: ${(parsed.correct_points || []).join("; ")}\nVague: ${(parsed.vague_points || []).join("; ")}\nMissing: ${(parsed.missing_points || []).join("; ")}\nGuidance: ${parsed.guidance || ""}`;
        pushToNotebook("Feynman Feedback", asText);
      } else {
        setResult(res);
      }
    } catch {
      setResult("Error evaluating explanation.");
    }
    setLoading(false);
  };

  const handleStory = async () => {
    if (!hasContent) return;
    setLoading(true);
    resetFeature();
    try {
      const res = await callAI("story_mode", textToUse);
      setResult(res);
      pushToNotebook("Story Mode", res);
    } catch {
      setResult("Error generating story.");
    }
    setLoading(false);
  };

  const handleExamPredict = async () => {
    if (!hasContent) return;
    setLoading(true);
    resetFeature();
    try {
      const res = await callAI("exam_predictor", textToUse);
      setResult(res);
      pushToNotebook("Predicted Exam Questions", res);
    } catch {
      setResult("Error predicting exam questions.");
    }
    setLoading(false);
  };

  const features = [
    { id: "summarize" as FeatureId, label: "Summarize", icon: FileText, desc: "Key points or narrative summary" },
    { id: "explain" as FeatureId, label: "Explain", icon: Lightbulb, desc: "Explain at adjustable depth" },
    { id: "flashcards" as FeatureId, label: "Flashcards", icon: Brain, desc: "Auto-generate study cards" },
    { id: "quiz" as FeatureId, label: "Quiz", icon: Target, desc: "MCQ, True/False, Short answer" },
    { id: "enhance" as FeatureId, label: "Enhance", icon: Zap, desc: "Improve clarity and readability" },
    { id: "gap_fill" as FeatureId, label: "Gap Fill", icon: Puzzle, desc: "Fill-in-the-blank exercises" },
    { id: "feynman" as FeatureId, label: "Feynman Test", icon: GraduationCap, desc: "Explain it back to learn" },
    { id: "story" as FeatureId, label: "Story Mode", icon: BookOpen, desc: "Content as a narrative" },
    { id: "exam_predict" as FeatureId, label: "Exam Predictor", icon: ClipboardCheck, desc: "Predict likely exam questions" },
  ];

  const renderFeatureContent = (featureId: FeatureId) => {
    if (activeFeature !== featureId) return null;

    if (featureId === "summarize") {
      return (
        <div className="space-y-3 p-3 rounded-xl border border-[#e4d7c8] bg-[#f5eadc]">
          <div className="flex gap-1.5">
            <button onClick={() => setSummaryMode("key_points")} className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${summaryMode === "key_points" ? "bg-[#e7d6c2] text-[#6f5b43] border border-[#cfb899]" : "text-[#8a7559] border border-[#d8c6b2] hover:border-[#c9b39a]"}`}>Key Points</button>
            <button onClick={() => setSummaryMode("narrative")} className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${summaryMode === "narrative" ? "bg-[#e7d6c2] text-[#6f5b43] border border-[#cfb899]" : "text-[#8a7559] border border-[#d8c6b2] hover:border-[#c9b39a]"}`}>Narrative</button>
          </div>
          <button onClick={handleSummarize} disabled={loading || !hasContent} className="w-full py-2 bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] rounded-lg text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate Summary
          </button>
          {result && <ResultBox text={result} onCopy={() => handleCopy(result)} copied={copied} />}
        </div>
      );
    }

    if (featureId === "explain") {
      return (
        <div className="space-y-3 p-3 rounded-xl border border-[#e4d7c8] bg-[#f5eadc]">
          <p className="text-xs text-[#8a7559]">Select text in editor first, or uses full content</p>
          <div className="flex gap-1.5">
            {[{ k: "simple", l: "Like I'm 12" }, { k: "standard", l: "Standard" }, { k: "deep", l: "Deep Dive" }].map((lv) => (
              <button key={lv.k} onClick={() => setExplainLevel(lv.k as typeof explainLevel)} className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-colors ${explainLevel === lv.k ? "bg-[#e7d6c2] text-[#6f5b43] border border-[#cfb899]" : "text-[#8a7559] border border-[#d8c6b2] hover:border-[#c9b39a]"}`}>
                {lv.l}
              </button>
            ))}
          </div>
          <button onClick={handleExplain} disabled={loading || !hasContent} className="w-full py-2 bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] rounded-lg text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />} Explain
          </button>
          {result && <ResultBox text={result} onCopy={() => handleCopy(result)} copied={copied} />}
        </div>
      );
    }

    if (featureId === "flashcards") {
      return (
        <div className="space-y-3 p-3 rounded-xl border border-[#e4d7c8] bg-[#f5eadc]">
          <button onClick={handleFlashcards} disabled={loading || !hasContent} className="w-full py-2 bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] rounded-lg text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />} Generate Flashcards
          </button>
          {flashcards.length > 0 && (
            <div className="space-y-2">
              {flashcards.map((card, i) => (
                <div key={i} onClick={() => { const next = new Set(flippedCards); if (next.has(i)) next.delete(i); else next.add(i); setFlippedCards(next); }} className="p-3 rounded-lg border border-[#d8c6b2] bg-[#f2e6d8] cursor-pointer hover:bg-[#e8d9c5] transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-[#6f5b43] uppercase tracking-wider">{flippedCards.has(i) ? "Answer" : "Question"}</span>
                    <span className="text-[10px] text-[#9c8871]">tap to flip</span>
                  </div>
                  <p className="text-sm text-[#6f5b43]">{flippedCards.has(i) ? card.answer : card.question}</p>
                </div>
              ))}
            </div>
          )}
          {result && <ResultBox text={result} onCopy={() => handleCopy(result)} copied={copied} />}
        </div>
      );
    }

    if (featureId === "quiz") {
      return (
        <div className="space-y-3 p-3 rounded-xl border border-[#e4d7c8] bg-[#f5eadc]">
          <div className="flex gap-1.5">
            {[{ k: "mcq", l: "MCQ" }, { k: "truefalse", l: "True/False" }, { k: "short", l: "Short Ans" }].map((t) => (
              <button key={t.k} onClick={() => setQuizType(t.k as typeof quizType)} className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-colors ${quizType === t.k ? "bg-[#e7d6c2] text-[#6f5b43] border border-[#cfb899]" : "text-[#8a7559] border border-[#d8c6b2] hover:border-[#c9b39a]"}`}>
                {t.l}
              </button>
            ))}
          </div>
          <select value={quizDifficulty} onChange={(e) => setQuizDifficulty(e.target.value)} className="w-full px-3 py-1.5 bg-[#f2e6d8] border border-[#d8c6b2] rounded-lg text-sm text-[#7b664d] outline-none">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button onClick={handleQuiz} disabled={loading || !hasContent} className="w-full py-2 bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] rounded-lg text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />} Generate Quiz
          </button>
          {mcqQuestions.length > 0 && (
            <div className="space-y-3">
              {mcqQuestions.map((q, qi) => (
                <div key={qi} className="p-3 rounded-lg border border-[#d8c6b2] bg-[#f2e6d8]">
                  <p className="text-sm text-[#6f5b43] mb-2 font-medium">{qi + 1}. {q.question}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <button key={oi} onClick={() => !quizSubmitted && setQuizAnswers((p) => ({ ...p, [qi]: oi }))} className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${quizSubmitted ? oi === q.correct ? "bg-[#e7d6c2] text-[#6f5b43] border border-[#cfb899]" : quizAnswers[qi] === oi ? "bg-red-500/20 text-red-300 border border-red-500/30" : "border border-[#e4d7c8] text-[#8a7559]" : quizAnswers[qi] === oi ? "bg-[#e7d6c2] text-[#6f5b43] border border-[#cfb899]" : "border border-[#d8c6b2] text-[#8a7559] hover:border-[#c9b39a]"}`}>
                        {String.fromCharCode(65 + oi)}. {opt}
                      </button>
                    ))}
                  </div>
                  {quizSubmitted && <p className="text-xs text-[#8a7559] mt-2 italic">{q.explanation}</p>}
                </div>
              ))}
            </div>
          )}
          {tfQuestions.length > 0 && (
            <div className="space-y-3">
              {tfQuestions.map((q, qi) => (
                <div key={qi} className="p-3 rounded-lg border border-[#d8c6b2] bg-[#f2e6d8]">
                  <p className="text-sm text-[#6f5b43] mb-2">{qi + 1}. {q.statement}</p>
                  <div className="flex gap-2">
                    {[true, false].map((val) => (
                      <button key={String(val)} onClick={() => !quizSubmitted && setQuizAnswers((p) => ({ ...p, [qi]: val }))} className={`flex-1 px-3 py-1.5 rounded text-xs transition-colors ${quizSubmitted ? val === q.answer ? "bg-[#e7d6c2] text-[#6f5b43] border border-[#cfb899]" : quizAnswers[qi] === val ? "bg-red-500/20 text-red-300 border border-red-500/30" : "border border-[#e4d7c8] text-[#8a7559]" : quizAnswers[qi] === val ? "bg-[#e7d6c2] text-[#6f5b43] border border-[#cfb899]" : "border border-[#d8c6b2] text-[#8a7559] hover:border-[#c9b39a]"}`}>
                        {val ? "True" : "False"}
                      </button>
                    ))}
                  </div>
                  {quizSubmitted && <p className="text-xs text-[#8a7559] mt-2 italic">{q.explanation}</p>}
                </div>
              ))}
            </div>
          )}
          {!quizSubmitted && (mcqQuestions.length > 0 || tfQuestions.length > 0) && (
            <button onClick={() => setQuizSubmitted(true)} className="w-full py-2 bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] rounded-lg text-sm font-medium">Submit</button>
          )}
          {result && <ResultBox text={result} onCopy={() => handleCopy(result)} copied={copied} />}
        </div>
      );
    }

    if (featureId === "enhance") {
      return (
        <div className="space-y-3 p-3 rounded-xl border border-[#e4d7c8] bg-[#f5eadc]">
          <p className="text-xs text-[#8a7559]">Improves clarity, flow, and academic quality</p>
          <button onClick={handleEnhance} disabled={loading || !hasContent} className="w-full py-2 bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] rounded-lg text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Enhance Text
          </button>
          {result && <ResultBox text={result} onCopy={() => handleCopy(result)} copied={copied} />}
        </div>
      );
    }

    if (featureId === "gap_fill") {
      return (
        <div className="space-y-3 p-3 rounded-xl border border-[#e4d7c8] bg-[#f5eadc]">
          <button onClick={handleGapFill} disabled={loading || !hasContent} className="w-full py-2 bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] rounded-lg text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Puzzle className="w-4 h-4" />} Generate Gap Fill
          </button>
          {gapFillResult && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-[#d8c6b2] bg-[#f2e6d8]">
                <p className="text-sm text-[#7b664d] leading-relaxed whitespace-pre-wrap">{gapFillResult.text_with_blanks}</p>
              </div>
              <div className="space-y-2">
                {gapFillResult.answers.map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-[#8a7559] w-8">#{i + 1}</span>
                    <input type="text" value={gapFillUserAnswers[i] || ""} onChange={(e) => setGapFillUserAnswers((p) => ({ ...p, [i]: e.target.value }))} className="flex-1 px-2 py-1 bg-[#f2e6d8] border border-[#d8c6b2] rounded text-sm text-[#6f5b43] outline-none focus:border-[#a68b5b]" placeholder="Your answer..." disabled={gapFillChecked} />
                    {gapFillChecked && (
                      <span className={`text-xs ${gapFillUserAnswers[i]?.toLowerCase().trim() === gapFillResult.answers[i].toLowerCase().trim() ? "text-emerald-400" : "text-red-400"}`}>
                        {gapFillUserAnswers[i]?.toLowerCase().trim() === gapFillResult.answers[i].toLowerCase().trim() ? "✓" : gapFillResult.answers[i]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {!gapFillChecked && <button onClick={() => setGapFillChecked(true)} className="w-full py-2 bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] rounded-lg text-sm font-medium">Check Answers</button>}
            </div>
          )}
          {result && <ResultBox text={result} onCopy={() => handleCopy(result)} copied={copied} />}
        </div>
      );
    }

    if (featureId === "feynman") {
      return (
        <div className="space-y-3 p-3 rounded-xl border border-[#e4d7c8] bg-[#f5eadc]">
          {!feynmanConcept && (
            <button onClick={handleFeynmanStart} disabled={loading || !hasContent} className="w-full py-2 bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] rounded-lg text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />} Start Feynman Test
            </button>
          )}
          {feynmanConcept && !feynmanEval && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-[#d8c6b2] bg-[#f2e6d8]">
                <div className="text-[10px] font-medium text-[#6f5b43] uppercase tracking-wider mb-1">Explain this concept</div>
                <p className="text-sm text-[#6f5b43] font-medium">{feynmanConcept.concept}</p>
                <p className="text-xs text-[#8a7559] mt-1">{feynmanConcept.prompt}</p>
              </div>
              <textarea value={feynmanExplanation} onChange={(e) => setFeynmanExplanation(e.target.value)} placeholder="Explain in your own words..." className="w-full h-32 px-3 py-2 bg-[#f2e6d8] border border-[#d8c6b2] rounded-lg text-sm text-[#6f5b43] outline-none focus:border-[#a68b5b] resize-none" />
              <button onClick={handleFeynmanSubmit} disabled={loading || !feynmanExplanation.trim()} className="w-full py-2 bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] rounded-lg text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />} Submit Explanation
              </button>
            </div>
          )}
          {feynmanEval && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#f2e6d8] border border-[#d8c6b2]">
                <span className="text-sm text-[#8a7559]">Score</span>
                <span className="text-lg font-bold text-[#6f5b43]">{feynmanEval.score}/10</span>
              </div>
            </div>
          )}
          {result && <ResultBox text={result} onCopy={() => handleCopy(result)} copied={copied} />}
        </div>
      );
    }

    if (featureId === "story") {
      return (
        <div className="space-y-3 p-3 rounded-xl border border-[#e4d7c8] bg-[#f5eadc]">
          <button onClick={handleStory} disabled={loading || !hasContent} className="w-full py-2 bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] rounded-lg text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />} Generate Story
          </button>
          {result && <ResultBox text={result} onCopy={() => handleCopy(result)} copied={copied} />}
        </div>
      );
    }

    if (featureId === "exam_predict") {
      return (
        <div className="space-y-3 p-3 rounded-xl border border-[#e4d7c8] bg-[#f5eadc]">
          <button onClick={handleExamPredict} disabled={loading || !hasContent} className="w-full py-2 bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] rounded-lg text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />} Predict Questions
          </button>
          {result && <ResultBox text={result} onCopy={() => handleCopy(result)} copied={copied} />}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f1e7]">
      <div className="px-4 py-3 border-b border-[#e4d7c8]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#8a7559]" />
          <h2 className="text-sm font-semibold text-[#6f5b43]">AI Study Tools</h2>
        </div>
        {selectedText && (
          <p className="text-[10px] text-[#6f5b43] mt-1 truncate">Selected: &quot;{selectedText.slice(0, 50)}...&quot;</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {features.map((f) => (
          <div key={f.id} className="space-y-2">
            <button
              onClick={() => {
                const isSame = activeFeature === f.id;
                setActiveFeature(isSame ? null : f.id);
                resetFeature();
              }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-150 flex items-center gap-2.5 group ${
                activeFeature === f.id
                  ? "bg-[#f2e6d8] border border-[#d8c6b2]"
                  : "hover:bg-[#f2e6d8] border border-transparent"
              }`}
            >
              <f.icon className={`w-4 h-4 ${activeFeature === f.id ? "text-[#8a7559]" : "text-[#9c8871] group-hover:text-[#8a7559]"}`} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${activeFeature === f.id ? "text-[#5d4a34]" : "text-[#8a7559]"}`}>{f.label}</div>
                <div className="text-[10px] text-[#9c8871] truncate">{f.desc}</div>
              </div>
              {activeFeature === f.id ? <ChevronUp className="w-3.5 h-3.5 text-[#9c8871]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#a0896f]" />}
            </button>
            {renderFeatureContent(f.id)}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultBox({ text, onCopy, copied }: { text: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="relative p-3 rounded-lg border border-[#d8c6b2] bg-[#f2e6d8] max-h-64 overflow-y-auto">
      <button onClick={onCopy} className="absolute top-2 right-2 p-1 rounded hover:bg-[#ede1d1] transition-colors" title="Copy">
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#9c8871]" />}
      </button>
      <p className="text-sm text-[#7b664d] leading-relaxed whitespace-pre-wrap pr-6">{text}</p>
    </div>
  );
}
