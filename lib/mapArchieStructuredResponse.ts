import type { ChatImageRecommendation, ChatApiResponse } from "@/services/aiClient";
import {
  finalizeStructuredResponse,
  splitSentences
} from "@/lib/archieAnswerFormatting";
import type {
  ArchieImageRecommendation,
  ArchieResponseTitle,
  ArchieStructuredResponse
} from "@/types/recipe";

export type MapAssistantReplyContext = {
  userMessage?: string;
  recipeTitle?: string;
  source?: ChatApiResponse["source"];
  hasImage?: boolean;
};

const GUARDRAIL_MARKERS = [
  "I don't detect a cooking-related image",
  "I can only help with food, ingredients, recipes, nutrition labels, grocery products"
];

const EXTRACTION_FAILURE_MARKER = "I couldn't identify a food item in this image";

const UI_PROMPT_MARKERS = [
  "Which recipe should I use",
  "Which ingredient would you like",
  "What do you have available instead",
  "Which recipe would you like to attach",
  "What would you like to know about"
];

const FOOD_CONTENT_PATTERNS = [
  /\bcottage\s*cheese\b/i,
  /\bfeta\s*cheese\b/i,
  /\bfeta\b/i,
  /\bcottage\b/i,
  /\bsubstitut/i,
  /\bheavy\s*cream\b/i,
  /\bcreamy\s*tomato\s*soup\b/i,
  /\blow[\s-]?fat\b/i,
  /\blow[\s-]?sodium\b/i,
  /\bdietary\b/i,
  /\brecipe\b/i,
  /\bingredient/i,
  /\bnutrition\b/i,
  /\bprotein\b/i,
  /\bsodium\b/i,
  /\bsoup\b/i,
  /\bcheese\b/i,
  /\bcream\b/i,
  /\bswap\b/i,
  /\breplace\b/i,
  /\bbroth\b/i,
  /\bdairy\b/i,
  /\ballerg/i,
  /\bpantry\b/i,
  /\bcook/i,
  /\bmeal\b/i,
  /\btry\s+.+\(/i
];

function capitalizeIngredient(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isGuardrailReply(reply: string) {
  return GUARDRAIL_MARKERS.some((marker) => reply.includes(marker));
}

function isExtractionFailureReply(reply: string) {
  return reply.includes(EXTRACTION_FAILURE_MARKER);
}

function isScopeDeclineReply(reply: string) {
  return (
    reply.startsWith("I'm Archie — I can only help with recipes") ||
    reply.includes("I can't help with that request")
  );
}

function isConversationalPrompt(reply: string) {
  return (
    /^I can see you've shared a photo/i.test(reply) ||
    UI_PROMPT_MARKERS.some((marker) => reply.includes(marker))
  );
}

function isFoodRelatedContent(...texts: Array<string | undefined>) {
  const combined = texts.filter(Boolean).join(" ");
  if (!combined.trim()) return false;
  return FOOD_CONTENT_PATTERNS.some((pattern) => pattern.test(combined));
}

function isRecipeChangeQuestion(text?: string) {
  if (!text) return false;
  return /\b(swap|substitut|replace|add to|use in|works in|go well|recipe|alter|change)\b/i.test(text);
}

function normalizeUserText(text: string) {
  return text
    .replace(/\bdietary\s+conductions\b/gi, "dietary conditions")
    .replace(/\bdietary\s+conditions\b/gi, "dietary conditions");
}

type IngredientResolution =
  | { kind: "resolved"; ingredient: string }
  | { kind: "ambiguous"; options: string[] }
  | { kind: "none" };

function resolveIngredientFromText(text: string): IngredientResolution {
  const normalized = normalizeUserText(text);

  if (/\bcottage\s*cheese\b/i.test(normalized) || /\bcottage\b/i.test(normalized)) {
    return { kind: "resolved", ingredient: "cottage cheese" };
  }

  if (/\bfeta\s*cheese\b/i.test(normalized) || /\bfeta\b/i.test(normalized)) {
    return { kind: "resolved", ingredient: "feta cheese" };
  }

  if (/\bfootage\s*cheese\b/i.test(normalized)) {
    return { kind: "ambiguous", options: ["cottage cheese", "feta cheese"] };
  }

  if (/\bheavy\s*cream\b/i.test(normalized)) {
    return { kind: "resolved", ingredient: "heavy cream" };
  }

  if (/\bgreek\s*yogurt\b/i.test(normalized)) {
    return { kind: "resolved", ingredient: "greek yogurt" };
  }

  return { kind: "none" };
}

function findSentence(sentences: string[], pattern: RegExp) {
  return sentences.find((sentence) => pattern.test(sentence));
}

function buildSummary(reply: string, maxSentences = 2) {
  const sentences = splitSentences(reply);
  if (sentences.length === 0) return reply.trim();
  return sentences.slice(0, maxSentences).join(" ");
}

function parsePlainFoodReply(reply: string) {
  const sentences = splitSentences(reply);

  const howToUse = findSentence(
    sentences,
    /\b(use|blend|add|stir|replace|substitut|mix|serve|try)\b/i
  );
  const dietaryFit = findSentence(
    sentences,
    /\b(low[\s-]?fat|low[\s-]?sodium|protein|dietary|nutrition|goal|healthier|lighter)\b/i
  );
  const watchOut = findSentence(
    sentences,
    /\b(however|watch|avoid|curdle|sodium|salt|but|tangier|less silky|caution|careful|do not boil)\b/i
  );
  const recipeUpdate = findSentence(
    sentences,
    /\b(step|heat|stir|boil|simmer|reduce heat|blend)\b/i
  );

  const used = new Set(
    [howToUse, dietaryFit, watchOut, recipeUpdate].filter(Boolean).map((s) => s!.toLowerCase())
  );
  const summarySentences = sentences.filter((sentence) => !used.has(sentence.toLowerCase()));

  return {
    summary: summarySentences.slice(0, 2).join(" ") || buildSummary(reply),
    howToUse,
    dietaryFit,
    watchOut,
    recipeUpdate
  };
}

function buildClarificationCard(options: string[]): ArchieStructuredResponse {
  return {
    title: "Archie's answer",
    summary: `I think you may mean ${options.join(" or ")}. Which one are you asking about?`,
    nextStep: "Once you confirm the ingredient, I can give a recipe-specific answer."
  };
}

function fromRecommendation(
  recommendation: ChatImageRecommendation | ArchieImageRecommendation,
  replyText?: string
): ArchieStructuredResponse {
  const isCottageCheese = recommendation.detectedIngredient.toLowerCase().includes("cottage cheese");
  const summary = isCottageCheese
    ? "Yes. Cottage cheese works well as a substitute for heavy cream if you blend it before adding it to the soup."
    : `Yes. ${capitalizeIngredient(recommendation.detectedIngredient)} can work in this recipe with a few adjustments.`;

  return {
    title: "Archie's recommendation",
    summary,
    isImageResponse: true,
    identified: capitalizeIngredient(recommendation.detectedIngredient),
    howToUse: recommendation.howToUse,
    dietaryFit: isCottageCheese
      ? "Using low-fat cottage cheese keeps the soup higher in protein and lower in fat."
      : recommendation.dietaryFit,
    watchOut: isCottageCheese
      ? "Do not boil after adding or the cheese may curdle."
      : recommendation.watchOut,
    recipeUpdate: recommendation.recipeStepUpdate
  };
}

function buildGuardrailCard(): ArchieStructuredResponse {
  return {
    title: "Archie's note",
    summary:
      "I don't detect a cooking-related image here, so I can't recommend whether it belongs in a recipe.",
    howToUse:
      "Upload an ingredient, packaged food, nutrition label, or a photo of the dish you're making.",
    watchOut: "I won't analyze unrelated images or guess whether they belong in a recipe."
  };
}

function buildUnrelatedImageGuardrailCard(): ArchieStructuredResponse {
  return {
    title: "Archie's note",
    summary: "No food or cooking-related item detected in this image.",
    howToUse:
      "Try uploading an ingredient, grocery product, nutrition label, recipe screenshot, or a photo of the dish you're making.",
    watchOut: "I can only help with food, recipes, nutrition, and cooking-related images."
  };
}

function buildExtractionFailureCard(): ArchieStructuredResponse {
  return {
    title: "Archie's note",
    summary: "I couldn't identify a clear food item in this image.",
    howToUse:
      "Try uploading a clearer photo of the ingredient, packaged product, nutrition label, or dish you're working with.",
    watchOut: "I need a cooking-related image before I can recommend whether it belongs in a recipe."
  };
}

function buildCottageCheeseTextCard(reply: string, context: MapAssistantReplyContext): ArchieStructuredResponse {
  const parsed = parsePlainFoodReply(reply);
  const recipeTitle = context.recipeTitle ?? "creamy tomato soup";
  const isRecipeQuestion = isRecipeChangeQuestion(context.userMessage);

  return {
    title: isRecipeQuestion ? "Archie's recommendation" : "Archie's answer",
    summary:
      parsed.summary ||
      "Cottage cheese can be a good option if you're aiming for a lower-fat, higher-protein diet. Choose a low-fat variety and check the sodium content.",
    howToUse:
      parsed.howToUse ??
      `Cottage cheese can work as a lighter substitute in ${recipeTitle} if you blend it first, then stir it in on low heat.`,
    dietaryFit:
      parsed.dietaryFit ??
      "It can support low-fat goals if you use low-fat cottage cheese. Check sodium, because cottage cheese can be salty.",
    watchOut:
      parsed.watchOut ??
      "Texture and flavor will be tangier and less silky than heavy cream. Do not boil after adding.",
    recipeUpdate: isRecipeQuestion
      ? parsed.recipeUpdate ??
        "Reduce heat to low. Blend cottage cheese with warm soup until smooth, then stir it in gently."
      : undefined
  };
}

function buildGenericFoodCard(
  reply: string,
  context: MapAssistantReplyContext,
  options?: { isImageResponse?: boolean; identified?: string; title?: ArchieResponseTitle }
): ArchieStructuredResponse {
  const parsed = parsePlainFoodReply(reply);
  const isRecipeQuestion = isRecipeChangeQuestion(context.userMessage) || options?.isImageResponse;

  return {
    title: options?.title ?? (isRecipeQuestion ? "Archie's recommendation" : "Archie's answer"),
    summary: parsed.summary || buildSummary(reply),
    isImageResponse: options?.isImageResponse,
    identified: options?.isImageResponse ? options.identified : undefined,
    howToUse: parsed.howToUse,
    dietaryFit: parsed.dietaryFit,
    watchOut: parsed.watchOut,
    recipeUpdate: parsed.recipeUpdate
  };
}

function fromFallbackImageReply(reply: string): ArchieStructuredResponse | null {
  const basedOnMatch = reply.match(/^Based on your photo, this looks like (.+?)\. For/i);
  if (basedOnMatch) {
    return {
      title: "Archie's recommendation",
      summary: `Yes. This looks like ${basedOnMatch[1]} and may work depending on how you add it.`,
      isImageResponse: true,
      identified: capitalizeIngredient(basedOnMatch[1]),
      howToUse:
        "Blend smooth, stir in off heat, and avoid boiling dairy so it does not curdle.",
      watchOut: "Confirm the ingredient in your photo before adding it to the recipe."
    };
  }

  const identifiedMatch = reply.match(/^I identified (.+?) in your photo\./i);
  if (identifiedMatch) {
    return {
      title: "Archie's recommendation",
      summary: `I identified ${identifiedMatch[1]} in your photo.`,
      isImageResponse: true,
      identified: capitalizeIngredient(identifiedMatch[1]),
      nextStep: "Tell me whether you want to swap, add, or adjust an ingredient and I can guide you.",
      watchOut: "Double-check the photo matches the ingredient you intend to use."
    };
  }

  const kitchenToolMatch = reply.match(/^Your photo looks like a (.+?), not an ingredient\./i);
  if (kitchenToolMatch) {
    return {
      title: "Archie's note",
      summary: `Your photo looks like a ${kitchenToolMatch[1].toLowerCase()}, not an ingredient.`,
      isImageResponse: true,
      identified: capitalizeIngredient(kitchenToolMatch[1]),
      howToUse: "Upload a photo of the food or ingredient you're considering instead.",
      watchOut: "Kitchen tools can't be added to recipes as ingredients."
    };
  }

  const nutritionLabelMatch = reply.match(/^I see a nutrition label in your photo\./i);
  if (nutritionLabelMatch) {
    return {
      title: "Archie's recommendation",
      summary: "I see a nutrition label in your photo.",
      isImageResponse: true,
      identified: "Nutrition label",
      howToUse: "Compare sodium, fat, and protein against your goals, then ask which value you want help adjusting."
    };
  }

  const preparedFoodMatch = reply.match(/^Your photo looks like a prepared dish \((.+?)\)/i);
  if (preparedFoodMatch) {
    return {
      title: "Archie's recommendation",
      summary: `Your photo looks like a prepared dish (${preparedFoodMatch[1]}), not a raw ingredient.`,
      isImageResponse: true,
      identified: capitalizeIngredient(preparedFoodMatch[1]),
      nextStep: "Tell me whether you want to serve it alongside, use it as a base, or swap part of the recipe.",
      watchOut: "Prepared dishes behave differently than raw ingredients in a recipe."
    };
  }

  const trySwapMatch = reply.match(/^Try (.+?) \((.+?)\)\.\s*(.+)$/i);
  if (trySwapMatch) {
    return {
      title: "Archie's recommendation",
      summary: `Yes. Try ${trySwapMatch[1]} (${trySwapMatch[2]}).`,
      howToUse: trySwapMatch[2],
      whyThisWorks: trySwapMatch[3]
    };
  }

  return null;
}

export function mapAssistantReplyToStructured(
  reply: string,
  context: MapAssistantReplyContext = {}
): ArchieStructuredResponse | null {
  const trimmed = reply.trim();
  if (!trimmed) return null;

  if (isConversationalPrompt(trimmed) || isScopeDeclineReply(trimmed)) {
    return null;
  }

  if (isGuardrailReply(trimmed)) {
    return finalizeStructuredResponse(buildGuardrailCard(), context, trimmed);
  }

  if (isExtractionFailureReply(trimmed)) {
    return finalizeStructuredResponse(buildExtractionFailureCard(), context, trimmed);
  }

  const imageFallback = fromFallbackImageReply(trimmed);
  if (imageFallback) {
    return finalizeStructuredResponse(imageFallback, context, trimmed);
  }

  const combinedText = normalizeUserText([context.userMessage, trimmed, context.recipeTitle].join(" "));
  if (!isFoodRelatedContent(combinedText, context.userMessage, trimmed)) {
    return null;
  }

  const ingredientResolution = resolveIngredientFromText(context.userMessage ?? combinedText);

  if (ingredientResolution.kind === "ambiguous") {
    return finalizeStructuredResponse(buildClarificationCard(ingredientResolution.options), context, trimmed);
  }

  if (
    ingredientResolution.kind === "resolved" &&
    ingredientResolution.ingredient === "cottage cheese" &&
    !context.hasImage
  ) {
    return finalizeStructuredResponse(buildCottageCheeseTextCard(trimmed, context), context, trimmed);
  }

  const identified =
    ingredientResolution.kind === "resolved"
      ? capitalizeIngredient(ingredientResolution.ingredient)
      : undefined;

  return finalizeStructuredResponse(
    buildGenericFoodCard(trimmed, context, {
      isImageResponse: context.hasImage,
      identified: context.hasImage ? identified : undefined
    }),
    context,
    trimmed
  );
}

export function mapChatResponseToStructured(
  response: ChatApiResponse,
  context: MapAssistantReplyContext = {}
): ArchieStructuredResponse | null {
  if (response.recommendation) {
    return finalizeStructuredResponse(
      fromRecommendation(response.recommendation, response.reply),
      context,
      response.reply
    );
  }

  if (response.source === "declined" && isGuardrailReply(response.reply)) {
    return finalizeStructuredResponse(buildGuardrailCard(), context, response.reply);
  }

  if (isExtractionFailureReply(response.reply)) {
    return finalizeStructuredResponse(buildExtractionFailureCard(), context, response.reply);
  }

  if (response.source === "fallback" || response.source === "demo") {
    const structured = fromFallbackImageReply(response.reply);
    if (structured) {
      return finalizeStructuredResponse(structured, context, response.reply);
    }

    if (isGuardrailReply(response.reply)) {
      return finalizeStructuredResponse(buildUnrelatedImageGuardrailCard(), context, response.reply);
    }
  }

  return mapAssistantReplyToStructured(response.reply, {
    ...context,
    source: response.source
  });
}

export function formatAssistantMessage(
  reply: string,
  context: MapAssistantReplyContext = {}
): { text: string; structuredResponse?: ArchieStructuredResponse } {
  const structuredResponse = mapAssistantReplyToStructured(reply, context);
  if (structuredResponse) {
    return { text: "", structuredResponse };
  }
  return { text: reply };
}

export function resolveMessageStructuredResponse(
  message: {
    text: string;
    structuredResponse?: ArchieStructuredResponse;
    recommendation?: ArchieImageRecommendation;
    imageUri?: string;
  },
  context: MapAssistantReplyContext = {}
): ArchieStructuredResponse | null {
  if (message.structuredResponse) {
    return finalizeStructuredResponse(
      message.structuredResponse,
      context,
      message.text || message.structuredResponse.summary
    );
  }

  if (message.recommendation) {
    return finalizeStructuredResponse(
      fromRecommendation(message.recommendation, message.text),
      context,
      message.text
    );
  }

  return mapAssistantReplyToStructured(message.text, {
    ...context,
    hasImage: context.hasImage ?? Boolean(message.imageUri)
  });
}

export function assistantMessageUsesStructuredCard(message: {
  role: string;
  text: string;
  structuredResponse?: ArchieStructuredResponse;
  recommendation?: ArchieImageRecommendation;
}): boolean {
  return message.role === "assistant" && resolveMessageStructuredResponse(message) !== null;
}
