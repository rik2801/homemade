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
import { appendChatMessages, ARCHIE_PROMPTS } from "@/lib/archieChat";
import { getAlternateSuggestion } from "@/services/assistantService";
import { requestArchieChat } from "@/services/aiClient";
import type {
  ArchieChatMessage,
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
  chatMessages: ArchieChatMessage[];
  userMessage: string;
  unknownHint: string | null;
  assistantReply: string | null;
  chatLoading: boolean;
  chatRequestId: number;
  recipeConfirmation: string;
  ingredientConfirmation: string;
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
  startSwapIntent: (message?: string) => void;
  selectRecipeForSwap: (recipeId: string) => void;
  selectIngredientForConversation: (ingredientId: string) => void;
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
  chatMessages: [],
  userMessage: "",
  unknownHint: null,
  assistantReply: null,
  chatLoading: false,
  chatRequestId: 0,
  recipeConfirmation: "",
  ingredientConfirmation: "",
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

  exitArchie: () =>
    set({
      activeTab: get().returnTab,
      archieComposerDraft: ""
    }),

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

  startSwapIntent: (message = "Swap an ingredient") => {
    const currentTab = get().activeTab;

    set((state) => ({
      ...resetSwapConversation(),
      chatMessages: appendChatMessages(
        state.chatMessages,
        { role: "user", text: message },
        { role: "assistant", text: ARCHIE_PROMPTS.pickRecipe }
      ),
      userMessage: message,
      unknownHint: null,
      assistantReply: null,
      chatLoading: false,
      recipeConfirmation: "",
      ingredientConfirmation: "",
      selectedIngredientId: null,
      targetRecipeId: null,
      lastApplied: null,
      assistantContext: "conversation",
      assistantPhase: "pick_recipe",
      activeTab: "archie",
      returnTab: currentTab !== "archie" ? currentTab : get().returnTab
    }));
  },

  startSwap: (ingredientId, fromRecipe = false) => {
    if (get().assistantPhase === "loading") return;

    const { recipe } = get();
    if (!isSwapDemoRecipe(recipe.id)) return;

    const ingredient = findIngredientById(recipe, ingredientId);
    if (!ingredient || get().hasSubstitution(ingredientId)) return;

    const currentTab = get().activeTab;
    const swapUserMessage = userMessageFor(ingredient);
    const base = {
      selectedIngredientId: ingredientId,
      ...resetSwapConversation(),
      unknownHint: null,
      assistantReply: null,
      chatLoading: false,
      recipeConfirmation: "",
      ingredientConfirmation: "",
      lastApplied: null,
      assistantContext: fromRecipe ? ("recipe" as AssistantContext) : ("conversation" as AssistantContext),
      activeTab: "archie" as TabName,
      returnTab: currentTab !== "archie" ? currentTab : get().returnTab
    };

    if (fromRecipe) {
      set((state) => ({
        ...base,
        chatMessages: appendChatMessages(
          state.chatMessages,
          { role: "user", text: swapUserMessage },
          { role: "assistant", text: ARCHIE_PROMPTS.pickSubstitute }
        ),
        userMessage: swapUserMessage,
        targetRecipeId: recipe.id,
        assistantPhase: "awaiting_substitute"
      }));
      return;
    }

    set((state) => ({
      ...base,
      chatMessages: appendChatMessages(
        state.chatMessages,
        { role: "user", text: swapUserMessage },
        { role: "assistant", text: ARCHIE_PROMPTS.pickRecipe }
      ),
      userMessage: swapUserMessage,
      targetRecipeId: null,
      assistantPhase: "pick_recipe"
    }));
  },

  selectRecipeForSwap: (recipeId) => {
    const recipe = getRecipeById(recipeId);
    if (!recipe) return;

    const selectedIngredientId = get().selectedIngredientId;
    const appliedSubstitutions = isSwapDemoRecipe(recipeId) ? get().appliedSubstitutions : {};

    if (!selectedIngredientId) {
      set((state) => ({
        ...loadRecipeState(recipe, appliedSubstitutions),
        chatMessages: appendChatMessages(
          state.chatMessages,
          { role: "user", text: recipe.title },
          { role: "assistant", text: ARCHIE_PROMPTS.pickIngredient }
        ),
        targetRecipeId: recipeId,
        recipeConfirmation: recipe.title,
        ingredientConfirmation: "",
        assistantPhase: "pick_ingredient",
        ...resetSwapConversation()
      }));
      return;
    }

    set((state) => ({
      ...loadRecipeState(recipe, appliedSubstitutions),
      chatMessages: appendChatMessages(
        state.chatMessages,
        { role: "user", text: recipe.title },
        { role: "assistant", text: ARCHIE_PROMPTS.pickSubstitute }
      ),
      targetRecipeId: recipeId,
      recipeConfirmation: recipe.title,
      ingredientConfirmation: "",
      assistantPhase: "awaiting_substitute",
      ...resetSwapConversation()
    }));
  },

  selectIngredientForConversation: (ingredientId) => {
    const { recipe } = get();
    const ingredient = findIngredientById(recipe, ingredientId);
    if (!ingredient || get().hasSubstitution(ingredientId)) return;

    set((state) => ({
      selectedIngredientId: ingredientId,
      chatMessages: appendChatMessages(
        state.chatMessages,
        { role: "user", text: ingredient.label },
        { role: "assistant", text: ARCHIE_PROMPTS.pickSubstitute }
      ),
      ingredientConfirmation: ingredient.label,
      assistantPhase: "awaiting_substitute",
      ...resetSwapConversation()
    }));
  },

  selectUserSubstitute: (userHas) => {
    const trimmed = userHas.trim();
    if (!trimmed || !get().selectedIngredientId) return;

    set((state) => ({
      chatMessages: appendChatMessages(state.chatMessages, { role: "user", text: trimmed }),
      userHasSubstitute: trimmed,
      userSubstituteReply: trimmed,
      assistantPhase: "loading",
      pendingSuggestion: null,
      progressStep: 0
    }));
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
        ingredientConfirmation: "",
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
      recipeConfirmation: "",
      ingredientConfirmation: ""
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
        allergies: get().allergies,
        cookingFor: get().cookingFor,
        pantryMode: get().pantryMode
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

    if (phase === "loading" || phase === "pick_recipe" || phase === "pick_ingredient") return;
    if (get().chatLoading) return;

    const normalized = text.toLowerCase();
    const isSwapIntent =
      normalized === "swap an ingredient" ||
      normalized === "swap ingredient" ||
      normalized.includes("swap an ingredient") ||
      normalized.includes("replace an ingredient");

    if (isSwapIntent) {
      get().startSwapIntent(text);
      return;
    }

    const { recipe, chatMessages } = get();
    const ingredientId = resolveIngredientIdFromText(recipe, text);
    if (!ingredientId) {
      const requestId = get().chatRequestId + 1;
      const nextMessages = appendChatMessages(chatMessages, { role: "user", text });

      set({
        chatMessages: nextMessages,
        userMessage: text,
        unknownHint: null,
        assistantReply: null,
        chatLoading: true,
        chatRequestId: requestId,
        assistantPhase: "idle"
      });

      void requestArchieChat({
        message: text,
        history: nextMessages.slice(0, -1).map((item) => ({
          role: item.role,
          content: item.text
        })),
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
        dietaryGoals: get().dietaryGoals,
        allergies: get().allergies,
        cookingFor: get().cookingFor,
        pantryMode: get().pantryMode
      })
        .then((response) => {
          if (get().chatRequestId !== requestId) return;
          set((state) => ({
            chatLoading: false,
            assistantReply: null,
            chatMessages: appendChatMessages(state.chatMessages, {
              role: "assistant",
              text: response.reply
            })
          }));
        })
        .catch(() => {
          if (get().chatRequestId !== requestId) return;
          set((state) => ({
            chatLoading: false,
            assistantReply: null,
            chatMessages: appendChatMessages(state.chatMessages, {
              role: "assistant",
              text: UNKNOWN_INGREDIENT_MSG
            })
          }));
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
