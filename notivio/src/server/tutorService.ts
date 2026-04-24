import { prisma } from "@/server/prisma";
import { cosineSimilarity, embedText } from "@/app/lib/embeddings";

export type TutorMode = "encouraging" | "direct" | "curious";

export interface TutorStateInput {
  failedAttempts?: number;
  confidence?: number;
  recentCorrectRate?: number;
}

export interface ProvenancePointer {
  pageId: string;
  chunkIndex: number;
}

export interface RetrievedChunk extends ProvenancePointer {
  chunkText: string;
  score: number;
}

export interface AttemptEvaluation {
  score: number;
  expectedKeyPoints: string[];
  coveredKeyPoints: string[];
  missingKeyPoints: string[];
  isCorrect: boolean;
}

const STOPWORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "another",
  "because",
  "before",
  "being",
  "between",
  "could",
  "does",
  "each",
  "from",
  "have",
  "just",
  "more",
  "most",
  "other",
  "over",
  "same",
  "some",
  "than",
  "that",
  "their",
  "there",
  "these",
  "this",
  "those",
  "through",
  "under",
  "very",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
  "would",
  "your",
]);

const NON_TOPIC_WORDS = new Set([
  "good",
  "fine",
  "okay",
  "ok",
  "nice",
  "great",
  "awesome",
  "cool",
  "yes",
  "no",
  "sure",
  "maybe",
  "hii",
  "hi",
  "hello",
  "hey",
]);

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenizeMeaningful(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .filter((token) => token.length >= 4 && !STOPWORDS.has(token));
}

export function seemsProblemQuestion(text: string): boolean {
  const clean = text.trim();
  if (!clean) return false;
  if (/\?$/.test(clean)) return true;
  if (/^(how|why|what|when|where|which|solve|explain|define)\b/i.test(clean)) return true;
  if (/\b(help|problem|question|stuck|confused|clarify)\b/i.test(clean)) return true;
  return false;
}

export function seemsAttempt(text: string): boolean {
  const clean = text.trim().toLowerCase();
  if (!clean) return false;
  if (clean === "stuck") return true;
  if (clean.includes("my attempt") || clean.includes("i think") || clean.includes("i tried")) return true;
  if (clean.split(/\s+/).length >= 12) return true;
  return /[=:+\-*/]/.test(clean);
}

export function isLikelySmallTalk(text: string): boolean {
  const clean = normalizeText(text);
  if (!clean) return false;
  if (clean.split(" ").length > 5) return false;
  const tokens = clean.split(" ").filter(Boolean);
  return tokens.every((token) => NON_TOPIC_WORDS.has(token));
}

export function hasLearningIntent(text: string): boolean {
  const clean = normalizeText(text);
  return (
    /\b(i want to learn|teach me|help me learn|i want to study|let s study|study)\b/.test(clean) ||
    /\blearn\b/.test(clean)
  );
}

export async function retrieveTutorEvidence(
  userId: string,
  query: string,
  topK = 6,
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedText(query);
  const rows = await prisma.pageEmbedding.findMany({
    where: { userId },
    select: {
      pageId: true,
      chunkIndex: true,
      chunkText: true,
      embedding: true,
    },
    take: 2000,
  });

  const queryTokens = new Set(tokenizeMeaningful(query));
  const shortQuery = queryTokens.size > 0 && queryTokens.size <= 5;

  const scored = rows
    .map((row) => {
      const rowTokens = new Set(tokenizeMeaningful(row.chunkText));
      let overlap = 0;
      for (const token of queryTokens) {
        if (rowTokens.has(token)) overlap += 1;
      }
      const lexical = queryTokens.size > 0 ? overlap / queryTokens.size : 0;
      const semantic = cosineSimilarity(queryEmbedding, row.embedding);
      const blended = semantic * 0.8 + lexical * 0.2;
      return {
      pageId: row.pageId,
      chunkIndex: row.chunkIndex,
      chunkText: row.chunkText,
      score: blended,
      lexical,
      semantic,
    };
    })
    .filter((row) => row.score > 0.2 && (!shortQuery || row.lexical > 0))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map(({ pageId, chunkIndex, chunkText, score }) => ({ pageId, chunkIndex, chunkText, score }));
}

export function buildExpectedKeyPoints(evidence: RetrievedChunk[]): string[] {
  const freq = new Map<string, number>();
  for (const item of evidence.slice(0, 4)) {
    const tokens = tokenizeMeaningful(item.chunkText);
    for (const token of tokens) {
      freq.set(token, (freq.get(token) ?? 0) + 1);
    }
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([token]) => token)
    .slice(0, 6);
}

export function evaluateAttemptAgainstEvidence(
  attemptText: string,
  evidence: RetrievedChunk[],
): AttemptEvaluation {
  const expected = buildExpectedKeyPoints(evidence);
  if (expected.length === 0) {
    return {
      score: 0,
      expectedKeyPoints: [],
      coveredKeyPoints: [],
      missingKeyPoints: [],
      isCorrect: false,
    };
  }

  const attemptTokens = new Set(tokenizeMeaningful(attemptText));
  const covered = expected.filter((point) => attemptTokens.has(point));
  const missing = expected.filter((point) => !attemptTokens.has(point));
  const score = covered.length / expected.length;

  return {
    score,
    expectedKeyPoints: expected,
    coveredKeyPoints: covered,
    missingKeyPoints: missing,
    isCorrect: score >= 0.55,
  };
}

export function chooseTutorMode(input: TutorStateInput): TutorMode {
  if ((input.failedAttempts ?? 0) >= 2 || (input.recentCorrectRate ?? 1) < 0.45) return "encouraging";
  if ((input.confidence ?? 0.6) > 0.8 && (input.recentCorrectRate ?? 0.6) > 0.75) return "direct";
  return "curious";
}

