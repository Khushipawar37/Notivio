"use client";

import React, { useCallback, useRef, useState } from "react";
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
  Layers,
  RotateCcw,
} from "lucide-react";
import {
  AI_FEATURE_MAP,
  type PanelFeatureId,
  resolveExplainFeature,
  resolveQuizFeature,
  resolveSummaryFeature,
  getMinLengthForFeature,
} from "@/app/lib/ai-feature-config";
import { callAIStudy, AIStudyError, mapAIErrorToMessage } from "@/app/lib/ai-study-client";

interface AIFeaturesPanelProps {
  content: string;
  selectedText: string;
  onSaveFlashcards?: (cards: Flashcard[]) => void;
  onInsertToNotebook?: (text: string) => void;
  onInsertToNotebookHtml?: (html: string) => void;
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

interface ShortQuestion {
  question: string;
  model_answer: string;
  key_points: string[];
}

interface MnemonicsResult {
  acronym: string;
  story: string;
  rhyme: string;
  association: string;
  memory_palace: string;
}

interface PanelErrorState {
  message: string;
  retryable: boolean;
  details?: string;
}

export function AIFeaturesPanel({
  content,
  selectedText,
  onSaveFlashcards,
  onInsertToNotebook,
  onInsertToNotebookHtml,
}: AIFeaturesPanelProps) {
  const [activeFeature, setActiveFeature] = useState<PanelFeatureId | null>(null);
  const [loadingFeature, setLoadingFeature] = useState<PanelFeatureId | "feynman_submit" | "topic_segment_request" | null>(null);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [result, setResult] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [panelError, setPanelError] = useState<PanelErrorState | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const retryActionRef = useRef<(() => Promise<void>) | null>(null);

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
  const [mnemonics, setMnemonics] = useState<MnemonicsResult | null>(null);
  const [shortQuestions, setShortQuestions] = useState<ShortQuestion[]>([]);
  const [topicChapters, setTopicChapters] = useState<{ title: string; content: string }[]>([]);

  const textToUse = selectedText || content;
  const hasContent = textToUse.trim().length > 0;
  const loading = Boolean(loadingFeature);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const escapeHtml = useCallback((value: string) => {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }, []);

  const bodyToHtml = useCallback(
    (body: string) => {
      const blocks = body
        .replace(/\r\n/g, "\n")
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean);
      return blocks
        .map((block) => {
          const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
          const isOrdered = lines.length > 1 && lines.every((line) => /^\d+[\).]\s+/.test(line));
          const isBullet = lines.length > 1 && lines.every((line) => /^[-*]\s+/.test(line));
          if (isOrdered) {
            const items = lines
              .map((line) => `<li>${escapeHtml(line.replace(/^\d+[\).]\s+/, ""))}</li>`)
              .join("");
            return `<ol>${items}</ol>`;
          }
          if (isBullet) {
            const items = lines
              .map((line) => `<li>${escapeHtml(line.replace(/^[-*]\s+/, ""))}</li>`)
              .join("");
            return `<ul>${items}</ul>`;
          }
          return `<p>${escapeHtml(block).replace(/\n/g, "<br/>")}</p>`;
        })
        .join("");
    },
    [escapeHtml]
  );

  const pushToNotebook = useCallback(
    (heading: string, body: string) => {
      if (!body.trim()) return;
      if (onInsertToNotebookHtml) {
        const html = `<h2>${escapeHtml(heading)}</h2>${bodyToHtml(body)}`;
        onInsertToNotebookHtml(html);
        return;
      }
      if (!onInsertToNotebook) return;
      onInsertToNotebook(`\n\n${heading}\n${body}\n`);
    },
    [bodyToHtml, escapeHtml, onInsertToNotebook, onInsertToNotebookHtml]
  );

  const resetFeature = () => {
    setResult("");
    setPanelError(null);
    setAttemptCount(0);
    retryActionRef.current = null;
    setFlashcards([]);
    setFlippedCards(new Set());
    setMcqQuestions([]);
    setTfQuestions([]);
    setShortQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setGapFillResult(null);
    setGapFillUserAnswers({});
    setGapFillChecked(false);
    setFeynmanConcept(null);
    setFeynmanExplanation("");
    setFeynmanEval(null);
    setMnemonics(null);
    setTopicChapters([]);
  };

  const setValidationError = useCallback((featureId: PanelFeatureId) => {
    const minLength = getMinLengthForFeature(featureId);
    const currentLength = textToUse.trim().length;
    if (currentLength === 0) {
      setPanelError({
        message: "Add or select some content before using AI features.",
        retryable: false,
      });
      return true;
    }
    if (currentLength < minLength) {
      setPanelError({
        message: `Add more context for better results (minimum ${minLength} characters).`,
        details: `Current length: ${currentLength} characters`,
        retryable: false,
      });
      return true;
    }
    return false;
  }, [textToUse]);

  const handleKnownError = useCallback((error: unknown) => {
    const mapped = error instanceof AIStudyError
      ? error
      : new AIStudyError({
        code: "UNKNOWN_ERROR",
        message: "Unexpected AI error.",
        retryable: true,
      });

    setPanelError({
      message: mapAIErrorToMessage(mapped),
      retryable: mapped.retryable,
      details: mapped.details,
    });
  }, []);

  const runFeatureAction = useCallback(async (
    featureId: PanelFeatureId | "feynman_submit" | "topic_segment_request",
    label: string,
    action: () => Promise<void>,
    options?: {
      rememberForRetry?: boolean;
      retryAction?: () => Promise<void>;
    }
  ) => {
    setLoadingFeature(featureId);
    setLoadingLabel(label);
    setPanelError(null);
    if (options?.rememberForRetry ?? true) {
      retryActionRef.current = options?.retryAction ?? action;
    }

    try {
      await action();
    } catch (error) {
      handleKnownError(error);
    } finally {
      setLoadingFeature(null);
      setLoadingLabel("");
    }
  }, [handleKnownError]);

  const handleSummarize = async () => {
    resetFeature();
    if (setValidationError("summarize")) return;

    await runFeatureAction("summarize", "Generating summary...", async () => {
      setAttemptCount((p) => p + 1);
      const res = await callAIStudy(resolveSummaryFeature(summaryMode), textToUse, { retries: 1 });
      const summary = res.text ?? res.result;
      setResult(summary);
      pushToNotebook("Summary", summary);
    });
  };

  const handleExplain = async () => {
    resetFeature();
    if (setValidationError("explain")) return;

    await runFeatureAction("explain", "Generating explanation...", async () => {
      setAttemptCount((p) => p + 1);
      const res = await callAIStudy(resolveExplainFeature(explainLevel), textToUse, { retries: 1 });
      const explanation = res.text ?? res.result;
      setResult(explanation);
      pushToNotebook("Explanation", explanation);
    });
  };

  const handleFlashcards = async () => {
    resetFeature();
    if (setValidationError("flashcards")) return;

    await runFeatureAction("flashcards", "Generating flashcards...", async () => {
      setAttemptCount((p) => p + 1);
      const res = await callAIStudy<Flashcard[]>(AI_FEATURE_MAP.flashcards, textToUse, { retries: 1 });
      const cards = Array.isArray(res.data) ? res.data : [];
      setFlashcards(cards);
      onSaveFlashcards?.(cards);
      const asText = cards.map((card, index) => `${index + 1}. Q: ${card.question}\nA: ${card.answer}`).join("\n\n");
      pushToNotebook("Flashcards", asText);
    });
  };

  const handleQuiz = async () => {
    resetFeature();
    if (setValidationError("quiz")) return;

    await runFeatureAction("quiz", "Generating quiz...", async () => {
      setAttemptCount((p) => p + 1);
      const feature = resolveQuizFeature(quizType);
      if (quizType === "mcq") {
        const res = await callAIStudy<MCQQuestion[]>(feature, textToUse, {
          difficulty: quizDifficulty,
          retries: 1,
        });
        const parsed = Array.isArray(res.data) ? res.data : [];
        setMcqQuestions(parsed);
        const asText = parsed
          .map(
            (q, i) =>
              `${i + 1}. ${q.question}\nA) ${q.options[0]}\nB) ${q.options[1]}\nC) ${q.options[2]}\nD) ${q.options[3]}\nAnswer: ${String.fromCharCode(65 + q.correct)}\nWhy: ${q.explanation}`
          )
          .join("\n\n");
        pushToNotebook("Quiz (MCQ)", asText);
        return;
      }
      if (quizType === "truefalse") {
        const res = await callAIStudy<TFQuestion[]>(feature, textToUse, {
          difficulty: quizDifficulty,
          retries: 1,
        });
        const parsed = Array.isArray(res.data) ? res.data : [];
        setTfQuestions(parsed);
        const asText = parsed
          .map((q, i) => `${i + 1}. ${q.statement}\nAnswer: ${q.answer ? "True" : "False"}\nWhy: ${q.explanation}`)
          .join("\n\n");
        pushToNotebook("Quiz (True/False)", asText);
        return;
      }

      const res = await callAIStudy<ShortQuestion[]>(feature, textToUse, {
        difficulty: quizDifficulty,
        retries: 1,
      });
      const parsed = Array.isArray(res.data) ? res.data : [];
      setShortQuestions(parsed);
      const asText = parsed
        .map((q, i) => `${i + 1}. ${q.question}\nModel answer: ${q.model_answer}\nKey points: ${(q.key_points || []).join(", ")}`)
        .join("\n\n");
      pushToNotebook("Quiz (Short Answer)", asText);
    });
  };

  const handleEnhance = async () => {
    resetFeature();
    if (setValidationError("enhance")) return;

    await runFeatureAction("enhance", "Enhancing content...", async () => {
      setAttemptCount((p) => p + 1);
      const res = await callAIStudy(AI_FEATURE_MAP.enhance, textToUse, { retries: 1 });
      const enhanced = res.text ?? res.result;
      setResult(enhanced);
      pushToNotebook("Enhanced Text", enhanced);
    });
  };

  const handleMnemonics = async () => {
    resetFeature();
    if (setValidationError("mnemonics")) return;

    await runFeatureAction("mnemonics", "Creating memory aids...", async () => {
      setAttemptCount((p) => p + 1);
      const res = await callAIStudy<MnemonicsResult>(AI_FEATURE_MAP.mnemonics, textToUse, { retries: 1 });
      const parsed = res.data;
      if (!parsed) {
        throw new AIStudyError({
          code: "MODEL_JSON_INVALID",
          message: "Mnemonics format is invalid.",
          retryable: true,
        });
      }
      setMnemonics(parsed);
      const asText = `Acronym: ${parsed.acronym}\nStory: ${parsed.story}\nRhyme: ${parsed.rhyme}\nAssociation: ${parsed.association}\nMemory Palace: ${parsed.memory_palace}`;
      pushToNotebook("Mnemonics", asText);
    });
  };

  const handleGapFill = async () => {
    resetFeature();
    if (setValidationError("gap_fill")) return;

    await runFeatureAction("gap_fill", "Generating gap-fill exercise...", async () => {
      setAttemptCount((p) => p + 1);
      const res = await callAIStudy<{ text_with_blanks: string; answers: string[] }>(AI_FEATURE_MAP.gap_fill, textToUse, { retries: 1 });
      const parsed = res.data;
      if (!parsed?.text_with_blanks) {
        throw new AIStudyError({
          code: "MODEL_JSON_INVALID",
          message: "Gap-fill output is malformed.",
          retryable: true,
        });
      }
      setGapFillResult(parsed);
      const asText = `${parsed.text_with_blanks}\n\nAnswers: ${(parsed.answers || []).join(", ")}`;
      pushToNotebook("Gap Fill Exercise", asText);
    });
  };

  const handleFeynmanStart = async () => {
    resetFeature();
    if (setValidationError("feynman")) return;

    await runFeatureAction("feynman", "Picking a concept...", async () => {
      setAttemptCount((p) => p + 1);
      const res = await callAIStudy<{ concept: string; prompt: string }>(AI_FEATURE_MAP.feynman_pick, textToUse, { retries: 1 });
      const parsed = res.data;
      if (!parsed?.concept || !parsed?.prompt) {
        throw new AIStudyError({
          code: "MODEL_JSON_INVALID",
          message: "Feynman concept payload is invalid.",
          retryable: true,
        });
      }
      setFeynmanConcept(parsed);
    });
  };

  const handleFeynmanSubmit = async () => {
    if (!feynmanExplanation.trim()) return;

    await runFeatureAction("feynman_submit", "Evaluating your explanation...", async () => {
      setAttemptCount((p) => p + 1);
      const res = await callAIStudy<FeynmanEvalResult>(AI_FEATURE_MAP.feynman_evaluate, textToUse, {
        userMessage: feynmanExplanation,
        retries: 1,
      });
      const parsed = res.data;
      if (!parsed) {
        throw new AIStudyError({
          code: "MODEL_JSON_INVALID",
          message: "Feynman evaluation payload is invalid.",
          retryable: true,
        });
      }
      setFeynmanEval(parsed);
      const asText = `Score: ${parsed.score}/10\nCorrect: ${(parsed.correct_points || []).join("; ")}\nVague: ${(parsed.vague_points || []).join("; ")}\nMissing: ${(parsed.missing_points || []).join("; ")}\nGuidance: ${parsed.guidance || ""}`;
      pushToNotebook("Feynman Feedback", asText);
    }, {
      retryAction: async () => {
        await handleFeynmanSubmit();
      },
    });
  };

  const handleStory = async () => {
    resetFeature();
    if (setValidationError("story")) return;

    await runFeatureAction("story", "Generating narrative...", async () => {
      setAttemptCount((p) => p + 1);
      const res = await callAIStudy(AI_FEATURE_MAP.story, textToUse, { retries: 1 });
      const story = res.text ?? res.result;
      setResult(story);
      pushToNotebook("Story Mode", story);
    });
  };

  const handleExamPredict = async () => {
    resetFeature();
    if (setValidationError("exam_predict")) return;

    await runFeatureAction("exam_predict", "Predicting exam questions...", async () => {
      setAttemptCount((p) => p + 1);
      const res = await callAIStudy<Array<{ question: string; type: string; difficulty: string; model_answer: string }>>(AI_FEATURE_MAP.exam_predict, textToUse, { retries: 1 });
      const parsed = Array.isArray(res.data) ? res.data : [];
      const asText = parsed
        .map((q, i) => `${i + 1}. ${q.question}\nType: ${q.type}\nDifficulty: ${q.difficulty}\nModel answer: ${q.model_answer}`)
        .join("\n\n");
      setResult(asText);
      pushToNotebook("Predicted Exam Questions", asText);
    });
  };

  const features = [
    { id: "summarize" as PanelFeatureId, label: "Summarize", icon: FileText, desc: "Key points or narrative summary" },
    { id: "explain" as PanelFeatureId, label: "Explain", icon: Lightbulb, desc: "Explain at adjustable depth" },
    { id: "flashcards" as PanelFeatureId, label: "Flashcards", icon: Brain, desc: "Auto-generate study cards" },
    { id: "quiz" as PanelFeatureId, label: "Quiz", icon: Target, desc: "MCQ, True/False, Short answer" },
    { id: "enhance" as PanelFeatureId, label: "Enhance", icon: Zap, desc: "Improve clarity and readability" },
    { id: "mnemonics" as PanelFeatureId, label: "Mnemonics", icon: Sparkles, desc: "Memory tricks and recall aids" },
    { id: "gap_fill" as PanelFeatureId, label: "Gap Fill", icon: Puzzle, desc: "Fill-in-the-blank exercises" },
    { id: "feynman" as PanelFeatureId, label: "Feynman Test", icon: GraduationCap, desc: "Explain it back to learn" },
    { id: "story" as PanelFeatureId, label: "Story Mode", icon: BookOpen, desc: "Content as a narrative" },
    { id: "exam_predict" as PanelFeatureId, label: "Exam Predictor", icon: ClipboardCheck, desc: "Predict likely exam questions" },
    { id: "topic_segment" as PanelFeatureId, label: "Topic Segments", icon: Layers, desc: "Auto-chapter long transcripts" },
  ];

  const handleRetry = async () => {
    if (!retryActionRef.current || loading) return;
    await retryActionRef.current();
  };

  const handleTopicSegment = async () => {
    resetFeature();
    if (setValidationError("topic_segment")) return;

    await runFeatureAction("topic_segment_request", "Segmenting topics...", async () => {
      const plainText = textToUse.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      const res = await fetch("/api/topic-segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plainText }),
      });
      if (!res.ok) {
        const details = await res.text();
        throw new AIStudyError({
          code: "TOPIC_SEGMENT_FAILED",
          message: "Topic segmentation failed.",
          retryable: res.status >= 500,
          details,
          status: res.status,
        });
      }
      const data = await res.json();
      const chapters = Array.isArray(data.chapters) ? data.chapters : [];
      setTopicChapters(chapters);
      if (chapters.length > 0 && onInsertToNotebookHtml) {
        const html = chapters
          .map((ch: { title: string; content: string }) =>
            `<h2>${escapeHtml(ch.title)}</h2><p>${escapeHtml(ch.content).replace(/\n/g, "<br/>")}</p>`
          )
          .join("");
        onInsertToNotebookHtml(html);
      }
    });
  };

  const renderFeatureContent = (featureId: PanelFeatureId) => {
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
          {shortQuestions.length > 0 && (
            <div className="space-y-3">
              {shortQuestions.map((q, i) => (
                <div key={i} className="p-3 rounded-lg border border-[#d8c6b2] bg-[#f2e6d8]">
                  <p className="text-sm text-[#6f5b43] mb-2 font-medium">{i + 1}. {q.question}</p>
                  <p className="text-xs text-[#8a7559]"><span className="font-semibold text-[#6f5b43]">Model answer:</span> {q.model_answer}</p>
                  <p className="text-xs text-[#8a7559] mt-1"><span className="font-semibold text-[#6f5b43]">Key points:</span> {(q.key_points || []).join(", ")}</p>
                </div>
              ))}
            </div>
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

    if (featureId === "mnemonics") {
      return (
        <div className="space-y-3 p-3 rounded-xl border border-[#e4d7c8] bg-[#f5eadc]">
          <button onClick={handleMnemonics} disabled={loading || !hasContent} className="w-full py-2 bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] rounded-lg text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate Mnemonics
          </button>
          {mnemonics && (
            <div className="space-y-2">
              <div className="p-3 rounded-lg border border-[#d8c6b2] bg-[#f2e6d8] text-sm text-[#6f5b43]"><span className="font-semibold">Acronym:</span> {mnemonics.acronym}</div>
              <div className="p-3 rounded-lg border border-[#d8c6b2] bg-[#f2e6d8] text-sm text-[#6f5b43]"><span className="font-semibold">Story:</span> {mnemonics.story}</div>
              <div className="p-3 rounded-lg border border-[#d8c6b2] bg-[#f2e6d8] text-sm text-[#6f5b43]"><span className="font-semibold">Rhyme:</span> {mnemonics.rhyme}</div>
              <div className="p-3 rounded-lg border border-[#d8c6b2] bg-[#f2e6d8] text-sm text-[#6f5b43]"><span className="font-semibold">Association:</span> {mnemonics.association}</div>
              <div className="p-3 rounded-lg border border-[#d8c6b2] bg-[#f2e6d8] text-sm text-[#6f5b43]"><span className="font-semibold">Memory Palace:</span> {mnemonics.memory_palace}</div>
            </div>
          )}
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
                        {gapFillUserAnswers[i]?.toLowerCase().trim() === gapFillResult.answers[i].toLowerCase().trim() ? "Correct" : gapFillResult.answers[i]}
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

    if (featureId === "topic_segment") {
      return (
        <div className="space-y-3 p-3 rounded-xl border border-[#e4d7c8] bg-[#f5eadc]">
          <p className="text-xs text-[#8a7559]">Uses ML-based TextTiling on sentence embeddings to detect topic shifts and split content into chapters automatically.</p>
          <button
            onClick={handleTopicSegment}
            disabled={loading || !hasContent}
            className="w-full py-2 bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] rounded-lg text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />} Segment into Chapters
          </button>
          {topicChapters.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-[#6f5b43] uppercase tracking-wider">Found {topicChapters.length} chapters</p>
              {topicChapters.map((ch, i) => (
                <div key={i} className="p-3 rounded-lg border border-[#d8c6b2] bg-[#f2e6d8]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[#e7d6c2] text-[10px] font-bold text-[#6f5b43]">{i + 1}</span>
                    <span className="text-sm font-medium text-[#6f5b43]">{ch.title}</span>
                  </div>
                  <p className="text-xs text-[#8a7559] line-clamp-3 leading-relaxed">{ch.content.slice(0, 200)}...</p>
                </div>
              ))}
              <p className="text-[10px] text-[#8a7559] italic">Chapters have been inserted into your notes.</p>
            </div>
          )}
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

      {(loadingLabel || panelError) && (
        <div className="px-3 pt-3 space-y-2">
          {loadingLabel && (
            <div className="px-3 py-2 rounded-lg border border-[#d8c6b2] bg-[#f2e6d8] text-xs text-[#6f5b43] flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{loadingLabel}</span>
              {attemptCount > 1 && <span className="text-[#8a7559]">(Attempt {attemptCount})</span>}
            </div>
          )}
          {panelError && (
            <div className="px-3 py-2 rounded-lg border border-red-300/70 bg-red-100/60 text-xs text-red-700 space-y-2">
              <p>{panelError.message}</p>
              {panelError.details && <p className="text-red-700/80">{panelError.details}</p>}
              {panelError.retryable && (
                <button
                  onClick={handleRetry}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-200/50 disabled:opacity-60"
                >
                  <RotateCcw className="w-3 h-3" />
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {features.map((f) => (
          <div key={f.id} className="space-y-2">
            <button
              onClick={() => {
                const isSame = activeFeature === f.id;
                setActiveFeature(isSame ? null : f.id);
                resetFeature();
              }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-150 flex items-center gap-2.5 group ${activeFeature === f.id
                ? "bg-[#f2e6d8] border border-[#d8c6b2] shadow-sm"
                : "hover:bg-[#f2e6d8] hover:shadow-sm hover:-translate-y-[1px] border border-transparent"
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
