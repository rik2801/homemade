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
  /** Previously suggested substitutes the user rejected. */
  exclude?: string[];
};

export type StepUpdate = {
  /** 0-based index into recipe.steps. */
  stepIndex: number;
  text: string;
  reason?: string;
};

export type SubstituteRecommendation = {
  name: string;
  amount: string;
  whyThisWorks: string;
  dietaryFit: string;
  recipeImpact: string;
  confidence: "High" | "Medium" | "Low";
  /** @deprecated Use stepUpdates */
  updatedStep?: string;
  stepUpdates?: StepUpdate[];
  benefits: string[];
};

export type SuggestSubstitutesRequest = {
  recipe: SubstituteRecipeInput;
  ingredientToReplace: SubstituteIngredientInput;
  dietaryGoals: string[];
  allergies: string[];
  cookingFor: string;
};

export type SuggestSubstitutesResponse = {
  source: "ai" | "fallback";
  suggestions: Array<{ label: string; shortReason: string }>;
};

export type SubstituteResponse = {
  source: "ai" | "fallback";
  original: SubstituteIngredientInput;
  userHas: string;
  recommendation: SubstituteRecommendation;
};

export type ChatImageRecommendation = {
  verdict: string;
  detectedIngredient: string;
  howToUse: string;
  dietaryFit: string;
  watchOut: string;
  recipeStepUpdate: string;
};

export type ChatRequest = {
  message: string;
  imageDataUrl?: string;
  imageFilename?: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  recipe: SubstituteRecipeInput;
  dietaryGoals: string[];
  allergies: string[];
  cookingFor: string;
  pantryMode?: "ask" | "remember";
};

export type ChatResponse = {
  source: "ai" | "fallback" | "declined" | "demo";
  reply: string;
  inScope: boolean;
  recommendation?: ChatImageRecommendation;
};
