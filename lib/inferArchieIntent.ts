export type ArchieClearIntentType =
  | "substitution"
  | "dietary_adjustment"
  | "recipe_question"
  | "recipe_alteration"
  | "ingredient_recommendation"
  | "general";

export type ArchieIntentResult =
  | { type: Exclude<ArchieClearIntentType, "ingredient_recommendation"> }
  | {
      type: "ingredient_recommendation";
      subject?: string;
      constraints: string[];
    }
  | { type: "unclear"; clarification: string; subject?: string };

/** @deprecated Prefer ArchieIntentResult — kept for narrow call sites during migration. */
export type ArchieMessageIntent = ArchieClearIntentType | "unclear";

export type ArchieIntentContext = {
  text: string;
  hasAttachedRecipe?: boolean;
  previousUserMessage?: string;
  previousAssistantMessage?: string;
};

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
  /\bgo well with\b/i,
  /\bwhat can i (swap|use) instead\b/i,
  /\buse what (i have|is already|what's already)\b/i,
  /\buse what'?s already in my pantry\b/i
];

const DIETARY_PATTERNS = [
  /\blower sodium\b/i,
  /\blow[\s-]?sodium\b/i,
  /\blow[\s-]?fat\b/i,
  /\bmake this lower\b/i,
  /\bdietary goal/i,
  /\bmy conditions\b/i,
  /\bhealthier\b/i,
  /\bfor my diet\b/i,
  /\bdairy[\s-]?free\b/i,
  /\bgluten[\s-]?free\b/i,
  /\bmake this recipe\b/i,
  /\bsuggest a (lower|healthier)\b/i
];

const RECIPE_QUESTION_PATTERNS = [
  /\bwhat is step\b/i,
  /\bstep \d+\b/i,
  /\bhow long\b/i,
  /\bhow do i\b/i,
  /\bcan i prep\b/i,
  /\bprep ahead\b/i,
  /\bsimmer\b/i,
  /\bwhen should i\b/i,
  /\btell me whether\b/i,
  /\bwhether .+ is (healthy|bad|good)\b/i
];

const RECIPE_ALTERATION_PATTERNS = [
  /\bchange the recipe\b/i,
  /\bupdate it\b/i,
  /\bapply this\b/i,
  /\buse this instead\b/i,
  /\balter\b/i,
  /\bmodify\b/i
];

/** Open-ended alternatives / comparison asks — not recipe-scoped swap flow. */
const RECOMMENDATION_SIGNAL_PATTERNS = [
  /\balternatives?\b/i,
  /\bsimilar to\b/i,
  /\bversatile\b/i,
  /\bbest (replacement|substitute|alternative|option)\b/i,
  /\bclosest (option|match|substitute|replacement)\b/i,
  /\bcompare\b/i,
  /\bversus\b/i,
  /\bvs\.?\b/i,
  /\bother (options|alternatives|substitutes)\b/i,
  /\bwhat (else |other )?(can|could) (i |we )?(use|replace|substitute)\b/i,
  /\bwhat can replace\b/i,
  /\bwhat (is|are) (a |the |some |other )?(good |best )?(high[\s-]?protein )?(substitute|replacement|alternative)/i,
  /\bhigh[\s-]?protein\b/i
];

/** Short food-quality / nutrition questions — clear, not local clarification. */
const NUTRITION_QUESTION_PATTERNS = [
  /^[\w][\w\s'-]{0,40}?\s+(good|bad|healthy|unhealthy|ok|okay|fine)(?:\s+for\s+[\w\s-]{1,30})?\s*\?$/i,
  /^is\s+(?!very\b)[\w][\w\s'-]{0,40}?\s+(good|bad|healthy|unhealthy|ok|okay|fine)(?:\s+for\s+[\w\s-]{1,30})?\s*\??$/i,
  /^is\s+(this|it)\s+(good|bad|healthy|unhealthy|ok|okay|fine)\s*\??$/i,
  /\bcan i (eat|have)\b/i,
  /\bis\s+.+\s+high in\b/i,
  /\bhigh in (sodium|protein|fat|calories|sugar|fiber)\b/i
];

const FOOD_SUBJECT_PATTERNS = [
  /\bcottage\s*cheese\b/i,
  /\bheavy\s*cream\b/i,
  /\bgreek\s*yogurt\b/i,
  /\bricotta\b/i,
  /\bquark\b/i,
  /\bfeta\b/i,
  /\beggs?\b/i,
  /\bbutter\b/i,
  /\bmushroom/i,
  /\bchicken\b/i,
  /\bcoconut\s*milk\b/i,
  /\btofu\b/i,
  /\bcheese\b/i,
  /\bcream\b/i,
  /\bmilk\b/i,
  /\byogurt\b/i,
  /\bingredient\b/i
];

const CONSTRAINT_EXTRACTORS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bhigh[\s-]?protein\b/i, label: "high protein" },
  { pattern: /\bversatile\b/i, label: "versatile" },
  { pattern: /\bdairy[\s-]?free\b/i, label: "dairy-free" },
  { pattern: /\blow[\s-]?fat\b/i, label: "low-fat" },
  { pattern: /\blow[\s-]?sodium\b/i, label: "low-sodium" },
  { pattern: /\bsavory\b/i, label: "savory" },
  { pattern: /\bbak(e|ing)\b/i, label: "baking" },
  { pattern: /\bsweet\b/i, label: "sweet" }
];

