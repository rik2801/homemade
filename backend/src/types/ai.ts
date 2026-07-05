export type SubstituteIngredientInput = {
  name: string;
  amount: string;
};

export type SubstituteRecipeInput = {
  id: string;
  title: string;
  ingredients: Array<{ id?: string; amount: string; label: string }>;
  steps: string[];
};

export type SubstituteRequest = {
  recipe: SubstituteRecipeInput;
  ingredientToReplace: SubstituteIngredientInput;
  userHas: string;
  dietaryGoals: string[];
  allergies: string[];
  cookingFor: string;
  pantryMode: "ask" | "remember";
};

export type SubstituteRecommendation = {
  name: string;
  amount: string;
  whyThisWorks: string;
  dietaryFit: string;
  recipeImpact: string;
  confidence: "High" | "Medium" | "Low";
  updatedStep?: string;
  benefits: string[];
};

export type SubstituteResponse = {
  source: "ai" | "fallback";
  original: SubstituteIngredientInput;
  userHas: string;
  recommendation: SubstituteRecommendation;
};

export type ChatRequest = {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  recipe: SubstituteRecipeInput;
  dietaryGoals: string[];
  allergies: string[];
  cookingFor: string;
  pantryMode?: "ask" | "remember";
};

export type ChatResponse = {
  source: "ai" | "fallback" | "declined";
  reply: string;
  inScope: boolean;
};
