export type DietaryBadge = "Low-fat" | "Low-sodium" | "High Protein" | "Gluten Free" | "Vegetarian";

export type DietType = "vegetarian" | "non-vegetarian" | "vegan";

export type IngredientIcon =
  | "tomato"
  | "milk"
  | "onion"
  | "garlic"
  | "broth"
  | "oil"
  | "salt"
  | "pepper"
  | "yogurt"
  | "herb";

export type Ingredient = {
  id: string;
  amount: string;
  label: string;
  icon: IngredientIcon;
  originalLabel?: string;
  swappable?: boolean;
};

export type SubstitutionRecord = {
  id: string;
  originalItem: string;
  currentItem: string;
  originalAmount: string;
  currentAmount: string;
  substituted: true;
  reason: string;
  ratio: string;
  source: "ai" | "fallback";
  stepOverride?: string;
};

export type NutritionMacro = {
  label: string;
  value: string;
};

export type SubstitutionOption = {
  id: string;
  replacement: string;
  amount: string;
  whyItWorks: string;
  dietaryFit: string;
  recipeImpact: string;
  confidence: "High" | "Medium" | "Low";
};

export type Recipe = {
  id: string;
  title: string;
  subtitle: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  dietaryBadges: DietaryBadge[];
  safetyNotes: string[];
  ingredients: Ingredient[];
  steps: string[];
  substitutionIngredientId: string;
  substitutionStepIndex: number;
  substitutionStepOriginal: string;
  substitutionOptions: SubstitutionOption[];
  nutrition: {
    perServing: boolean;
    macros: NutritionMacro[];
  };
};

export type PendingSuggestion = {
  ingredientId: string;
  originalItem: string;
  originalAmount: string;
  userHas: string;
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

export type ArchieChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export type AssistantContext = "recipe" | "conversation";

export type AssistantPhase =
  | "idle"
  | "pick_recipe"
  | "pick_ingredient"
  | "awaiting_substitute"
  | "loading"
  | "suggestion"
  | "applied";

export type ApplyPhase = "loading" | "success" | null;

export type TabName = "home" | "recipes" | "archie" | "profile";

export type RecipesView = "list" | "detail";

export type RecipeCatalogItem = {
  id: string;
  title: string;
  servings: number;
  guidelines: string[];
  available: boolean;
};

export const UNKNOWN_INGREDIENT_MSG =
  "I can help with ingredients from Creamy Tomato Soup. Try heavy cream, salt, onion, vegetable broth, or garlic.";
