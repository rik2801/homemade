import type {
  ArchieStepUpdate,
  Ingredient,
  PendingSuggestion,
  Recipe,
  SubstitutionRecord
} from "@/types/recipe";
import type { UserPreferences } from "@/features/preferences/data/preferenceOptions";

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

  const isSubstitutionQuestion =
    /\b(will this|would this|can this|could this|is this|good for|work as|replacement for|substitute for|instead of|addition to|add to)\b/i.test(
      text
    );
  if (isSubstitutionQuestion) return null;

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

function isValidStepUpdate(update: ArchieStepUpdate, stepCount: number): boolean {
  return (
    Number.isInteger(update.stepIndex) &&
    update.stepIndex >= 0 &&
    update.stepIndex < stepCount &&
    update.text.trim().length > 0
  );
}

/**
 * Builds the stepIndex → text override map for an accepted suggestion.
 * Prefers structured stepUpdates from the AI; falls back to locating the
 * legacy single updatedStep next to the original ingredient mention.
 */
export function resolveStepOverrides(
  recipe: Recipe,
  ingredient: Ingredient,
  suggestion: PendingSuggestion
): Record<number, string> | undefined {
  const overrides: Record<number, string> = {};

  if (suggestion.stepUpdates?.length) {
    for (const update of suggestion.stepUpdates) {
      if (isValidStepUpdate(update, recipe.steps.length)) {
        overrides[update.stepIndex] = update.text.trim();
      }
    }
  } else if (suggestion.stepOverride) {
    const label = ingredient.label.toLowerCase();
    const index = recipe.steps.findIndex((step) => step.toLowerCase().includes(label));
    if (index >= 0) {
      overrides[index] = suggestion.stepOverride;
    }
  }

  return Object.keys(overrides).length > 0 ? overrides : undefined;
}

/**
 * Maps recipe steps through every applied substitution's stepOverrides.
 * When two substitutions touch the same step, the last-applied one wins
 * (object insertion order of the substitution map).
 */
export function applyStepOverrides(
  recipe: Recipe,
  appliedSubstitutions: Record<string, SubstitutionRecord>
): string[] {
  return recipe.steps.map((step, index) => {
    let result = step;
    for (const record of Object.values(appliedSubstitutions)) {
      const override = record.stepOverrides?.[index];
      if (override) {
        result = override;
      }
    }
    return result;
  });
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
      "Checking your dietary preferences",
      "Matching your available substitute"
    ];
  }

  return ["Reading recipe", "Checking dietary needs", "Matching your available substitute"];
}
