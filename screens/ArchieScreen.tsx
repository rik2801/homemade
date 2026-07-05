import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { archieComposerScrollInset } from "@/components/archie/ArchieComposer";
import {
  ArchieEmptyState,
  archieEmptyStateDefaults
} from "@/components/archie/ArchieEmptyState";
import { ArchieProgressCard } from "@/components/archie/ArchieProgressCard";
import { RecipePickerCards } from "@/components/archie/RecipePickerCards";
import { SubstitutePromptChips } from "@/components/archie/SubstitutePromptChips";
import { AppText } from "@/components/primitives/AppText";
import { SwapRecommendationCard } from "@/components/swap/SwapRecommendationCard";
import { useAppTheme } from "@/hooks/useAppTheme";
import { findIngredientIdByLabel } from "@/lib/swapFlow";
import { runSwapGeneration } from "@/services/assistantService";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { layout, radius, spacing } from "@/theme/spacing";

export function ArchieScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const recipe = useAppStore((state) => state.recipe);
  const assistantPhase = useAppStore((state) => state.assistantPhase);
  const userMessage = useAppStore((state) => state.userMessage);
  const unknownHint = useAppStore((state) => state.unknownHint);
  const recipeConfirmation = useAppStore((state) => state.recipeConfirmation);
  const userSubstituteReply = useAppStore((state) => state.userSubstituteReply);
  const pendingSuggestion = useAppStore((state) => state.pendingSuggestion);
  const progressStep = useAppStore((state) => state.progressStep);
  const selectedIngredientId = useAppStore((state) => state.selectedIngredientId);
  const userHasSubstitute = useAppStore((state) => state.userHasSubstitute);
  const fallbackMode = useAppStore((state) => state.fallbackMode);
  const dietaryGoals = useAppStore((state) => state.dietaryGoals);
  const allergies = useAppStore((state) => state.allergies);
  const lastApplied = useAppStore((state) => state.lastApplied);
  const applyPhase = useAppStore((state) => state.applyPhase);
  const startSwap = useAppStore((state) => state.startSwap);
  const submitAssistantInput = useAppStore((state) => state.submitAssistantInput);
  const setProgressStep = useAppStore((state) => state.setProgressStep);
  const setPendingSuggestion = useAppStore((state) => state.setPendingSuggestion);
  const setAssistantPhase = useAppStore((state) => state.setAssistantPhase);

  const showWelcome =
    assistantPhase === "idle" && !userMessage && !unknownHint && !pendingSuggestion && !lastApplied;

  const emptyOpacity = useSharedValue(showWelcome ? 1 : 0);
  const conversationOpacity = useSharedValue(showWelcome ? 0 : 1);

  useEffect(() => {
    emptyOpacity.value = withTiming(showWelcome ? 1 : 0, { duration: 280 });
    conversationOpacity.value = withTiming(showWelcome ? 0 : 1, { duration: 280 });
  }, [conversationOpacity, emptyOpacity, showWelcome]);

  useEffect(() => {
    if (showWelcome) return;
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [
    assistantPhase,
    applyPhase,
    pendingSuggestion,
    recipeConfirmation,
    showWelcome,
    unknownHint,
    userMessage,
    userSubstituteReply,
    lastApplied
  ]);

  useEffect(() => {
    if (assistantPhase !== "loading" || !selectedIngredientId || !userHasSubstitute) return;

    let step = 0;
    setProgressStep(0);

    const interval = setInterval(() => {
      step += 1;
      if (step < 3) {
        setProgressStep(step);
      }
    }, 580);

    let cancelled = false;

    runSwapGeneration(selectedIngredientId, userHasSubstitute, fallbackMode, {
      dietaryGoals,
      allergies
    }).then((suggestion) => {
      if (cancelled) return;
      clearInterval(interval);
      setProgressStep(3);
      setPendingSuggestion(suggestion);
      setAssistantPhase("suggestion");
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    assistantPhase,
    selectedIngredientId,
    userHasSubstitute,
    fallbackMode,
    dietaryGoals,
    allergies,
    setAssistantPhase,
    setPendingSuggestion,
    setProgressStep
  ]);

  const runQuickAction = useCallback(
    async (action: () => void) => {
      await Haptics.selectionAsync();
      action();
    },
    []
  );

  const quickActions = useMemo(
    () => [
      {
        id: "swap",
        label: "Swap an ingredient",
        onPress: () =>
          runQuickAction(() => {
            const ingredientId = findIngredientIdByLabel(recipe, "heavy cream");
            if (ingredientId) {
              startSwap(ingredientId, false);
            }
          })
      },
      {
        id: "sodium",
        label: "Lower sodium",
        onPress: () => runQuickAction(() => submitAssistantInput("Make this soup lower sodium"))
      },
      {
        id: "dairy-free",
        label: "Dairy-free options",
        onPress: () =>
          runQuickAction(() => submitAssistantInput("What dairy-free options work for this recipe?"))
      },
      {
        id: "pantry",
        label: "Use what I have",
        onPress: () => runQuickAction(() => submitAssistantInput("Use what I have in my pantry"))
      }
    ],
    [recipe, runQuickAction, startSwap, submitAssistantInput]
  );

  const emptyStyle = useAnimatedStyle(() => ({
    opacity: emptyOpacity.value
  }));

  const conversationStyle = useAnimatedStyle(() => ({
    opacity: conversationOpacity.value
  }));

  const composerInset = archieComposerScrollInset(insets.bottom);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Animated.View
        pointerEvents={showWelcome ? "auto" : "none"}
        style={[
          styles.emptyLayer,
          emptyStyle,
          {
            paddingBottom: composerInset * 0.45,
            paddingHorizontal: layout.screenPadding
          }
        ]}
      >
        <ArchieEmptyState
          headline={archieEmptyStateDefaults.headline}
          quickActions={quickActions}
        />
      </Animated.View>

      <Animated.View pointerEvents={showWelcome ? "none" : "auto"} style={[styles.conversationLayer, conversationStyle]}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: composerInset }
          ]}
          style={styles.conversationScroll}
        >
          {userMessage ? (
            <View style={[styles.bubble, styles.userBubble, { backgroundColor: colors.brand }]}>
              <AppText style={[styles.userText, { color: colors.brandOnBrand }]}>{userMessage}</AppText>
            </View>
          ) : null}

          {unknownHint ? (
            <View style={[styles.bubble, styles.assistBubble, { backgroundColor: colors.canvas }]}>
              <AppText muted style={styles.intro}>
                {unknownHint}
              </AppText>
            </View>
          ) : null}

          {recipeConfirmation ? (
            <View style={[styles.bubble, styles.userBubble, { backgroundColor: colors.brand }]}>
              <AppText style={[styles.userText, { color: colors.brandOnBrand }]}>{recipeConfirmation}</AppText>
            </View>
          ) : null}

          {assistantPhase === "pick_recipe" ? (
            <View style={[styles.bubble, styles.assistBubble, { backgroundColor: colors.canvas }]}>
              <AppText muted style={styles.intro}>
                Which recipe should I use for this swap?
              </AppText>
              <RecipePickerCards />
            </View>
          ) : null}

          {assistantPhase === "awaiting_substitute" ? (
            <View style={[styles.bubble, styles.assistBubble, { backgroundColor: colors.canvas }]}>
              <AppText muted style={styles.intro}>
                What do you have available instead?
              </AppText>
              <SubstitutePromptChips />
            </View>
          ) : null}

          {userSubstituteReply && assistantPhase !== "awaiting_substitute" ? (
            <View style={[styles.bubble, styles.userBubble, { backgroundColor: colors.brand }]}>
              <AppText style={[styles.userText, { color: colors.brandOnBrand }]}>{userSubstituteReply}</AppText>
            </View>
          ) : null}

          {assistantPhase === "loading" ? <ArchieProgressCard key={`progress-${progressStep}`} /> : null}

          {pendingSuggestion && (assistantPhase === "suggestion" || applyPhase === "loading") ? (
            <SwapRecommendationCard suggestion={pendingSuggestion} />
          ) : null}

          {assistantPhase === "applied" && lastApplied ? (
            <View style={[styles.appliedCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <AppText style={[styles.appliedTitle, { color: colors.green }]}>✓ Applied to recipe</AppText>
              <AppText muted style={styles.intro}>
                <AppText style={{ fontWeight: "700" }}>{lastApplied.currentItem}</AppText> has replaced{" "}
                <AppText style={{ fontWeight: "700" }}>{lastApplied.originalItem}</AppText>.
              </AppText>
              <AppText muted style={styles.intro}>
                View the updated ingredient on the Recipes tab.
              </AppText>
            </View>
          ) : null}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  emptyLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -28 }],
    zIndex: 1
  },
  conversationLayer: {
    flex: 1,
    zIndex: 0
  },
  conversationScroll: {
    flex: 1
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: layout.screenPadding,
    paddingTop: 4
  },
  bubble: {
    borderRadius: 20,
    maxWidth: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  userBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
    maxWidth: "88%"
  },
  assistBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 6
  },
  intro: {
    fontFamily,
    fontSize: 15,
    lineHeight: 22
  },
  userText: {
    fontFamily,
    fontSize: 15,
    lineHeight: 22
  },
  appliedCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  appliedTitle: {
    fontFamily,
    fontSize: 15,
    fontWeight: "700"
  }
});
