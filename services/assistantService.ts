import { CREAM_STEP_GREEK_YOGURT_MILK, homemadeRecipe } from "@/features/recipe/data/homemadeRecipe";
import type { PantryMode } from "@/features/preferences/data/preferenceOptions";
import { findIngredientById } from "@/lib/swapFlow";
import { formatDietaryFit } from "@/lib/preferences";
import {
  buildSubstituteApiRequest,
  requestIngredientSubstitution,
  type SubstituteApiResponse
} from "@/services/aiClient";
import type { Ingredient, PendingSuggestion, Recipe } from "@/types/recipe";

type RecommendationResult = {
  substituteItem: string;
  displayItem: string;
  recommendedUsage: string;
  ratio: string;
  why: string;
  dietaryFit?: string;
  recipeImpact?: string;
  confidence?: "High" | "Medium" | "Low";
  source: "ai" | "fallback";
  benefits: string[];
  stepOverride?: string;
  unavailableNotice?: boolean;
};

function normalizeUserHas(value: string) {
  return value.trim().toLowerCase();
}

function matchesUserHas(userHas: string, ...options: string[]) {
  const normalized = normalizeUserHas(userHas);
  return options.some((option) => normalized.includes(option));
}

function buildHeavyCreamRecommendation(userHas: string, forceFallback: boolean): RecommendationResult {
  const benefits = ["Lower fat", "Low sodium", "Creamy texture"];

  if (forceFallback) {
    return {
      substituteItem: "Evaporated skim milk",
      displayItem: "Evaporated skim milk",
      recommendedUsage: "1/2 cup evaporated skim milk",
      ratio: "Use 1/2 cup for 1/2 cup heavy cream",
      why: "Keeps creaminess with lower fat and no added sodium.",
      dietaryFit: "Fits low-fat and low-sodium goals.",
      recipeImpact: "Simmer briefly after adding — less rich but still creamy.",
      confidence: "High",
      source: "fallback",
      benefits,
      unavailableNotice: true
    };
  }

  if (matchesUserHas(userHas, "yogurt", "greek")) {
    return {
      substituteItem: "Greek yogurt + milk",
      displayItem: "Greek yogurt + milk",
      recommendedUsage: "1/2 cup Greek yogurt + 2 tbsp milk",
      ratio: "1/2 cup Greek yogurt + 2 tbsp milk",
      why: "Keeps the soup creamy while reducing saturated fat.",
      dietaryFit: "Fits low-fat and low-sodium goals.",
      recipeImpact: "Lower heat before stirring it in to prevent curdling.",
      confidence: "High",
      source: "ai",
      benefits,
      stepOverride: CREAM_STEP_GREEK_YOGURT_MILK
    };
  }

  if (matchesUserHas(userHas, "milk")) {
    return {
      substituteItem: "Milk + cornstarch slurry",
      displayItem: "Milk + cornstarch slurry",
      recommendedUsage: "1/2 cup milk + 1 tbsp cornstarch slurry",
      ratio: "1/2 cup milk whisked with 1 tbsp cornstarch slurry",
      why: "Adds body without heavy cream while keeping the swap pantry-simple.",
      dietaryFit: "Lower fat than heavy cream; choose unsalted milk if sodium is a concern.",
      recipeImpact: "Whisk the slurry in off heat, then warm gently to thicken.",
      confidence: "Medium",
      source: "ai",
      benefits
    };
  }

  if (matchesUserHas(userHas, "coconut")) {
    return {
      substituteItem: "Coconut milk",
      displayItem: "Coconut milk",
      recommendedUsage: "1/2 cup light coconut milk",
      ratio: "Use 1/2 cup light coconut milk for 1/2 cup heavy cream",
      why: "Adds richness and a smooth texture without dairy.",
      dietaryFit: "Can fit low-sodium goals if you choose an unsweetened can.",
      recipeImpact: "Works for texture, but changes flavor.",
      confidence: "Medium",
      source: "ai",
      benefits
    };
  }

  return {
    substituteItem: `${userHas.trim()} (adapted)`,
    displayItem: userHas.trim(),
    recommendedUsage: `Use ${userHas.trim()} in the same amount as heavy cream, adjusted to taste`,
    ratio: `Substitute ${userHas.trim()} for heavy cream in equal volume where possible`,
    why: "Uses what you told Archie you have on hand while keeping the recipe structure intact.",
    dietaryFit: "Review sodium and fat content of your substitute against the recipe goals.",
    recipeImpact: "Taste and texture may shift — adjust seasoning after swapping.",
    confidence: "Medium",
    source: "ai",
    benefits
  };
}