/** Opinion *statements* (not questions) that need clarification about intent. */
const OPINION_STATEMENT_PATTERNS = [
  /\bis very bad\b/i,
  /\bis bad\b/i,
  /\bis good\b/i,
  /\bis unhealthy\b/i,
  /\bis healthy\b/i,
  /\bi don'?t like\b/i,
  /\bi hate\b/i,
  /\bthis is bad\b/i,
  /\bit is unhealthy\b/i,
  /\bthis is unhealthy\b/i
];

const VAGUE_PRONOUN_PATTERNS = [
  /^can i use this\??$/i,
  /^what about this\??$/i,
  /^what about it\??$/i,
  /^use this\??$/i
];

const OBJECTLESS_COMMAND_PATTERNS = [/^make it better\.?$/i, /^make it healthier\.?$/i, /^fix it\.?$/i];

function extractSubject(text: string): string | undefined {
  for (const pattern of FOOD_SUBJECT_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[0].toLowerCase();
  }
  return undefined;
}

export function extractRecommendationConstraints(text: string): string[] {
  const constraints: string[] = [];
  for (const item of CONSTRAINT_EXTRACTORS) {
    if (item.pattern.test(text)) constraints.push(item.label);
  }
  return constraints;
}

export function isIngredientRecommendationRequest(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const hasSignal = RECOMMENDATION_SIGNAL_PATTERNS.some((pattern) => pattern.test(trimmed));
  if (!hasSignal) return false;

  // Recipe-scoped "can I use X instead" stays in substitution flow when attached.
  // Open-ended alternative / compare / best-substitute asks are recommendations.
  if (
    /\b(alternatives?|compare|versus|\bvs\.?\b|closest|best (replacement|substitute|alternative)|similar to|versatile|other (options|alternatives))\b/i.test(
      trimmed
    )
  ) {
    return true;
  }

  if (/\bwhat (is|are) .*(substitute|replacement|alternative)/i.test(trimmed)) {
    return true;
  }

  if (/\bwhat can replace\b/i.test(trimmed)) {
    return true;
  }

  if (/\bhigh[\s-]?protein\b/i.test(trimmed) && /\b(substitute|alternative|replace|instead)\b/i.test(trimmed)) {
    return true;
  }

  return false;
}

function isBareIngredient(text: string) {
  const normalized = text.trim().replace(/[?.!]+$/g, "");
  return FOOD_SUBJECT_PATTERNS.some((pattern) => {
    const match = normalized.match(pattern);
    return Boolean(match && match[0].length === normalized.length);
  });
}

function recentHistoryMentionsSubject(
  subject: string | undefined,
  previousUserMessage?: string,
  previousAssistantMessage?: string
) {
  if (!subject) return false;
  const haystack = `${previousUserMessage ?? ""} ${previousAssistantMessage ?? ""}`.toLowerCase();
  return haystack.includes(subject.toLowerCase());
}

