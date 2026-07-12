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

export type ArchieStepUpdate = {
  stepIndex: number;
  text: string;
  reason?: string;
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
  /** @deprecated Use stepOverrides */
  stepOverride?: string;
  stepOverrides?: Record<number, string>;
};

/** Applied substitutions keyed by recipe id, then ingredient id. */
export type AppliedSubstitutionsMap = Record<string, Record<string, SubstitutionRecord>>;

export type NutritionMacro = {
  label: string;
  value: string;
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
  /** @deprecated Use stepUpdates */
  stepOverride?: string;
  stepUpdates?: ArchieStepUpdate[];
  unavailableNotice?: boolean;
};

export type ArchieResponseTitle = "Archie's recommendation" | "Archie's answer" | "Archie's note";

export type ArchieStructuredResponse = {
  title: ArchieResponseTitle;
  summary: string;
  isImageResponse?: boolean;
  identified?: string;
  howToUse?: string;
  /** @deprecated Prefer preferenceFit for personalized nutrition */
  dietaryFit?: string;
  /** How the food aligns with the user's known dietary goals. */
  preferenceFit?: string;
  watchOut?: string;
  recipeUpdate?: string;
  whyThisWorks?: string;
  nutritionNote?: string;
  nextStep?: string;
};

export type ArchieImageRecommendation = {
  verdict: string;
  detectedIngredient: string;
  howToUse: string;
  dietaryFit: string;
  watchOut: string;
  recipeStepUpdate: string;
};

export type ArchieChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageUri?: string;
  /** @deprecated Use structuredResponse */
  recommendation?: ArchieImageRecommendation;
  structuredResponse?: ArchieStructuredResponse;
  /** When true, always render as a plain bubble — never remap into a structured card. */
  plainBubble?: boolean;
  /** Ties assistant replies to a single in-flight chat request. */
  requestId?: number;
};

export type ComposerSheetMode = "image-source" | "recipe-picker" | null;

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

export type ArchieSessionKind = "general" | "recipe_swap";

export type ArchieRecipeContextSource = "explicit_attach" | "recipe_entry";

export type ArchieLastApplied = {
  ingredientId: string;
  originalItem: string;
  currentItem: string;
};

export type ArchieSwapState = {
  selectedIngredientId: string | null;
  targetRecipeId: string | null;
  userHasSubstitute: string | null;
  userSubstituteReply: string | null;
  pendingSuggestion: PendingSuggestion | null;
  assistantPhase: AssistantPhase;
  assistantContext: AssistantContext;
  recipeConfirmation: string;
  ingredientConfirmation: string;
  lastApplied: ArchieLastApplied | null;
};

export type ArchieChatSession = {
  id: string;
  kind: ArchieSessionKind;
  title: string;
  recipeId?: string;
  /** Provenance for recipeId — required for general sessions to send recipe context. */
  recipeContextSource?: ArchieRecipeContextSource;
  ingredientId?: string;
  messages: ArchieChatMessage[];
  swapState: ArchieSwapState;
  createdAt: number;
  lastAccessedAt: number;
};

export const UNKNOWN_INGREDIENT_MSG =
  "I had trouble reaching Archie for that one. Check your connection and try again.";

export const ARCHIE_CHAT_ERROR_MSG =
  "I couldn't reach Archie right now. Check your connection and try again.";
