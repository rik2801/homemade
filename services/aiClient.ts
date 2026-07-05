import type { PantryMode } from "@/features/preferences/data/preferenceOptions";
import type { Ingredient, Recipe } from "@/types/recipe";

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
    updatedStep?: string;
    benefits: string[];
  };
};

export type ChatApiRequest = {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  recipe: {
    id: string;
    title: string;
    ingredients: Array<{ id?: string; amount: string; label: string }>;
    steps: string[];
  };
  dietaryGoals: string[];
  allergies: string[];
  cookingFor: string;
  pantryMode: PantryMode;
};

export type ChatApiResponse = {
  source: "ai" | "fallback" | "declined";
  reply: string;
  inScope: boolean;
};

function getApiBaseUrl() {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured");
  }
  return baseUrl.replace(/\/$/, "");
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
  }
): SubstituteApiRequest {
  return {
    recipe: {
      id: recipe.id,
      title: recipe.title,
      ingredients: recipe.ingredients.map((item) => ({
        id: item.id,
        amount: item.amount,
        label: item.label
      })),
      steps: recipe.steps
    },
    ingredientToReplace: {
      name: ingredient.label,
      amount: ingredient.amount
    },
    userHas,
    dietaryGoals: preferences.dietaryGoals,
    allergies: preferences.allergies,
    cookingFor: preferences.cookingFor,
    pantryMode: preferences.pantryMode
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
