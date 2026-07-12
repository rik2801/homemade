import { create } from "zustand";
import { getRecipeById, homemadeRecipe } from "@/features/recipe/data/homemadeRecipe";
import type { Recipe } from "@/types/recipe";
import {
  DEFAULT_PREFERENCES,
  type PantryMode,
  type UserPreferences
} from "@/features/preferences/data/preferenceOptions";
import {
  applyStepOverrides,
  findIngredientById,
  resolveIngredientIdFromText,
  resolveStepOverrides,
  userMessageFor
} from "@/lib/swapFlow";
import { appendChatMessages, ARCHIE_PROMPTS } from "@/lib/archieChat";
import {
  createSessionId,
  loadPersistedSessions,
  MAX_SESSIONS,
  persistSessions,
  pickEvictionCandidate,
  pruneExpiredSessions
} from "@/lib/archieSessionStorage";
import {
  resolveExplicitArchieRecipeId,
  serializeArchieChatRecipe
} from "@/lib/archieChatContext";
import { canBeginArchieSend, shouldAppendAssistantForRequest } from "@/lib/archieSendGuard";
import {
  inferArchieIntentResult,
  messageNeedsRecipeContext
} from "@/lib/inferArchieIntent";
import {
  mapChatResponseToStructured,
  structuredResponseToHistoryText
} from "@/lib/mapArchieStructuredResponse";
import { stripUnnecessaryFollowUp } from "@/lib/archieAnswerFormatting";
import { readImageAsDataUrl } from "@/lib/chatImage";
import { runSwapGeneration } from "@/services/assistantService";
import { requestArchieChat } from "@/services/aiClient";
import type {
  AppliedSubstitutionsMap,
  ApplyPhase,
  ArchieChatMessage,
  ArchieChatSession,
  ArchieLastApplied,
  ArchieRecipeContextSource,
  ArchieSessionKind,
  ArchieSwapState,
  AssistantContext,
  AssistantPhase,
  ComposerSheetMode,
  PendingSuggestion,
  SubstitutionRecord,
  TabName,
  RecipesView
} from "@/types/recipe";
import { UNKNOWN_INGREDIENT_MSG, ARCHIE_CHAT_ERROR_MSG } from "@/types/recipe";

export type ProfileSheetMode = "cookingFor" | "dietaryGoals" | "allergies" | "pantryMode" | null;

const EMPTY_SUBSTITUTIONS: Record<string, SubstitutionRecord> = {};

const RESUMABLE_SWAP_PHASES: AssistantPhase[] = ["awaiting_substitute", "loading", "suggestion"];

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
  composerImageUri: string | null;
  composerActiveRecipeId: string | null;
  pendingComposerMessage: string | null;
  composerSheetMode: ComposerSheetMode;
  appliedSubstitutions: AppliedSubstitutionsMap;
  fallbackMode: boolean;
  swapSheetVisible: boolean;
  archSheetVisible: boolean;
  assistantContext: AssistantContext;
  assistantPhase: AssistantPhase;
  chatMessages: ArchieChatMessage[];
  archieSessions: ArchieChatSession[];
  activeSessionId: string | null;
  archieSidebarOpen: boolean;
  userMessage: string;
  unknownHint: string | null;
  assistantReply: string | null;
  chatLoading: boolean;
  chatRequestId: number;
  /** Non-null while a network Archie send is in flight (sync single-flight lock). */
  archieSendLockId: string | null;
  anotherOptionLoading: boolean;
  recipeConfirmation: string;
  ingredientConfirmation: string;
  targetRecipeId: string | null;
  pendingSuggestion: PendingSuggestion | null;
  progressStep: number;
  applyPhase: ApplyPhase;
  lastApplied: ArchieLastApplied | null;
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
  openArchieSidebar: () => void;
  closeArchieSidebar: () => void;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  toggleFallbackMode: () => void;
  selectIngredientForSwap: (ingredientId: string) => void;
  startSwap: (ingredientId: string, fromRecipe?: boolean) => void;
  startSwapIntent: (message?: string) => void;
  selectRecipeForSwap: (recipeId: string) => void;
  selectIngredientForConversation: (ingredientId: string) => void;
  selectUserSubstitute: (userHas: string) => void;
  requestComposerFocus: () => void;
  setArchieComposerDraft: (text: string) => void;
  openComposerImageSheet: () => void;
  openComposerRecipeSheet: () => void;
  closeComposerSheet: () => void;
  setComposerImage: (uri: string | null) => void;
  clearComposerAttachments: () => void;
  selectComposerRecipe: (recipeId: string) => void;
  clearComposerActiveRecipe: () => void;
  clearArchieRecipeContext: () => void;
  requestRecipeContext: (message: string) => void;
  submitComposerMessage: (text: string) => void;
  setAssistantPhase: (phase: AssistantPhase) => void;
  setProgressStep: (step: number) => void;
  setPendingSuggestion: (suggestion: PendingSuggestion | null) => void;
  cancelSuggestion: () => void;
  applySuggestion: () => void;
  requestAnotherOption: () => void;
  sendArchieChat: (text: string, imageUri?: string) => void;
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

