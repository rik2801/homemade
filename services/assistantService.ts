import type { PantryMode } from "@/features/preferences/data/preferenceOptions";
import { findIngredientById } from "@/lib/swapFlow";
import { formatDietaryFit } from "@/lib/preferences";
import {
  buildSubstituteApiRequest,
  requestIngredientSubstitution,
  type SubstituteApiResponse
} from "@/services/aiClient";
import type { ArchieStepUpdate, Ingredient, PendingSuggestion, Recipe } from "@/types/recipe";

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
  stepUpdates?: ArchieStepUpdate[];
  unavailableNotice?: boolean;
};

type IngredientCategory = "cream" | "dairy" | "aromatic" | "herb" | "cheese" | "broth" | "oil" | "other";

function categorizeIngredient(label: string): IngredientCategory {
  const n = label.toLowerCase();
  if (n.includes("cream")) return "cream";
  if (n.includes("milk") || n.includes("yogurt") || n.includes("butter")) return "dairy";
  if (n.includes("onion") || n.includes("garlic") || n.includes("shallot") || n.includes("leek")) {
    return "aromatic";
  }
  if (n.includes("parsley") || n.includes("basil") || n.includes("cilantro") || n.includes("herb")) {
    return "herb";
  }
  if (n.includes("parmesan") || n.includes("cheese")) return "cheese";
  if (n.includes("broth") || n.includes("stock")) return "broth";
  if (n.includes("oil")) return "oil";
  return "other";
}

/**
 * Local quick-pick options shown as chips when the suggestion API is
 * unavailable. Category-based, not ingredient-specific.
 */
export function getFallbackSubstituteOptions(ingredientLabel: string): string[] {
  switch (categorizeIngredient(ingredientLabel)) {
    case "cream":
      return ["Greek yogurt", "Milk", "Coconut milk"];
    case "dairy":
      return ["Oat milk", "Coconut milk", "Greek yogurt"];
    case "aromatic":
      return ["Shallots", "Spring onions", "Leeks"];
    case "herb":
      return ["Dried herbs", "Fresh basil", "Chives"];
    case "cheese":
      return ["Nutritional yeast", "Pecorino", "Aged cheddar"];
    case "broth":
      return ["Bouillon cube + water", "Mushroom broth", "Water + soy sauce"];
    case "oil":
      return ["Butter", "Avocado oil", "Coconut oil"];
    default:
      return ["Something similar I have", "A pantry staple", "Skip it"];
  }
}

function buildLocalRecommendation(
  ingredient: Ingredient,
  userHas: string,
  forceFallback: boolean
): RecommendationResult {
  const benefits = ["Pantry-friendly", "Keeps the dish on track"];

  if (forceFallback) {
    return {
      substituteItem: `${userHas.trim() || "A guideline-safe alternative"}`,
      displayItem: userHas.trim() || "Guideline-safe alternative",
      recommendedUsage: ingredient.amount,
      ratio: `Use in the same amount as ${ingredient.label} where possible`,
      why: "Rule-based suggestion while AI is unavailable — keeps the recipe workable.",
      dietaryFit: "Review sodium and fat content of your substitute against the recipe goals.",
      recipeImpact: "Taste and texture may shift — adjust seasoning after swapping.",
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
    source: "fallback",
    benefits
  };
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
    stepOverride: recommendation.updatedStep,
    stepUpdates: recommendation.stepUpdates
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
    stepUpdates: result.stepUpdates,
    unavailableNotice: result.unavailableNotice
  };
}

type PreferenceContext = {
  dietaryGoals: string[];
  allergies: string[];
  cookingFor: string;
  pantryMode: PantryMode;
};

type SwapGenerationOptions = {
  exclude?: string[];
};

export async function runSwapGeneration(
  recipe: Recipe,
  ingredientId: string,
  userHas: string,
  forceFallback: boolean,
  preferences: PreferenceContext,
  options?: SwapGenerationOptions
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
    const payload = buildSubstituteApiRequest(recipe, ingredient, userHas, preferences, options?.exclude);
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
