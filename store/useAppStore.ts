import { create } from "zustand";
import {
  getRecipeById,
  homemadeRecipe,
  isSwapDemoRecipe
} from "@/features/recipe/data/homemadeRecipe";
import type { Recipe } from "@/types/recipe";
import {
  DEFAULT_PREFERENCES,
  type PantryMode,
  type UserPreferences
} from "@/features/preferences/data/preferenceOptions";
import { findIngredientById, getDisplayStep, resolveIngredientIdFromText, userMessageFor } from "@/lib/swapFlow";
import { getAlternateSuggestion } from "@/services/assistantService";
import type {
  ApplyPhase,
  AssistantContext,
  AssistantPhase,
  PendingSuggestion,
  SubstitutionRecord,
  TabName,
  RecipesView
} from "@/types/recipe";
import { UNKNOWN_INGREDIENT_MSG } from "@/types/recipe";

export type ProfileSheetMode = "cookingFor" | "dietaryGoals" | "allergies" | "pantryMode" | null;

type LastApplied = {
  ingredientId: string;
  originalItem: string;
  currentItem: string;
};

type AppState = {
  recipe: Recipe;
  selectedRecipeId: string;
  recipesView: RecipesView;
  baseSteps: string[];
  displaySteps: string[];
  activeTab: TabName;
  returnTab: TabName;
  selectedIngredientId: string | null;
  userHasSubstitute: string | null;
  userSubstituteReply: string | null;
  composerFocusToken: number;
  archieComposerDraft: string;
  appliedSubstitutions: Record<string, SubstitutionRecord>;
  fallbackMode: boolean;
  swapSheetVisible: boolean;
  archSheetVisible: boolean;
  assistantContext: AssistantContext;
  assistantPhase: AssistantPhase;
  userMessage: string;
  unknownHint: string | null;
  recipeConfirmation: string;
  targetRecipeId: string | null;
  pendingSuggestion: PendingSuggestion | null;
  progressStep: number;
  applyPhase: ApplyPhase;
  lastApplied: LastApplied | null;
  justAppliedId: string | null;
  toastMessage: string | null;
  onboardingCompleted: boolean;
  cookingFor: string;
  dietaryGoals: string[];
  allergies: string[];
  pantryMode: PantryMode;
  profileSheetMode: ProfileSheetMode;
  profileSheetVisible: boolean;
  setActiveTab: (tab: TabName) => void;
  exitArchie: () => void;
  openRecipe: (recipeId: string, options?: { showDetail?: boolean }) => void;
  setRecipesView: (view: RecipesView) => void;
  goToTodaysRecipe: () => void;
  goToArchie: () => void;
  openSwapSheet: () => void;
  closeSwapSheet: () => void;
  openArchSheet: () => void;
  closeArchSheet: () => void;
  toggleFallbackMode: () => void;
  selectIngredientForSwap: (ingredientId: string) => void;
  startSwap: (ingredientId: string, fromRecipe?: boolean) => void;
  selectRecipeForSwap: (recipeId: string) => void;
  selectUserSubstitute: (userHas: string) => void;
  requestComposerFocus: () => void;
  setArchieComposerDraft: (text: string) => void;
  setAssistantPhase: (phase: AssistantPhase) => void;
  setProgressStep: (step: number) => void;
  setPendingSuggestion: (suggestion: PendingSuggestion | null) => void;
  cancelSuggestion: () => void;
  applySuggestion: () => void;
  requestAnotherOption: () => void;
  submitAssistantInput: (text: string) => void;
  clearToast: () => void;
  hasSubstitution: (ingredientId: string) => boolean;
  refreshDisplaySteps: () => void;
  completeOnboarding: (preferences: UserPreferences) => void;
  skipOnboardingWithDefaults: () => void;
  setCookingFor: (value: string) => void;
  setDietaryGoals: (values: string[]) => void;
  setAllergies: (values: string[]) => void;
  setPantryMode: (mode: PantryMode) => void;
  openProfileSheet: (mode: Exclude<ProfileSheetMode, null>) => void;
  closeProfileSheet: () => void;
};

function buildDisplaySteps(recipe: Recipe, appliedSubstitutions: Record<string, SubstitutionRecord>) {
  return recipe.steps.map((step, index) =>
    getDisplayStep(step, index, recipe.substitutionIngredientId, appliedSubstitutions)
  );
}

function loadRecipeState(recipe: Recipe, appliedSubstitutions: Record<string, SubstitutionRecord>) {
  return {
    recipe,
    selectedRecipeId: recipe.id,
    baseSteps: [...recipe.steps],
    displaySteps: buildDisplaySteps(recipe, appliedSubstitutions)
  };
}

