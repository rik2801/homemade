import type { ArchieStructuredResponse } from "@/types/recipe";

type AnswerContext = {
  userMessage?: string;
  recipeTitle?: string;
};

export function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function formatSectionParagraph(text: string) {
  const sentences = splitSentences(text);
  if (sentences.length <= 2) return text.trim();

  const chunks: string[] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    chunks.push(sentences.slice(index, index + 2).join(" "));
  }
  return chunks.join("\n\n");
}

/** Light cleanup only — do not change semantic meaning or force Yes/No. */
export function cleanSummary(summary: string): string {
  const trimmed = summary.trim().replace(/\s+/g, " ");
  if (!trimmed) return trimmed;

  const sentences = splitSentences(trimmed);
  const deduped: string[] = [];
  for (const sentence of sentences) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.toLowerCase() === sentence.toLowerCase()) continue;
    deduped.push(sentence);
  }

  return deduped.join(" ").replace(/([.!?]){2,}/g, "$1");
}

function normalizeForOverlap(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Deterministic overlap check — omit sections that restate the summary. */
export function isSemanticallyDuplicate(sectionText: string, summary: string): boolean {
  const a = normalizeForOverlap(sectionText);
  const b = normalizeForOverlap(summary);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const tokensA = a.split(" ").filter((token) => token.length > 3);
  const tokensB = new Set(b.split(" ").filter((token) => token.length > 3));
  if (tokensA.length === 0) return false;

  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) overlap += 1;
  }

  return overlap / tokensA.length >= 0.6;
}

export type StructuredSection = {
  key: string;
  label: string;
  value: string;
};

/** Drop sections that mostly repeat the summary or each other. */
export function removeOverlappingSections(
  summary: string,
  sections: StructuredSection[]
): StructuredSection[] {
  const result: StructuredSection[] = [];
  for (const section of sections) {
    const value = section.value.trim();
    if (!value) continue;
    if (isSemanticallyDuplicate(value, summary)) continue;
    if (result.some((existing) => isSemanticallyDuplicate(value, existing.value))) continue;
    result.push({ ...section, value });
  }
  return result;
}

const UNNECESSARY_FOLLOW_UP =
  /\s*((Would you like to know more|What's the context for using|What would you like to know|Let me know if you|Do you want me to)[^.?\n]*[.?]?\s*)+$/i;

/** Strip padded closing questions from otherwise complete answers. */
export function stripUnnecessaryFollowUp(reply: string): string {
  const trimmed = reply.trim();
  if (!trimmed) return trimmed;

  const withoutFollowUp = trimmed.replace(UNNECESSARY_FOLLOW_UP, "").trim();
  // Also drop a trailing question sentence when prior content already answers.
  const sentences = splitSentences(withoutFollowUp);
  if (sentences.length >= 2 && /\?\s*$/.test(sentences[sentences.length - 1])) {
    const last = sentences[sentences.length - 1];
    if (
      /^(would you|what('s| is) the context|do you want|let me know|shall i|want me to)\b/i.test(
        last
      )
    ) {
      return sentences.slice(0, -1).join(" ").trim();
    }
  }

  return withoutFollowUp;
}

export function finalizeStructuredResponse(
  response: ArchieStructuredResponse,
  _context: AnswerContext,
  _reply?: string
): ArchieStructuredResponse {
  const isNote = response.title === "Archie's note";

  const summary = isNote
    ? formatSectionParagraph(response.summary)
    : cleanSummary(response.summary);

  const maybeSection = (value: string | undefined) => {
    if (!value) return undefined;
    const formatted = formatSectionParagraph(value);
    if (isSemanticallyDuplicate(formatted, summary)) return undefined;
    return formatted;
  };

  return {
    ...response,
    summary,
    howToUse: maybeSection(response.howToUse),
    dietaryFit: maybeSection(response.dietaryFit),
    preferenceFit: maybeSection(response.preferenceFit),
    watchOut: maybeSection(response.watchOut),
    recipeUpdate: maybeSection(response.recipeUpdate),
    whyThisWorks: maybeSection(response.whyThisWorks),
    nutritionNote: maybeSection(response.nutritionNote),
    nextStep: maybeSection(response.nextStep)
  };
}
