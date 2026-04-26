import type { AIStudyFeature } from "@/app/lib/ai-feature-config";

export type AIStudyResponseMode = "text" | "json";

export interface AIStudySuccess<T = unknown> {
  ok: true;
  feature: AIStudyFeature;
  mode: AIStudyResponseMode;
  text?: string;
  data?: T;
  result: string;
}

export interface AIStudyFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: string;
    retryable?: boolean;
  };
}

export class AIStudyError extends Error {
  code: string;
  details?: string;
  retryable: boolean;
  status?: number;

  constructor(options: {
    code: string;
    message: string;
    details?: string;
    retryable?: boolean;
    status?: number;
  }) {
    super(options.message);
    this.name = "AIStudyError";
    this.code = options.code;
    this.details = options.details;
    this.retryable = Boolean(options.retryable);
    this.status = options.status;
  }
}

interface CallAIStudyOptions {
  selectedText?: string;
  userMessage?: string;
  difficulty?: string;
  retries?: number;
  retryDelayMs?: number;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toAIStudyError(error: unknown): AIStudyError {
  if (error instanceof AIStudyError) return error;
  if (error instanceof Error) {
    return new AIStudyError({
      code: "NETWORK_ERROR",
      message: "Network error while contacting AI service.",
      details: error.message,
      retryable: true,
    });
  }
  return new AIStudyError({
    code: "UNKNOWN_ERROR",
    message: "Unexpected error while contacting AI service.",
    retryable: true,
  });
}

export function mapAIErrorToMessage(error: AIStudyError): string {
  switch (error.code) {
    case "RATE_LIMITED":
      return "Rate limit reached. Please wait a minute and retry.";
    case "TOKEN_LIMIT_EXCEEDED":
      return "The selected content is too long. Try selecting a shorter section.";
    case "MODEL_JSON_INVALID":
      return "AI returned malformed structured data. Please retry.";
    case "EMPTY_CONTENT":
      return "Add or select some content before running this feature.";
    case "UNKNOWN_FEATURE":
      return "This feature is not available right now.";
    case "UPSTREAM_UNAVAILABLE":
      return "AI service is temporarily unavailable. Please retry shortly.";
    case "NETWORK_ERROR":
      return "Network issue while contacting AI service. Please retry.";
    default:
      return error.message || "AI request failed.";
  }
}

export async function callAIStudy<T = unknown>(
  feature: AIStudyFeature,
  content: string,
  options: CallAIStudyOptions = {}
): Promise<AIStudySuccess<T>> {
  const retries = Math.max(0, options.retries ?? 0);
  const retryDelayMs = options.retryDelayMs ?? 900;
  let attempts = 0;

  while (true) {
    attempts += 1;
    try {
      const response = await fetch("/api/ai-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature,
          content,
          selectedText: options.selectedText,
          userMessage: options.userMessage,
          difficulty: options.difficulty,
        }),
      });

      const payload = (await response.json()) as AIStudySuccess<T> | AIStudyFailure;

      if (!response.ok || !payload.ok) {
        const failure = payload as AIStudyFailure;
        throw new AIStudyError({
          code: failure.error?.code ?? "AI_REQUEST_FAILED",
          message: failure.error?.message ?? "AI request failed.",
          details: failure.error?.details,
          retryable: failure.error?.retryable ?? response.status >= 500,
          status: response.status,
        });
      }

      return payload as AIStudySuccess<T>;
    } catch (error) {
      const mappedError = toAIStudyError(error);
      const canRetry = mappedError.retryable && attempts <= retries;
      if (canRetry) {
        await delay(retryDelayMs * attempts);
        continue;
      }
      throw mappedError;
    }
  }
}