function buildGenericRecommendation(ingredient: Ingredient, userHas: string, forceFallback: boolean): RecommendationResult {
  const benefits = ["Lower fat", "Low sodium"];

  if (forceFallback) {
    return {
      substituteItem: "Guideline-safe alternative",
      displayItem: "Guideline-safe alternative",
      recommendedUsage: ingredient.amount,
      ratio: ingredient.amount,
      why: "Meets dietary guidelines for this recipe.",
      dietaryFit: "Fits low-fat and low-sodium goals.",
      recipeImpact: "Adjust seasoning after swapping.",
      confidence: "Medium",
      source: "fallback",
      benefits,
      unavailableNotice: true
    };
  }

  return {
    substituteItem: userHas.trim(),
    displayItem: userHas.trim(),
    recommendedUsage: `Use ${userHas.trim()} in place of ${ingredient.label}`,
    ratio: `Replace ${ingredient.amount} ${ingredient.label} with ${userHas.trim()}`,
    why: "Uses the ingredient you said you have while keeping the recipe workable.",
    dietaryFit: "Check that your substitute fits the recipe's dietary goals.",
    recipeImpact: "Flavor and texture may change slightly.",
    confidence: "Medium",
    source: "ai",
    benefits
  };
}

function buildLocalRecommendation(
  ingredient: Ingredient,
  userHas: string,
  forceFallback: boolean
): RecommendationResult {
  if (ingredient.label === "heavy cream") {
    return buildHeavyCreamRecommendation(userHas, forceFallback);
  }

  return buildGenericRecommendation(ingredient, userHas, forceFallback);
}

function apiResponseToRecommendation(response: SubstituteApiResponse): RecommendationResult {
  const { recommendation, source } = response;

  return {
    substituteItem: recommendation.name,
    displayItem: recommendation.name,
    recommendedUsage: recommendation.amount,
    ratio: recommendation.amount,
    why: recommendation.whyThisWorks,
    dietaryFit: recommendation.dietaryFit,
    recipeImpact: recommendation.recipeImpact,
    confidence: recommendation.confidence,
    source,
    benefits: recommendation.benefits,
    stepOverride: recommendation.updatedStep
  };
}

function toPendingSuggestion(
  ingredientId: string,
  ingredient: Ingredient,
  userHas: string,
  result: RecommendationResult,
  dietaryGoals: string[],
  allergies: string[]
): PendingSuggestion {
  return {
    ingredientId,
    originalItem: ingredient.label,
    originalAmount: ingredient.amount,
    userHas,
    substituteItem: result.substituteItem,
    displayItem: result.displayItem,
    recommendedUsage: result.recommendedUsage,
    ratio: result.ratio,
    why: result.why,
    dietaryFit: result.dietaryFit ?? formatDietaryFit(dietaryGoals, allergies),
    recipeImpact: result.recipeImpact,
    confidence: result.confidence,
    source: result.source,
    benefits: result.benefits,
    stepOverride: result.stepOverride,
    unavailableNotice: result.unavailableNotice
  };
}

type PreferenceContext = {
  dietaryGoals: string[];
  allergies: string[];
  cookingFor: string;
  pantryMode: PantryMode;
};

export async function runSwapGeneration(
  recipe: Recipe,
  ingredientId: string,
  userHas: string,
  forceFallback: boolean,
  preferences: PreferenceContext
): Promise<PendingSuggestion> {
  const ingredient = findIngredientById(recipe, ingredientId);
  if (!ingredient) {
    throw new Error("Missing ingredient");
  }

  if (forceFallback) {
    const result = buildLocalRecommendation(ingredient, userHas, true);
    return toPendingSuggestion(
      ingredientId,
      ingredient,
      userHas,
      result,
      preferences.dietaryGoals,
      preferences.allergies
    );
  }

  try {
    const payload = buildSubstituteApiRequest(recipe, ingredient, userHas, preferences);
    const response = await requestIngredientSubstitution(payload);
    const result = apiResponseToRecommendation(response);
    return toPendingSuggestion(
      ingredientId,
      ingredient,
      userHas,
      result,
      preferences.dietaryGoals,
      preferences.allergies
    );
  } catch {
    const result = buildLocalRecommendation(ingredient, userHas, true);
    return toPendingSuggestion(
      ingredientId,
      ingredient,
      userHas,
      result,
      preferences.dietaryGoals,
      preferences.allergies
    );
  }
}

export function getAlternateSuggestion(
  ingredientId: string,
  userHas: string,
  currentDisplayItem: string,
  preferences: PreferenceContext
): PendingSuggestion | null {
  const ingredient = findIngredientById(homemadeRecipe, ingredientId);
  if (!ingredient) return null;

  if (ingredient.label !== "heavy cream") return null;

  const altUserHas = matchesUserHas(userHas, "yogurt", "greek") ? "milk" : "Greek yogurt";
  const alt = buildHeavyCreamRecommendation(altUserHas, false);

  if (alt.displayItem === currentDisplayItem) return null;
  return toPendingSuggestion(
    ingredientId,
    ingredient,
    altUserHas,
    alt,
    preferences.dietaryGoals,
    preferences.allergies
  );
}