function substitutionsForRecipe(applied: AppliedSubstitutionsMap, recipeId: string) {
  return applied[recipeId] ?? EMPTY_SUBSTITUTIONS;
}

function buildDisplaySteps(recipe: Recipe, substitutions: Record<string, SubstitutionRecord>) {
  return applyStepOverrides(recipe, substitutions);
}

function loadRecipeState(recipe: Recipe, substitutions: Record<string, SubstitutionRecord>) {
  return {
    recipe,
    selectedRecipeId: recipe.id,
    baseSteps: [...recipe.steps],
    displaySteps: buildDisplaySteps(recipe, substitutions)
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

function blankSwapState(): ArchieSwapState {
  return {
    selectedIngredientId: null,
    targetRecipeId: null,
    userHasSubstitute: null,
    userSubstituteReply: null,
    pendingSuggestion: null,
    assistantPhase: "idle",
    assistantContext: "conversation",
    recipeConfirmation: "",
    ingredientConfirmation: "",
    lastApplied: null
  };
}

/** Root chat/swap fields reset applied when leaving or opening a session. */
function resetChatRootState() {
  return {
    chatMessages: [] as ArchieChatMessage[],
    ...blankSwapState(),
    ...resetSwapConversation(),
    chatLoading: false,
    unknownHint: null,
    assistantReply: null,
    userMessage: "",
    archieComposerDraft: "",
    composerImageUri: null,
    composerActiveRecipeId: null,
    pendingComposerMessage: null,
    composerSheetMode: null as ComposerSheetMode,
    archieSendLockId: null
  };
}

function snapshotSwapState(state: AppState): ArchieSwapState {
  return {
    selectedIngredientId: state.selectedIngredientId,
    targetRecipeId: state.targetRecipeId,
    userHasSubstitute: state.userHasSubstitute,
    userSubstituteReply: state.userSubstituteReply,
    pendingSuggestion: state.pendingSuggestion,
    assistantPhase: state.assistantPhase,
    assistantContext: state.assistantContext,
    recipeConfirmation: state.recipeConfirmation,
    ingredientConfirmation: state.ingredientConfirmation,
    lastApplied: state.lastApplied
  };
}

function sessionHasUserMessages(session: ArchieChatSession) {
  return session.messages.some((message) => message.role === "user");
}

function deriveSessionTitle(session: ArchieChatSession): string {
  if (session.kind === "recipe_swap") {
    const recipeTitle = session.recipeId ? getRecipeById(session.recipeId)?.title : null;
    const recipe = session.recipeId ? getRecipeById(session.recipeId) : null;
    const ingredientLabel =
      recipe && session.ingredientId
        ? findIngredientById(recipe, session.ingredientId)?.label
        : null;
    const prefix = session.swapState.assistantPhase === "applied" ? "Swapped" : "Swap";
    if (ingredientLabel && recipeTitle) return `${prefix} ${ingredientLabel} · ${recipeTitle}`;
    if (recipeTitle) return `${prefix} · ${recipeTitle}`;
    return `${prefix} ingredient`;
  }

  const firstUserMessage = session.messages.find((message) => message.role === "user");
  if (firstUserMessage?.text) {
    const text = firstUserMessage.text.trim();
    return text.length > 48 ? `${text.slice(0, 45)}…` : text;
  }
  return "New chat";
}

function createSessionRecord(
  kind: ArchieSessionKind,
  options?: {
    recipeId?: string;
    ingredientId?: string;
    messages?: ArchieChatMessage[];
    swapState?: ArchieSwapState;
    recipeContextSource?: ArchieRecipeContextSource;
  }
): ArchieChatSession {
  const now = Date.now();
  const session: ArchieChatSession = {
    id: createSessionId(),
    kind,
    title: "New chat",
    recipeId: options?.recipeId,
    recipeContextSource: options?.recipeContextSource,
    ingredientId: options?.ingredientId,
    messages: options?.messages ?? [],
    swapState: options?.swapState ?? blankSwapState(),
    createdAt: now,
    lastAccessedAt: now
  };
  session.title = deriveSessionTitle(session);
  return session;
}

/** Removes the given session from the list when it holds no user messages. */
function dropSessionIfEmpty(sessions: ArchieChatSession[], sessionId: string | null) {
  if (!sessionId) return sessions;
  return sessions.filter(
    (session) => session.id !== sessionId || sessionHasUserMessages(session)
  );
}

/**
 * Frees a slot when at capacity. Returns the trimmed list, or null when every
 * session is protected from eviction (active or mid-generation).
 */
function makeRoomForSession(
  sessions: ArchieChatSession[],
  activeSessionId: string | null
): ArchieChatSession[] | null {
  if (sessions.length < MAX_SESSIONS) return sessions;
  const candidate = pickEvictionCandidate(sessions, activeSessionId);
  if (!candidate) return null;
  return sessions.filter((session) => session.id !== candidate.id);
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
  composerImageUri: null,
  composerActiveRecipeId: null,
  pendingComposerMessage: null,
  composerSheetMode: null,
  appliedSubstitutions: {},
  fallbackMode: false,
  swapSheetVisible: false,
  archSheetVisible: false,
  assistantContext: "conversation",
  assistantPhase: "idle",
  chatMessages: [],
  archieSessions: [],
  activeSessionId: null,
  archieSidebarOpen: false,
  userMessage: "",
  unknownHint: null,
  assistantReply: null,
  chatLoading: false,
  chatRequestId: 0,
  archieSendLockId: null,
  anotherOptionLoading: false,
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

    if (tab === "archie" && current !== "archie") {
      // Entering Archie from the tab bar always starts a brand-new general chat.
      const state = get();
      let sessions = dropSessionIfEmpty(
        pruneExpiredSessions(state.archieSessions),
        state.activeSessionId
      );

      const withRoom = makeRoomForSession(sessions, null);
      if (!withRoom) {
        // Every session is protected (mid-generation) — resume the latest instead.
        const latest = [...sessions].sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)[0];
        set({
          archieSessions: sessions,
          activeTab: "archie",
          returnTab: current,
          toastMessage: "Chat limit reached — delete a chat to start a new one"
        });
        if (latest) get().switchSession(latest.id);
        setTimeout(() => set({ toastMessage: null }), 2500);
        return;
      }

      const session = createSessionRecord("general");
      set({
        ...resetChatRootState(),
        archieSessions: [...withRoom, session],
        activeSessionId: session.id,
        archieSidebarOpen: false,
        chatRequestId: state.chatRequestId + 1,
        activeTab: "archie",
        returnTab: current
      });
      return;
    }

    set({
      activeTab: tab,
      recipesView: tab === "recipes" ? "list" : get().recipesView
    });
  },

  exitArchie: () => {
    const state = get();
    const sessions = dropSessionIfEmpty(
      pruneExpiredSessions(state.archieSessions),
      state.activeSessionId
    );

    set({
      activeTab: state.returnTab,
      archieSessions: sessions,
      activeSessionId: null,
      archieSidebarOpen: false,
      chatRequestId: state.chatRequestId + 1,
      ...resetChatRootState()
    });
  },

  openRecipe: (recipeId, options) => {
    const recipe = getRecipeById(recipeId);
    if (!recipe) return;

    const substitutions = substitutionsForRecipe(get().appliedSubstitutions, recipeId);

    set({
      ...loadRecipeState(recipe, substitutions),
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

  openArchieSidebar: () => set({ archieSidebarOpen: true }),
  closeArchieSidebar: () => set({ archieSidebarOpen: false }),

  switchSession: (sessionId) => {
    const state = get();
    if (sessionId === state.activeSessionId) {
      set({ archieSidebarOpen: false });
      return;
    }

    let sessions = pruneExpiredSessions(state.archieSessions);
    const target = sessions.find((session) => session.id === sessionId);
    if (!target) {
      set({ archieSessions: sessions, archieSidebarOpen: false });
      return;
    }

    sessions = dropSessionIfEmpty(sessions, state.activeSessionId);
    const now = Date.now();
    sessions = sessions.map((session) =>
      session.id === sessionId ? { ...session, lastAccessedAt: now } : session
    );

    const sessionRecipeId = target.swapState.targetRecipeId ?? target.recipeId ?? null;
    const sessionRecipe = sessionRecipeId ? getRecipeById(sessionRecipeId) : null;
    const recipeState = sessionRecipe
      ? loadRecipeState(
          sessionRecipe,
          substitutionsForRecipe(state.appliedSubstitutions, sessionRecipe.id)
        )
      : {};

    set({
      ...resetChatRootState(),
      ...recipeState,
      archieSessions: sessions,
      activeSessionId: sessionId,
      archieSidebarOpen: false,
      chatRequestId: state.chatRequestId + 1,
      chatMessages: target.messages,
      ...target.swapState
    });
  },

  deleteSession: (sessionId) => {
    const state = get();
    const remaining = state.archieSessions.filter((session) => session.id !== sessionId);

    if (state.activeSessionId !== sessionId) {
      set({ archieSessions: remaining });
      return;
    }

    // Deleting the active chat drops the user into a fresh general chat.
    const session = createSessionRecord("general");
    set({
      ...resetChatRootState(),
      archieSessions: [...remaining, session],
      activeSessionId: session.id,
      chatRequestId: state.chatRequestId + 1
    });
  },

  toggleFallbackMode: () => set((state) => ({ fallbackMode: !state.fallbackMode })),

  hasSubstitution: (ingredientId) =>
    Boolean(substitutionsForRecipe(get().appliedSubstitutions, get().recipe.id)[ingredientId]),

  refreshDisplaySteps: () =>
    set((state) => ({
      displaySteps: buildDisplaySteps(
        state.recipe,
        substitutionsForRecipe(state.appliedSubstitutions, state.recipe.id)
      )
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
    const ingredient = findIngredientById(recipe, ingredientId);
    if (!ingredient || get().hasSubstitution(ingredientId)) return;

    const currentTab = get().activeTab;

    // Recipe context known while already chatting: stay in the current session.
    if (fromRecipe && currentTab === "archie") {
      const swapUserMessage = userMessageFor(ingredient);
      const { activeSessionId } = get();
      set((state) => ({
        selectedIngredientId: ingredientId,
        ...resetSwapConversation(),
        unknownHint: null,
        assistantReply: null,
        chatLoading: false,
        recipeConfirmation: "",
        ingredientConfirmation: "",
        lastApplied: null,
        assistantContext: "recipe" as AssistantContext,
        chatMessages: appendChatMessages(
          state.chatMessages,
          { role: "user", text: swapUserMessage },
          { role: "assistant", text: ARCHIE_PROMPTS.pickSubstitute }
        ),
        userMessage: swapUserMessage,
        targetRecipeId: recipe.id,
        composerActiveRecipeId: recipe.id,
        assistantPhase: "awaiting_substitute" as AssistantPhase,
        archieSessions: state.archieSessions.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                recipeId: recipe.id,
                recipeContextSource:
                  session.kind === "recipe_swap"
                    ? session.recipeContextSource ?? ("recipe_entry" as const)
                    : ("explicit_attach" as const)
              }
            : session
        )
      }));
      return;
    }

    // Entry from the recipe screen: isolated recipe-swap session.
    if (fromRecipe) {
      const state = get();
      let sessions = dropSessionIfEmpty(
        pruneExpiredSessions(state.archieSessions),
        state.activeSessionId
      );

      // Resume an in-flight swap chat for this exact recipe + ingredient.
      const resumable = sessions.find(
        (session) =>
          session.kind === "recipe_swap" &&
          session.recipeId === recipe.id &&
          session.ingredientId === ingredientId &&
          RESUMABLE_SWAP_PHASES.includes(session.swapState.assistantPhase)
      );

      if (resumable) {
        set({ archieSessions: sessions });
        get().switchSession(resumable.id);
        set({
          activeTab: "archie",
          returnTab: currentTab !== "archie" ? currentTab : get().returnTab
        });
        return;
      }

      const withRoom = makeRoomForSession(sessions, null);
      if (!withRoom) {
        set({
          archieSessions: sessions,
          toastMessage: "Chat limit reached — delete a chat to start a new one"
        });
        setTimeout(() => set({ toastMessage: null }), 2500);
        return;
      }

      const swapUserMessage = userMessageFor(ingredient);
      const messages = appendChatMessages(
        [],
        { role: "user", text: swapUserMessage },
        { role: "assistant", text: ARCHIE_PROMPTS.pickSubstitute }
      );
      const swapState: ArchieSwapState = {
        ...blankSwapState(),
        selectedIngredientId: ingredientId,
        targetRecipeId: recipe.id,
        assistantPhase: "awaiting_substitute",
        assistantContext: "recipe"
      };
      const session = createSessionRecord("recipe_swap", {
        recipeId: recipe.id,
        ingredientId,
        messages,
        swapState,
        recipeContextSource: "recipe_entry"
      });

      set({
        ...resetChatRootState(),
        ...swapState,
        archieSessions: [...withRoom, session],
        activeSessionId: session.id,
        chatRequestId: state.chatRequestId + 1,
        chatMessages: messages,
        userMessage: swapUserMessage,
        activeTab: "archie",
        returnTab: currentTab !== "archie" ? currentTab : get().returnTab
      });
      return;
    }

    const swapUserMessage = userMessageFor(ingredient);
    set((state) => ({
      selectedIngredientId: ingredientId,
      ...resetSwapConversation(),
      unknownHint: null,
      assistantReply: null,
      chatLoading: false,
      recipeConfirmation: "",
      ingredientConfirmation: "",
      lastApplied: null,
      assistantContext: "conversation" as AssistantContext,
      chatMessages: appendChatMessages(
        state.chatMessages,
        { role: "user", text: swapUserMessage },
        { role: "assistant", text: ARCHIE_PROMPTS.pickRecipe }
      ),
      userMessage: swapUserMessage,
      targetRecipeId: null,
      assistantPhase: "pick_recipe" as AssistantPhase,
      activeTab: "archie" as TabName,
      returnTab: currentTab !== "archie" ? currentTab : get().returnTab
    }));
  },

  selectRecipeForSwap: (recipeId) => {
    const recipe = getRecipeById(recipeId);
    if (!recipe) return;

    const selectedIngredientId = get().selectedIngredientId;
    const substitutions = substitutionsForRecipe(get().appliedSubstitutions, recipeId);

    if (!selectedIngredientId) {
      set((state) => ({
        ...loadRecipeState(recipe, substitutions),
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
      ...loadRecipeState(recipe, substitutions),
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

  openComposerImageSheet: () => {
    if (get().assistantPhase === "loading") return;
    set({ composerSheetMode: "image-source" });
  },

  openComposerRecipeSheet: () => {
    if (get().assistantPhase === "loading") return;
    set({ composerSheetMode: "recipe-picker" });
  },

  closeComposerSheet: () => set({ composerSheetMode: null }),

  setComposerImage: (uri) => set({ composerImageUri: uri }),

  clearComposerAttachments: () => set({ composerImageUri: null }),

  clearComposerActiveRecipe: () => get().clearArchieRecipeContext(),

  clearArchieRecipeContext: () => {
    const { activeSessionId } = get();
    set((state) => ({
      composerActiveRecipeId: null,
      archieSessions: state.archieSessions.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              recipeId: undefined,
              recipeContextSource: undefined
            }
          : session
      )
    }));
  },

  selectComposerRecipe: (recipeId) => {
    const recipe = getRecipeById(recipeId);
    if (!recipe) return;

    const substitutions = substitutionsForRecipe(get().appliedSubstitutions, recipeId);
    const pendingMessage = get().pendingComposerMessage;
    const { activeSessionId } = get();

    set((state) => ({
      ...loadRecipeState(recipe, substitutions),
      composerActiveRecipeId: recipeId,
      composerSheetMode: null,
      targetRecipeId: recipeId,
      assistantContext: "recipe",
      assistantPhase: "idle",
      pendingComposerMessage: null,
      archieSessions: state.archieSessions.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              recipeId,
              recipeContextSource: "explicit_attach" as const
            }
          : session
      )
    }));

    get().requestComposerFocus();

    if (pendingMessage) {
      get().submitAssistantInput(pendingMessage);
    }
  },

  requestRecipeContext: (message) => {
    set((state) => ({
      pendingComposerMessage: message,
      composerSheetMode: "recipe-picker",
      userMessage: message,
      chatMessages: appendChatMessages(
        state.chatMessages,
        { role: "user", text: message },
        { role: "assistant", text: "Which recipe should I use?" }
      )
    }));
  },

  submitComposerMessage: (rawText) => {
    const text = rawText.trim();
    const imageUri = get().composerImageUri;
    if (!text && !imageUri) return;

    const messageText = text || "What's in this photo?";
    const imageUriToSend = imageUri;

    if (imageUriToSend) {
      set({ composerImageUri: null });
    }

    const phase = get().assistantPhase;
    if (phase === "loading" || phase === "pick_recipe" || phase === "pick_ingredient") return;

    if (
      !canBeginArchieSend({
        chatLoading: get().chatLoading,
        archieSendLockId: get().archieSendLockId
      })
    ) {
      return;
    }

    if (imageUriToSend) {
      get().sendArchieChat(messageText, imageUriToSend);
      return;
    }

    get().submitAssistantInput(messageText);
  },

  setAssistantPhase: (phase) => set({ assistantPhase: phase }),
  setProgressStep: (step) => set({ progressStep: step }),
  setPendingSuggestion: (suggestion) => set({ pendingSuggestion: suggestion }),

  cancelSuggestion: () => {
    const state = get();
    const wasRecipeFlow = state.assistantContext === "recipe";

    if (wasRecipeFlow) {
      // Mark the swap session cancelled so a future swap starts fresh.
      const sessions = pruneExpiredSessions(state.archieSessions).map((session) =>
        session.id === state.activeSessionId
          ? {
              ...session,
              swapState: {
                ...session.swapState,
                assistantPhase: "idle" as AssistantPhase,
                pendingSuggestion: null,
                selectedIngredientId: null
              }
            }
          : session
      );

      set({
        ...resetChatRootState(),
        archieSessions: sessions,
        activeSessionId: null,
        chatRequestId: state.chatRequestId + 1,
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
        stepOverride: pendingSuggestion.stepOverride,
        stepOverrides: resolveStepOverrides(recipe, ingredient, pendingSuggestion)
      };

      const recipeSubstitutions = {
        ...substitutionsForRecipe(get().appliedSubstitutions, recipe.id),
        [ingredient.id]: record
      };
      const appliedSubstitutions: AppliedSubstitutionsMap = {
        ...get().appliedSubstitutions,
        [recipe.id]: recipeSubstitutions
      };

      set({
        appliedSubstitutions,
        displaySteps: buildDisplaySteps(recipe, recipeSubstitutions),
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
    const {
      pendingSuggestion,
      selectedIngredientId,
      userHasSubstitute,
      recipe,
      anotherOptionLoading,
      activeSessionId
    } = get();
    if (!pendingSuggestion || !selectedIngredientId || !userHasSubstitute || anotherOptionLoading) {
      return;
    }

    set({ anotherOptionLoading: true });

    void runSwapGeneration(
      recipe,
      selectedIngredientId,
      userHasSubstitute,
      get().fallbackMode,
      {
        dietaryGoals: get().dietaryGoals,
        allergies: get().allergies,
        cookingFor: get().cookingFor,
        pantryMode: get().pantryMode
      },
      { exclude: [pendingSuggestion.displayItem] }
    )
      .then((alt) => {
        if (get().activeSessionId !== activeSessionId) return;
        if (alt.displayItem === pendingSuggestion.displayItem) {
          set({
            anotherOptionLoading: false,
            toastMessage: "That's the best match for what you have"
          });
          setTimeout(() => set({ toastMessage: null }), 2000);
          return;
        }
        set({ pendingSuggestion: alt, anotherOptionLoading: false });
      })
      .catch(() => {
        if (get().activeSessionId !== activeSessionId) return;
        set({
          anotherOptionLoading: false,
          toastMessage: "Couldn't fetch another option right now"
        });
        setTimeout(() => set({ toastMessage: null }), 2000);
      });
  },

  sendArchieChat: (text, imageUri) => {
    const state = get();

    if (
      !canBeginArchieSend({
        chatLoading: state.chatLoading,
        archieSendLockId: state.archieSendLockId
      })
    ) {
      return;
    }

    const { chatMessages, activeSessionId } = state;
    const explicitRecipeId = resolveExplicitArchieRecipeId(state);
    const attachedRecipe = explicitRecipeId ? getRecipeById(explicitRecipeId) : null;
    const requestId = state.chatRequestId + 1;
    const lockId = `send-${requestId}`;
    const nextMessages = appendChatMessages(chatMessages, {
      role: "user",
      text,
      requestId,
      ...(imageUri ? { imageUri } : {})
    });

    // Acquire lock synchronously before any async work so double-taps cannot race.
    set({
      chatMessages: nextMessages,
      userMessage: text,
      unknownHint: null,
      assistantReply: null,
      chatLoading: true,
      chatRequestId: requestId,
      archieSendLockId: lockId,
      assistantPhase: "idle",
      archieComposerDraft: ""
    });

    void (async () => {
      const imageDataUrl = imageUri ? await readImageAsDataUrl(imageUri) : undefined;
      const imageFilename = imageUri ? imageUri.split("/").pop() : undefined;

      const isStale = () =>
        get().chatRequestId !== requestId || get().activeSessionId !== activeSessionId;

      const clearSendLock = () => {
        if (get().archieSendLockId === lockId) {
          set({ chatLoading: false, archieSendLockId: null });
        } else {
          set({ chatLoading: false });
        }
      };

      try {
        const response = await requestArchieChat({
          message: text,
          imageDataUrl: imageDataUrl ?? undefined,
          imageFilename,
          history: nextMessages.slice(0, -1).map((item) => ({
            role: item.role,
            content: item.text
          })),
          ...(attachedRecipe
            ? {
                recipe: serializeArchieChatRecipe(attachedRecipe),
                recipeExplicitlyAttached: true as const
              }
            : {}),
          dietaryGoals: get().dietaryGoals,
          allergies: get().allergies,
          cookingFor: get().cookingFor,
          pantryMode: get().pantryMode
        });

        if (isStale()) {
          clearSendLock();
          return;
        }

        const structuredResponse = mapChatResponseToStructured(response, {
          userMessage: text,
          recipeTitle: attachedRecipe?.title,
          source: response.source,
          hasImage: Boolean(imageUri),
          dietaryGoals: get().dietaryGoals
        });

        const assistantText = structuredResponse
          ? structuredResponseToHistoryText(structuredResponse)
          : stripUnnecessaryFollowUp(response.reply);

        set((current) => {
          if (!shouldAppendAssistantForRequest(current.chatMessages, requestId)) {
            return {
              chatLoading: false,
              archieSendLockId: current.archieSendLockId === lockId ? null : current.archieSendLockId,
              assistantReply: null
            };
          }

          return {
            chatLoading: false,
            archieSendLockId: current.archieSendLockId === lockId ? null : current.archieSendLockId,
            assistantReply: null,
            chatMessages: appendChatMessages(current.chatMessages, {
              role: "assistant",
              text: assistantText,
              requestId,
              ...(structuredResponse ? { structuredResponse } : { plainBubble: true })
            })
          };
        });
      } catch {
        if (isStale()) {
          clearSendLock();
          return;
        }
        set((current) => {
          if (!shouldAppendAssistantForRequest(current.chatMessages, requestId)) {
            return {
              chatLoading: false,
              archieSendLockId: current.archieSendLockId === lockId ? null : current.archieSendLockId,
              assistantReply: null
            };
          }

          return {
            chatLoading: false,
            archieSendLockId: current.archieSendLockId === lockId ? null : current.archieSendLockId,
            assistantReply: null,
            chatMessages: appendChatMessages(current.chatMessages, {
              role: "assistant",
              text: imageUri ? ARCHIE_CHAT_ERROR_MSG : UNKNOWN_INGREDIENT_MSG,
              requestId
            })
          };
        });
      }
    })();
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

    const state = get();
    const explicitRecipeId = resolveExplicitArchieRecipeId(state);
    const hasAttachedRecipe = Boolean(explicitRecipeId);

    const previousUserMessage = [...state.chatMessages]
      .reverse()
      .find((message) => message.role === "user")?.text;
    const previousAssistantMessage = [...state.chatMessages]
      .reverse()
      .find((message) => message.role === "assistant")?.text;

    const intent = inferArchieIntentResult({
      text,
      hasAttachedRecipe,
      previousUserMessage,
      previousAssistantMessage
    });

    if (__DEV__) {
      console.info("[archie] intent", intent);
    }

    if (intent.type === "unclear") {
      set((current) => ({
        chatMessages: appendChatMessages(
          current.chatMessages,
          { role: "user", text },
          { role: "assistant", text: intent.clarification, plainBubble: true }
        ),
        userMessage: text,
        unknownHint: null,
        assistantReply: null,
        chatLoading: false,
        archieSendLockId: null,
        assistantPhase: "idle",
        archieComposerDraft: ""
      }));
      return;
    }

    if (!hasAttachedRecipe && messageNeedsRecipeContext(text)) {
      get().requestRecipeContext(text);
      return;
    }

    // Network-bound path: refuse if a send is already in flight.
    if (
      !canBeginArchieSend({
        chatLoading: get().chatLoading,
        archieSendLockId: get().archieSendLockId
      })
    ) {
      return;
    }

    const attachedRecipe = explicitRecipeId ? getRecipeById(explicitRecipeId) : null;
    const recipeForSwap = attachedRecipe ?? get().recipe;

    if (intent.type === "recipe_alteration" || intent.type === "substitution") {
      const ingredientId = resolveIngredientIdFromText(recipeForSwap, text);
      if (ingredientId) {
        get().startSwap(ingredientId, hasAttachedRecipe);
        return;
      }
      get().sendArchieChat(text);
      return;
    }

    get().sendArchieChat(text);
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

// --- Session sync + persistence -------------------------------------------

/**
 * Mirrors the live chat/swap root state into the active session record so the
 * sidebar, resume logic, and persistence always see the current conversation.
 * Runs on every store update, but only writes when chat-relevant fields moved.
 */
useAppStore.subscribe((state, prevState) => {
  const chatFieldsChanged =
    state.chatMessages !== prevState.chatMessages ||
    state.assistantPhase !== prevState.assistantPhase ||
    state.assistantContext !== prevState.assistantContext ||
    state.pendingSuggestion !== prevState.pendingSuggestion ||
    state.selectedIngredientId !== prevState.selectedIngredientId ||
    state.targetRecipeId !== prevState.targetRecipeId ||
    state.userHasSubstitute !== prevState.userHasSubstitute ||
    state.lastApplied !== prevState.lastApplied;

  if (chatFieldsChanged && state.activeSessionId) {
    const index = state.archieSessions.findIndex(
      (session) => session.id === state.activeSessionId
    );
    if (index >= 0) {
      const current = state.archieSessions[index];
      const updated: ArchieChatSession = {
        ...current,
        messages: state.chatMessages,
        swapState: snapshotSwapState(state),
        lastAccessedAt: Date.now()
      };
      updated.title = deriveSessionTitle(updated);

      const sessions = [...state.archieSessions];
      sessions[index] = updated;
      useAppStore.setState({ archieSessions: sessions });
      return;
    }
  }

  if (state.archieSessions !== prevState.archieSessions) {
    persistSessions(state.archieSessions);
  }
});

void loadPersistedSessions().then((persisted) => {
  if (persisted.length === 0) return;

  // Merge behind any sessions created before hydration finished.
  useAppStore.setState((state) => {
    const liveIds = new Set(state.archieSessions.map((session) => session.id));
    const merged = [
      ...persisted.filter((session) => !liveIds.has(session.id)),
      ...state.archieSessions
    ];
    return { archieSessions: merged.slice(-MAX_SESSIONS) };
  });
});
