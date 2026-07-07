export type ArchieMessageIntent =
  | "substitution"
  | "dietary_adjustment"
  | "recipe_question"
  | "recipe_alteration"
  | "general";

const SUBSTITUTION_PATTERNS = [
  /\bcan i use\b/i,
  /\bwill this go well\b/i,
  /\bwill this work\b/i,
  /\bdon'?t have\b/i,
  /\bdo not have\b/i,
  /\bwhat can replace\b/i,
  /\breplace\b/i,
  /\bsubstitut/i,
  /\binstead of\b/i,
  /\bwhat do i use\b/i,
  /\bgo well with\b/i
];

const DIETARY_PATTERNS = [
  /\blower sodium\b/i,
  /\blow[\s-]?sodium\b/i,
  /\blow[\s-]?fat\b/i,
  /\bmake this lower\b/i,
  /\bdietary goal/i,
  /\bmy conditions\b/i,
  /\bhealthier\b/i,
  /\bfor my diet\b/i
];

const RECIPE_QUESTION_PATTERNS = [
  /\bwhat is step\b/i,
  /\bstep \d+\b/i,
  /\bhow long\b/i,
  /\bhow do i\b/i,
  /\bcan i prep\b/i,
  /\bprep ahead\b/i,
  /\bsimmer\b/i,
  /\bwhen should i\b/i
];

const RECIPE_ALTERATION_PATTERNS = [
  /\bchange the recipe\b/i,
  /\bupdate it\b/i,
  /\bapply this\b/i,
  /\buse this instead\b/i,
  /\balter\b/i,
  /\bmodify\b/i
];

export function inferArchieIntent(message: string): ArchieMessageIntent {
  const text = message.trim();
  if (!text) return "general";

  if (RECIPE_ALTERATION_PATTERNS.some((pattern) => pattern.test(text))) {
    return "recipe_alteration";
  }

  if (DIETARY_PATTERNS.some((pattern) => pattern.test(text))) {
    return "dietary_adjustment";
  }

  if (RECIPE_QUESTION_PATTERNS.some((pattern) => pattern.test(text))) {
    return "recipe_question";
  }

  if (SUBSTITUTION_PATTERNS.some((pattern) => pattern.test(text))) {
    return "substitution";
  }

  return "general";
}

export function messageNeedsRecipeContext(message: string) {
  const intent = inferArchieIntent(message);
  return intent !== "general";
}