function resetSwapConversation() {
  return {
    userHasSubstitute: null,
    userSubstituteReply: null,
    pendingSuggestion: null,
    progressStep: 0,
    applyPhase: null as ApplyPhase
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  recipe: homemadeRecipe,
  selectedRecipeId: homemadeRecipe.id,
  recipesView: "list",
  baseSteps: homemadeRecipe.steps,
  displaySteps: homemadeRecipe.steps,
  activeTab: "home",
  returnTab: "home",
  selectedIngredientId: null,
  userHasSubstitute: null,
  userSubstituteReply: null,
  composerFocusToken: 0,
  archieComposerDraft: "",
  appliedSubstitutions: {},
  fallbackMode: false,
  swapSheetVisible: false,
  archSheetVisible: false,
  assistantContext: "conversation",
  assistantPhase: "idle",
  userMessage: "",
  unknownHint: null,
  recipeConfirmation: "",
  targetRecipeId: null,
  pendingSuggestion: null,
  progressStep: 0,
  applyPhase: null,
  lastApplied: null,
  justAppliedId: null,
  toastMessage: null,
  onboardingCompleted: false,
  cookingFor: DEFAULT_PREFERENCES.cookingFor,
  dietaryGoals: [...DEFAULT_PREFERENCES.dietaryGoals],
  allergies: [...DEFAULT_PREFERENCES.allergies],
  pantryMode: DEFAULT_PREFERENCES.pantryMode,
  profileSheetMode: null,
  profileSheetVisible: false,

  setActiveTab: (tab) => {
    const current = get().activeTab;
    set({
      activeTab: tab,
      returnTab: tab === "archie" && current !== "archie" ? current : get().returnTab,
      recipesView: tab === "recipes" ? "list" : get().recipesView
    });
  },

  exitArchie: () => set({ activeTab: get().returnTab, archieComposerDraft: "" }),

  openRecipe: (recipeId, options) => {
    const recipe = getRecipeById(recipeId);
    if (!recipe) return;

    const appliedSubstitutions = isSwapDemoRecipe(recipeId) ? get().appliedSubstitutions : {};

    set({
      ...loadRecipeState(recipe, appliedSubstitutions),
      recipesView: options?.showDetail ? "detail" : get().recipesView,
      activeTab: "recipes"
    });
  },

  setRecipesView: (view) => set({ recipesView: view }),

  goToTodaysRecipe: () => get().openRecipe(homemadeRecipe.id, { showDetail: true }),

  goToArchie: () => get().setActiveTab("archie"),

  openSwapSheet: () => {
    if (get().assistantPhase === "loading") return;
    set({ swapSheetVisible: true });
  },

  closeSwapSheet: () => set({ swapSheetVisible: false }),

  openArchSheet: () => set({ archSheetVisible: true }),
  closeArchSheet: () => set({ archSheetVisible: false }),

  toggleFallbackMode: () => set((state) => ({ fallbackMode: !state.fallbackMode })),

  hasSubstitution: (ingredientId) => Boolean(get().appliedSubstitutions[ingredientId]),

  refreshDisplaySteps: () =>
    set((state) => ({
      displaySteps: buildDisplaySteps(state.recipe, state.appliedSubstitutions)
    })),

  selectIngredientForSwap: (ingredientId) => {
    get().closeSwapSheet();
    get().startSwap(ingredientId, true);
  },

  startSwap: (ingredientId, fromRecipe = false) => {
    if (get().assistantPhase === "loading") return;

    const { recipe } = get();
    if (!isSwapDemoRecipe(recipe.id)) return;

    const ingredient = findIngredientById(recipe, ingredientId);
    if (!ingredient || get().hasSubstitution(ingredientId)) return;

    const currentTab = get().activeTab;
    const base = {
      selectedIngredientId: ingredientId,
      ...resetSwapConversation(),
      userMessage: userMessageFor(ingredient),
      unknownHint: null,
      recipeConfirmation: "",
      lastApplied: null,
      assistantContext: fromRecipe ? ("recipe" as AssistantContext) : ("conversation" as AssistantContext),
      activeTab: "archie" as TabName,
      returnTab: currentTab !== "archie" ? currentTab : get().returnTab
    };

    if (fromRecipe) {
      set({
        ...base,
        targetRecipeId: recipe.id,
        assistantPhase: "awaiting_substitute"
      });
      return;
    }

    set({
      ...base,
      targetRecipeId: null,
      assistantPhase: "pick_recipe"
    });
  },

  selectRecipeForSwap: (recipeId) => {
    const recipe = getRecipeById(recipeId);
    if (!recipe || !get().selectedIngredientId) return;

    set({
      ...loadRecipeState(recipe, isSwapDemoRecipe(recipeId) ? get().appliedSubstitutions : {}),
      targetRecipeId: recipeId,
      recipeConfirmation: `Use ${recipe.title}.`,
      assistantPhase: "awaiting_substitute",
      ...resetSwapConversation()
    });
  },

  selectUserSubstitute: (userHas) => {
    const trimmed = userHas.trim();
    if (!trimmed || !get().selectedIngredientId) return;

    set({
      userHasSubstitute: trimmed,
      userSubstituteReply: trimmed,
      assistantPhase: "loading",
      pendingSuggestion: null,
      progressStep: 0
    });
  },

  requestComposerFocus: () =>
    set((state) => ({
      composerFocusToken: state.composerFocusToken + 1
    })),

  setArchieComposerDraft: (text) => set({ archieComposerDraft: text }),

  setAssistantPhase: (phase) => set({ assistantPhase: phase }),
  setProgressStep: (step) => set({ progressStep: step }),
  setPendingSuggestion: (suggestion) => set({ pendingSuggestion: suggestion }),

  cancelSuggestion: () => {
    const wasRecipeFlow = get().assistantContext === "recipe";

    if (wasRecipeFlow) {
      set({
        ...resetSwapConversation(),
        assistantPhase: "idle",
        userMessage: "",
        recipeConfirmation: "",
        targetRecipeId: null,
        assistantContext: "conversation",
        selectedIngredientId: null,
        activeTab: "recipes"
      });
      return;
    }

    set({
      ...resetSwapConversation(),
      assistantPhase: "pick_recipe",
      targetRecipeId: null,
      recipeConfirmation: ""
    });
  },

  applySuggestion: () => {
    const { pendingSuggestion, selectedIngredientId, recipe } = get();
    if (!pendingSuggestion || !selectedIngredientId || get().applyPhase === "loading") return;

    const ingredient = findIngredientById(recipe, selectedIngredientId);
    if (!ingredient) return;

    set({ applyPhase: "loading" });

    setTimeout(() => {
      const record: SubstitutionRecord = {
        id: ingredient.id,
        originalItem: ingredient.label,
        currentItem: pendingSuggestion.displayItem,
        originalAmount: ingredient.amount,
        currentAmount: pendingSuggestion.recommendedUsage,
        substituted: true,
        reason: pendingSuggestion.why,
        ratio: pendingSuggestion.ratio,
        source: pendingSuggestion.source,
        stepOverride: pendingSuggestion.stepOverride
      };

      const appliedSubstitutions = {
        ...get().appliedSubstitutions,
        [ingredient.id]: record
      };

      set({
        appliedSubstitutions,
        displaySteps: buildDisplaySteps(recipe, appliedSubstitutions),
        lastApplied: {
          ingredientId: ingredient.id,
          originalItem: ingredient.label,
          currentItem: pendingSuggestion.displayItem
        },
        assistantPhase: "applied",
        applyPhase: "success",
        justAppliedId: ingredient.id,
        pendingSuggestion: null,
        selectedIngredientId: null,
        userHasSubstitute: null,
        userSubstituteReply: null,
        targetRecipeId: null,
        assistantContext: "conversation",
        toastMessage: "Recipe updated",
        activeTab: "recipes"
      });

      setTimeout(() => {
        set({ applyPhase: null, justAppliedId: null });
      }, 2000);

      setTimeout(() => {
        set({ toastMessage: null });
      }, 2000);
    }, 900 + Math.floor(Math.random() * 300));
  },

  requestAnotherOption: () => {
    const { pendingSuggestion, selectedIngredientId, userHasSubstitute } = get();
    if (!pendingSuggestion || !selectedIngredientId || !userHasSubstitute) return;

    const alt = getAlternateSuggestion(
      selectedIngredientId,
      userHasSubstitute,
      pendingSuggestion.displayItem,
      {
        dietaryGoals: get().dietaryGoals,
        allergies: get().allergies
      }
    );
    if (alt) {
      set({ pendingSuggestion: alt });
    }
  },

  submitAssistantInput: (rawText) => {
    const text = rawText.trim();
    if (!text) return;

    const phase = get().assistantPhase;

    if (phase === "awaiting_substitute") {
      get().selectUserSubstitute(text);
      return;
    }

    if (phase === "loading" || phase === "pick_recipe") return;

    const { recipe } = get();
    const ingredientId = resolveIngredientIdFromText(recipe, text);
    if (!ingredientId) {
      set({
        userMessage: text,
        unknownHint: UNKNOWN_INGREDIENT_MSG,
        assistantPhase: "idle",
        recipeConfirmation: "",
        pendingSuggestion: null,
        userHasSubstitute: null,
        userSubstituteReply: null
      });
      return;
    }

    get().startSwap(ingredientId, false);
  },

  clearToast: () => set({ toastMessage: null }),

  completeOnboarding: (preferences) =>
    set({
      ...preferences,
      onboardingCompleted: true,
      activeTab: "home"
    }),

  skipOnboardingWithDefaults: () =>
    set({
      ...DEFAULT_PREFERENCES,
      dietaryGoals: [...DEFAULT_PREFERENCES.dietaryGoals],
      allergies: [...DEFAULT_PREFERENCES.allergies],
      onboardingCompleted: true,
      activeTab: "home"
    }),

  setCookingFor: (value) => set({ cookingFor: value }),

  setDietaryGoals: (values) => set({ dietaryGoals: values }),

  setAllergies: (values) => set({ allergies: values }),

  setPantryMode: (mode) => set({ pantryMode: mode }),

  openProfileSheet: (mode) => set({ profileSheetMode: mode, profileSheetVisible: true }),

  closeProfileSheet: () => set({ profileSheetMode: null, profileSheetVisible: false })
}));

export const useRecipeStore = useAppStore;
