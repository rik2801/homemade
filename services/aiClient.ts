import type { PantryMode } from "@/features/preferences/data/preferenceOptions";
import type { ArchieStepUpdate, Ingredient, Recipe } from "@/types/recipe";

export type SubstituteApiRequest = {
  recipe: {
    id: string;
    title: string;
    ingredients: Array<{ id?: string; amount: string; label: string }>;
    steps: string[];
  };
  ingredientToReplace: {
    name: string;
    amount: string;
  };
  userHas: string;
  dietaryGoals: string[];
  allergies: string[];
  cookingFor: string;
  pantryMode: PantryMode;
  exclude?: string[];
};

export type SubstituteApiResponse = {
  source: "ai" | "fallback";
  original: {
    name: string;
    amount: string;
  };
  userHas: string;
  recommendation: {
    name: string;
    amount: string;
    whyThisWorks: string;
    dietaryFit: string;
    recipeImpact: string;
    confidence: "High" | "Medium" | "Low";
    /** @deprecated Use stepUpdates */
    updatedStep?: string;
    stepUpdates?: ArchieStepUpdate[];
    benefits: string[];
  };
};

export type SuggestSubstitutesApiRequest = {
  recipe: {
    id: string;
    title: string;
    ingredients: Array<{ id?: string; amount: string; label: string }>;
    steps: string[];
  };
  ingredientToReplace: {
    name: string;
    amount: string;
  };
  dietaryGoals: string[];
  allergies: string[];
  cookingFor: string;
};

export type SuggestSubstitutesApiResponse = {
  source: "ai" | "fallback";
  suggestions: Array<{ label: string; shortReason: string }>;
};

export type ChatApiRequest = {
  message: string;
  imageDataUrl?: string;
  imageFilename?: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  recipe?: {
    id: string;
    title: string;
    ingredients: Array<{ id?: string; amount: string; label: string }>;
    steps: string[];
  };
  /** Must be true when recipe is present; backend ignores recipe otherwise. */
  recipeExplicitlyAttached?: boolean;
  dietaryGoals: string[];
  allergies: string[];
  cookingFor: string;
  pantryMode: PantryMode;
};

export type ChatImageRecommendation = {
  verdict: string;
  detectedIngredient: string;
  howToUse: string;
  dietaryFit: string;
  watchOut: string;
  recipeStepUpdate: string;
};

export type ChatApiResponse = {
  source: "ai" | "fallback" | "declined" | "demo";
  reply: string;
  inScope: boolean;
  recommendation?: ChatImageRecommendation;
};

function getApiBaseUrl() {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured");
  }
  return baseUrl.replace(/\/$/, "");
}

function serializeRecipe(recipe: Recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    ingredients: recipe.ingredients.map((item) => ({
      id: item.id,
      amount: item.amount,
      label: item.label
    })),
    steps: recipe.steps
  };
}

export function buildSubstituteApiRequest(
  recipe: Recipe,
  ingredient: Ingredient,
  userHas: string,
  preferences: {
    dietaryGoals: string[];
    allergies: string[];
    cookingFor: string;
    pantryMode: PantryMode;
  },
  exclude?: string[]
): SubstituteApiRequest {
  return {
    recipe: serializeRecipe(recipe),
    ingredientToReplace: {
      name: ingredient.label,
      amount: ingredient.amount
    },
    userHas,
    dietaryGoals: preferences.dietaryGoals,
    allergies: preferences.allergies,
    cookingFor: preferences.cookingFor,
    pantryMode: preferences.pantryMode,
    ...(exclude?.length ? { exclude } : {})
  };
}

export async function requestIngredientSubstitution(
  payload: SubstituteApiRequest
): Promise<SubstituteApiResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/ai/substitute`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Substitution API failed (${response.status})`);
  }

  return response.json() as Promise<SubstituteApiResponse>;
}

export async function requestSubstituteSuggestions(
  recipe: Recipe,
  ingredient: Ingredient,
  preferences: {
    dietaryGoals: string[];
    allergies: string[];
    cookingFor: string;
  }
): Promise<SuggestSubstitutesApiResponse> {
  const payload: SuggestSubstitutesApiRequest = {
    recipe: serializeRecipe(recipe),
    ingredientToReplace: {
      name: ingredient.label,
      amount: ingredient.amount
    },
    dietaryGoals: preferences.dietaryGoals,
    allergies: preferences.allergies,
    cookingFor: preferences.cookingFor
  };

  const response = await fetch(`${getApiBaseUrl()}/api/ai/suggest-substitutes`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Suggest substitutes API failed (${response.status})`);
  }

  return response.json() as Promise<SuggestSubstitutesApiResponse>;
}

export async function requestArchieChat(payload: ChatApiRequest): Promise<ChatApiResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/ai/chat`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Chat API failed (${response.status})`);
  }

  return response.json() as Promise<ChatApiResponse>;
}
