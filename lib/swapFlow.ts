import type { Ingredient, PendingSuggestion, Recipe, SubstitutionRecord } from "@/types/recipe";
import type { UserPreferences } from "@/features/preferences/data/preferenceOptions";
import {
  CREAM_STEP_GREEK_YOGURT_MILK,
  CREAM_STEP_INDEX,
  CREAM_STEP_YOGURT,
  homemadeRecipe
} from "@/features/recipe/data/homemadeRecipe";

export function findIngredientById(recipe: Recipe, id: string): Ingredient | undefined {
  return recipe.ingredients.find((item) => item.id === id);
}

export function findIngredientIdByLabel(recipe: Recipe, label: string): string | null {
  const match = recipe.ingredients.find((item) => item.label === label);
  return match ? match.id : null;
}

export function resolveIngredientIdFromText(recipe: Recipe, text: string): string | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;

  if (t.includes("heavy cream")) return findIngredientIdByLabel(recipe, "heavy cream");
  if (t.includes("salt")) return findIngredientIdByLabel(recipe, "salt");
  if (t.includes("lower sodium") || t.includes("low sodium")) {
    return findIngredientIdByLabel(recipe, "salt");
  }

  if (t.includes("swap") || t.includes("replace") || t.includes("don't have") || t.includes("do not have")) {
    for (const ingredient of recipe.ingredients) {
      if (t.includes(ingredient.label.toLowerCase())) {
        return ingredient.id;
      }
    }
  }

  for (const ingredient of recipe.ingredients) {
    if (t === ingredient.label.toLowerCase()) {
      return ingredient.id;
    }
  }

  return null;
}

export function userMessageFor(ingredient: Ingredient) {
  return `I don't have ${ingredient.label}.`;
}

export function iconKeyForLabel(label: string, fallback: Ingredient["icon"]): Ingredient["icon"] {
  const n = label.toLowerCase();
  if (n.includes("tomato")) return "tomato";
  if (n.includes("yogurt")) return "yogurt";
  if (n.includes("cream") || n.includes("milk")) return "milk";
  if (n.includes("onion") || n.includes("shallot")) return "onion";
  if (n.includes("garlic")) return "garlic";
  if (n.includes("broth")) return "broth";
  if (n.includes("oil")) return "oil";
  if (n.includes("salt")) return "salt";
  if (n.includes("pepper")) return "pepper";
  if (n.includes("herb")) return "herb";
  return fallback;
}

export function getDisplayStep(
  step: string,
  index: number,
  ingredientId: string,
  appliedSubstitutions: Record<string, SubstitutionRecord>
): string {
  if (index !== CREAM_STEP_INDEX || !appliedSubstitutions[ingredientId]) {
    return step;
  }

  const sub = appliedSubstitutions[homemadeRecipe.substitutionIngredientId];
  if (!sub) return step;

  if (sub.stepOverride) {
    return sub.stepOverride;
  }

  if (sub.currentItem.toLowerCase().includes("yogurt") && sub.currentItem.toLowerCase().includes("milk")) {
    return CREAM_STEP_GREEK_YOGURT_MILK;
  }

  if (sub.currentItem.toLowerCase().includes("yogurt")) {
    return CREAM_STEP_YOGURT;
  }

  return `Remove from heat, stir in ${sub.currentItem.toLowerCase()}, then warm gently without boiling.`;
}

export function buildPromptPreview(
  recipe: Recipe,
  ingredientLabel: string,
  userHas: string,
  preferences: UserPreferences
) {
  return {
    recipe: recipe.title,
    ingredient_to_replace: ingredientLabel,
    user_has: userHas,
    dietary_needs: preferences.dietaryGoals,
    avoid: preferences.allergies,
    cooking_for: preferences.cookingFor,
    pantry_mode: preferences.pantryMode,
    request: "Suggest a safe recipe substitution and update impacted steps"
  };
}

export function getProgressLabels(
  recipeTitle: string,
  context: "recipe" | "conversation",
  targetRecipeTitle?: string | null
): string[] {
  if (context === "conversation" && targetRecipeTitle) {
    return [
    `Reading ${targetRecipeTitle}`,
    "Checking low-fat + low-sodium guidelines",
    "Matching your available substitute"
  ];
  }

  return ["Reading recipe", "Checking dietary needs", "Matching your available substitute"];
}

export function buildSubstitutionRecord(
  ingredient: Ingredient,
  pending: PendingSuggestion
): PendingSuggestion & { record: import("@/types/recipe").SubstitutionRecord } {
  return {
    ...pending,
    record: {
      id: ingredient.id,
      originalItem: ingredient.label,
      currentItem: pending.substituteItem,
      originalAmount: ingredient.amount,
      currentAmount: ingredient.amount,
      substituted: true,
      reason: pending.why,
      ratio: pending.ratio,
      source: pending.source
    }
  };
}
