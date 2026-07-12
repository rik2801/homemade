import type { ChatImageRecommendation, ChatRequest, ChatResponse } from "../types/ai";
import type { ImageClassificationResult } from "./imageClassifier";
import type { ExtractedIngredient } from "./ingredientExtractor";

export type RecipeReasoningInput = {
  request: ChatRequest;
  classification: ImageClassificationResult;
  extracted: ExtractedIngredient;
};

const INGREDIENT_USAGE_PATTERNS = [
  /\bwill this go well\b/i,
  /\bcan i use this\b/i,
  /\bwill this work\b/i,
  /\bcan this replace\b/i,
  /\bcan we add this\b/i,
  /\bif yes how\b/i,
  /\bhow do i use this\b/i,
  /\bwould this work\b/i,
  /\bgood addition\b/i,
  /\bgo well with\b/i,
  /\bcan i add this\b/i,
  /\bshould i use this\b/i,
  /\bhow should i use\b/i,
  /\breplacement for\b/i,
  /\breplace\b/i,
  /\bbelongs in\b/i,
  /\badd to\b/i
];

export function isIngredientUsageQuestion(message: string) {
  return INGREDIENT_USAGE_PATTERNS.some((pattern) => pattern.test(message));
}

function buildCottageCheeseTomatoSoupResponse(): {
  reply: string;
  recommendation: ChatImageRecommendation;
} {
  const reply =
    "Cottage cheese can work in creamy tomato soup, but I would not stir it in directly. Blend it first with a little warm soup or milk until smooth, then add it on low heat after the soup is done simmering. Do not boil it after adding, or it may curdle.\n\nUse about 1/2 cup blended cottage cheese to replace 1/2 cup heavy cream. It will make the soup higher in protein and lighter, but slightly tangier and less silky than cream.";

  return {
    reply,
    recommendation: {
      verdict: "Yes, with adjustment",
      detectedIngredient: "cottage cheese",
      howToUse:
        "Blend about 1/2 cup cottage cheese with a few spoonfuls of warm soup or milk until smooth. Stir into the finished soup on low heat. Do not boil after adding.",
      dietaryFit:
        "Works for low-fat goals if you use low-fat cottage cheese — higher protein and lighter than heavy cream.",
      watchOut:
        "Cottage cheese can be salty, so reduce added salt in the soup. It may curdle if boiled or stirred in without blending first.",
      recipeStepUpdate:
        "Reduce heat to low. Blend cottage cheese with a few spoonfuls of warm soup until smooth, then stir it in gently. Do not boil."
    }
  };
}

function buildKitchenToolResponse(request: ChatRequest, extracted: ExtractedIngredient): ChatResponse {
  const recipeTitle = request.recipe?.title;
  const toolHint = recipeTitle
    ? `I can't recommend adding kitchen tools to ${recipeTitle}.`
    : `I can't recommend adding kitchen tools to a recipe.`;

  return {
    source: "fallback",
    reply: `Your photo looks like a ${extracted.name.toLowerCase()}, not an ingredient. ${toolHint} Upload a photo of the food or ingredient you're considering instead.`,
    inScope: true
  };
}

function buildGenericCookingResponse(input: RecipeReasoningInput): ChatResponse {
  const { request, classification, extracted } = input;
  const ingredient = extracted.name;
  const recipeTitle = request.recipe?.title;
  const recipePhrase = recipeTitle ? `For ${recipeTitle}, ` : "";
  const goals =
    request.dietaryGoals.length > 0 ? request.dietaryGoals.join(", ").toLowerCase() : "your goals";

  if (classification.category === "nutrition_label") {
    return {
      source: "fallback",
      reply: `I see a nutrition label in your photo. ${recipePhrase}compare sodium, fat, and protein against ${goals}, then tell me which value you want help with and I can suggest adjustments.`,
      inScope: true
    };
  }

  if (classification.category === "prepared_food") {
    return {
      source: "fallback",
      reply: `Your photo looks like a prepared dish (${ingredient}), not a raw ingredient. ${recipePhrase}tell me whether you want to serve it alongside, use it as a base, or swap part of the recipe and I can guide you.`,
      inScope: true
    };
  }

  if (isIngredientUsageQuestion(request.message)) {
    return {
      source: "fallback",
      reply: `Based on your photo, this looks like ${ingredient}. ${recipePhrase}it may work depending on how you add it — blend smooth, stir in off heat, and avoid boiling dairy so it does not curdle. Tell me if you want a step-by-step swap for a specific ingredient.`,
      inScope: true
    };
  }

  return {
    source: "fallback",
    reply: `I identified ${ingredient} in your photo. ${recipePhrase}I can help with whether it fits ${goals}, how much to use, and how to add it without breaking the texture.`,
    inScope: true
  };
}

function shouldUseCottageCheeseDemo(input: RecipeReasoningInput) {
  return (
    input.extracted.name.toLowerCase().includes("cottage cheese") &&
    input.request.recipe?.id === "creamy-tomato-soup" &&
    isIngredientUsageQuestion(input.request.message)
  );
}

/**
 * Generates a cooking answer from validated image extraction + recipe context.
 * Text LLM providers should be wired here later without changing upstream stages.
 */
export async function reasonAboutRecipe(input: RecipeReasoningInput): Promise<ChatResponse> {
  if (shouldUseCottageCheeseDemo(input)) {
    const demo = buildCottageCheeseTomatoSoupResponse();
    return {
      source: "demo",
      reply: demo.reply,
      recommendation: demo.recommendation,
      inScope: true
    };
  }

  if (input.classification.category === "kitchen_tool") {
    return buildKitchenToolResponse(input.request, input.extracted);
  }

  return buildGenericCookingResponse(input);
}
