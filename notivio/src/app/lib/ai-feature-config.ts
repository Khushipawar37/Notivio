export type SummaryMode = "key_points" | "narrative";
export type ExplainLevel = "simple" | "standard" | "deep";
export type QuizType = "mcq" | "truefalse" | "short";

export type AIStudyFeature =
  | "summarize_key_points"
  | "summarize_narrative"
  | "explain_simple"
  | "explain_standard"
  | "explain_deep"
  | "flashcards"
  | "quiz_mcq"
  | "quiz_truefalse"
  | "quiz_short"
  | "enhance"
  | "mnemonics"
  | "gap_fill"
  | "feynman_pick"
  | "feynman_evaluate"
  | "story_mode"
  | "exam_predictor"
  | "chat";

export type PanelFeatureId =
  | "summarize"
  | "explain"
  | "flashcards"
  | "quiz"
  | "enhance"
  | "mnemonics"
  | "gap_fill"
  | "feynman"
  | "story"
  | "exam_predict"
  | "topic_segment";

export const AI_FEATURE_MAP = {
  summarize: {
    key_points: "summarize_key_points",
    narrative: "summarize_narrative",
  },
  explain: {
    simple: "explain_simple",
    standard: "explain_standard",
    deep: "explain_deep",
  },
  quiz: {
    mcq: "quiz_mcq",
    truefalse: "quiz_truefalse",
    short: "quiz_short",
  },
  flashcards: "flashcards",
  enhance: "enhance",
  mnemonics: "mnemonics",
  gap_fill: "gap_fill",
  feynman_pick: "feynman_pick",
  feynman_evaluate: "feynman_evaluate",
  story: "story_mode",
  exam_predict: "exam_predictor",
} as const;

export function resolveSummaryFeature(mode: SummaryMode): AIStudyFeature {
  return AI_FEATURE_MAP.summarize[mode];
}

export function resolveExplainFeature(level: ExplainLevel): AIStudyFeature {
  return AI_FEATURE_MAP.explain[level];
}

export function resolveQuizFeature(type: QuizType): AIStudyFeature {
  return AI_FEATURE_MAP.quiz[type];
}

export function getMinLengthForFeature(featureId: PanelFeatureId): number {
  switch (featureId) {
    case "flashcards":
    case "quiz":
    case "gap_fill":
    case "exam_predict":
    case "topic_segment":
      return 80;
    case "feynman":
      return 120;
    default:
      return 20;
  }
}