function isNutritionQualityQuestion(text: string) {
  return NUTRITION_QUESTION_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

export function isNutritionQualityUserMessage(text: string) {
  return isNutritionQualityQuestion(text) || /\b(good|healthy|unhealthy|protein|sodium|calorie|fit my diet|good snack)\b/i.test(text);
}

function isOpinionStatement(text: string) {
  const trimmed = text.trim();
  if (/\?$/.test(trimmed)) return false;
  if (/^(is|are|can|should|does|do|what|how|why)\b/i.test(trimmed)) return false;
  return OPINION_STATEMENT_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function clarificationFor(text: string, hasAttachedRecipe: boolean, subject?: string): string {
  if (VAGUE_PRONOUN_PATTERNS.some((pattern) => pattern.test(text.trim()))) {
    return "What ingredient or recipe are you referring to?";
  }

  if (subject) {
    if (hasAttachedRecipe) {
      return `What would you like to change about ${subject} in this recipe?`;
    }
    return `Are you asking whether ${subject} is healthy, or how to use it in a recipe?`;
  }

  if (hasAttachedRecipe) {
    return "What would you like to change in this recipe?";
  }

  return "What would you like help with — a recipe swap, a dietary question, or something else?";
}

function isClearRequest(text: string): ArchieIntentResult | null {
  if (RECIPE_ALTERATION_PATTERNS.some((pattern) => pattern.test(text))) {
    return { type: "recipe_alteration" };
  }

  if (isIngredientRecommendationRequest(text)) {
    return {
      type: "ingredient_recommendation",
      subject: extractSubject(text),
      constraints: extractRecommendationConstraints(text)
    };
  }

  if (DIETARY_PATTERNS.some((pattern) => pattern.test(text))) {
    return { type: "dietary_adjustment" };
  }
  if (RECIPE_QUESTION_PATTERNS.some((pattern) => pattern.test(text))) {
    return { type: "recipe_question" };
  }
  if (SUBSTITUTION_PATTERNS.some((pattern) => pattern.test(text))) {
    return { type: "substitution" };
  }
  if (isNutritionQualityQuestion(text)) {
    return { type: "general" };
  }
  return null;
}

export function inferArchieIntentResult(context: ArchieIntentContext): ArchieIntentResult {
  const text = context.text.trim();
  if (!text) {
    return {
      type: "unclear",
      clarification: "What would you like help with?"
    };
  }

  const isVaguePronoun = VAGUE_PRONOUN_PATTERNS.some((pattern) => pattern.test(text));
  const clear = isClearRequest(text);

  if (clear && !isVaguePronoun) {
    return clear;
  }

  if (isNutritionQualityQuestion(text)) {
    return { type: "general" };
  }

  const subject = extractSubject(text);
  const priorSubject = extractSubject(context.previousUserMessage ?? "");
  const groundedFollowUp =
    recentHistoryMentionsSubject(subject, context.previousUserMessage, context.previousAssistantMessage) ||
    (isVaguePronoun &&
      Boolean(priorSubject) &&
      recentHistoryMentionsSubject(
        priorSubject,
        context.previousUserMessage,
        context.previousAssistantMessage
      ));

  if (groundedFollowUp && !isOpinionStatement(text)) {
    if (
      SUBSTITUTION_PATTERNS.some((pattern) => pattern.test(text)) ||
      /^can i use this/i.test(text)
    ) {
      return { type: "substitution" };
    }
    return { type: "general" };
  }

  const looksVague =
    isBareIngredient(text) ||
    isOpinionStatement(text) ||
    isVaguePronoun ||
    OBJECTLESS_COMMAND_PATTERNS.some((pattern) => pattern.test(text)) ||
    (text.split(/\s+/).length <= 4 &&
      Boolean(subject) &&
      !/[?]/.test(text) &&
      !/\b(tell|explain|how|what|can|should|replace|swap|good|bad|healthy|alternative)\b/i.test(text));

  if (looksVague) {
    const resolvedSubject = subject ?? priorSubject ?? undefined;
    return {
      type: "unclear",
      clarification: clarificationFor(text, Boolean(context.hasAttachedRecipe), resolvedSubject),
      subject: resolvedSubject
    };
  }

  if (clear) {
    return clear;
  }

  return { type: "general" };
}

/** Back-compat wrapper returning the intent type string. */
export function inferArchieIntent(message: string): ArchieMessageIntent {
  return inferArchieIntentResult({ text: message }).type;
}

export function messageNeedsRecipeContext(message: string) {
  const result = inferArchieIntentResult({ text: message });
  if (
    result.type === "unclear" ||
    result.type === "general" ||
    result.type === "ingredient_recommendation"
  ) {
    return false;
  }
  return true;
}