export function socraticStarter(): string {
  return "Before I explain, try to answer in one sentence. If stuck, type 'stuck'. I'll give one minimal hint, then ask you to try again.";
}

export function isGreetingMessage(text: string): boolean {
  const clean = normalizeText(text);
  return /^(hi|hii|hello|hey|yo|sup|good morning|good evening|good afternoon)$/.test(clean);
}

export function asksTutorToAskFirst(text: string): boolean {
  const clean = normalizeText(text);
  return (
    clean.includes("ask me") ||
    clean.includes("ask first") ||
    clean.includes("question first") ||
    clean.includes("quiz me") ||
    clean.includes("test me")
  );
}

export function extractLikelyTopic(text: string): string | null {
  const cleaned = normalizeText(text);
  const intentMatch = cleaned.match(/\b(?:learn|study|about|on|for)\s+([a-z0-9\s]{2,40})$/);
  if (intentMatch?.[1]) {
    const candidate = intentMatch[1]
      .split(" ")
      .filter((token) => token.length > 1 && !NON_TOPIC_WORDS.has(token))
      .join(" ")
      .trim();
    if (candidate) return candidate;
  }
  const tokens = tokenizeMeaningful(text).filter((token) => !NON_TOPIC_WORDS.has(token));
  if (tokens.length === 0) return null;
  if (tokens.length <= 3) return tokens.join(" ");
  const subjectMatch = cleaned.match(/\b(?:about|on|for)\s+([a-z0-9\s]{3,40})$/);
  if (subjectMatch?.[1]) return subjectMatch[1].trim();
  return null;
}

export function isTopicOnlyMessage(text: string): boolean {
  const clean = normalizeText(text);
  if (!clean) return false;
  if (clean.split(" ").length > 4) return false;
  if (isGreetingMessage(clean)) return false;
  if (seemsAttempt(clean)) return false;
  if (asksTutorToAskFirst(clean)) return false;
  return /^[a-z0-9\s]+$/.test(clean);
}

export function buildDiagnosticQuestion(topic: string, evidence: RetrievedChunk[]): string {
  const cleanTopic = topic.trim() || "this topic";
  const seedBase = cleanTopic
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  const keyPoint = buildExpectedKeyPoints(evidence)[0];
  const prompts = [
    `Great. Quick diagnostic on ${cleanTopic}: in one sentence, define it as if teaching a junior.`,
    `Let's start with ${cleanTopic}. What is one common mistake students make in it, and why?`,
    `Diagnostic check for ${cleanTopic}: explain the core mechanism in one sentence, then give one example.`,
    `Before we dive deeper into ${cleanTopic}, what is the difference between its main idea and a look-alike concept?`,
  ];
  const question = prompts[seedBase % prompts.length];
  if (!keyPoint) return question;
  return `${question}\nFocus keyword: ${keyPoint}.`;
}

export function lowConfidenceResponse(): string {
  return "I'm uncertain based on current retrieval quality. Shall I search your notes again with a narrower topic?";
}

export function minimalHint(missingKey: string): string {
  return `Hint (minimal): Focus on ${missingKey}. Try restating the definition in 10 words or less.`;
}

export function escalationExplanation(
  message: string,
  evaluation: AttemptEvaluation,
  evidence: RetrievedChunk[],
): string {
  const top = evidence[0];
  const missing = evaluation.missingKeyPoints.slice(0, 2).join(", ") || "the core mechanism";
  const snippet = top?.chunkText.slice(0, 220) ?? "Use your notes for the exact wording.";
  return [
    "Step-by-step:",
    `1) Identify the target concept in the question: "${message.slice(0, 90)}".`,
    `2) State the core idea in plain words, centered on ${missing}.`,
    "3) Map the idea to the process or rule it controls.",
    "4) Verify with a concrete case and a non-case.",
    "5) Check whether each step depends on the previous one.",
    "6) Summarize the chain in one sentence.",
    `Worked example: Start from this evidence snippet -> "${snippet}" and convert it into a cause -> mechanism -> result chain.`,
    "Check: In one sentence, explain why step 2 is necessary before step 4.",
  ].join("\n");
}

export function buildRootCauseAndRemediation(
  evaluation: AttemptEvaluation,
  failedAttempts: number,
): { rootCause: string; remediation: string[] } {
  const missing = evaluation.missingKeyPoints[0] ?? "a core concept";
  if (failedAttempts >= 2) {
    return {
      rootCause: `Root cause: recurring confusion around ${missing} is blocking application accuracy.`,
      remediation: [
        `Do two 2-minute retrieval drills focused only on ${missing}.`,
        "Write one worked example and one non-example from memory.",
        "Teach back the concept in one sentence before checking notes.",
      ],
    };
  }
  return {
    rootCause: `Root cause: partial recall of ${missing}.`,
    remediation: [
      `Restate ${missing} in plain words.`,
      "Connect it to one concrete scenario.",
    ],
  };
}

export function inferConceptId(message: string, evidence: RetrievedChunk[]): string {
  const fromEvidence = buildExpectedKeyPoints(evidence)[0];
  if (fromEvidence) return fromEvidence;
  const fromMessage = tokenizeMeaningful(message)[0];
  return fromMessage ?? "general_concept";
}

export function provenancePointers(evidence: RetrievedChunk[]): ProvenancePointer[] {
  return evidence.slice(0, 4).map((item) => ({ pageId: item.pageId, chunkIndex: item.chunkIndex }));
}
