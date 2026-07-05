import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { archieComposerScrollInset } from "@/components/archie/ArchieComposer";
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

const PROMPT_CHIPS = [
  { label: "Swap heavy cream", item: "heavy cream", primary: true },
  { label: "What can replace salt?", item: "salt", primary: false },
  { label: "Make this soup lower sodium", item: "salt", primary: false }
] as const;

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
  const setProgressStep = useAppStore((state) => state.setProgressStep);
  const setPendingSuggestion = useAppStore((state) => state.setPendingSuggestion);
  const setAssistantPhase = useAppStore((state) => state.setAssistantPhase);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [
    assistantPhase,
    pendingSuggestion,
    userMessage,
    unknownHint,
    recipeConfirmation,
    userSubstituteReply,
    lastApplied,
    applyPhase
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

  async function handleChipPress(item: string) {
    await Haptics.selectionAsync();
    const ingredientId = findIngredientIdByLabel(recipe, item);
    if (ingredientId) {
      startSwap(ingredientId, false);
    }
  }

  const showWelcome =
    assistantPhase === "idle" && !userMessage && !unknownHint && !pendingSuggestion && !lastApplied;

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: archieComposerScrollInset(insets.bottom) }
      ]}
      style={{ backgroundColor: colors.background }}
    >
      {showWelcome ? (
        <View style={styles.welcome}>
          <View style={[styles.bubble, styles.assistBubble, { backgroundColor: colors.canvas }]}>
            <AppText muted style={styles.intro}>
              I can help adjust recipes around your pantry and dietary needs. Tell me what ingredient you&apos;re
              missing and what you have instead.
            </AppText>
          </View>
          <View style={styles.chips}>
            {PROMPT_CHIPS.map((chip) => (
              <Pressable
                key={chip.label}
                accessibilityRole="button"
                onPress={() => handleChipPress(chip.item)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: chip.primary ? colors.brandSoft : colors.surface,
                    borderColor: colors.brandBorder
                  }
                ]}
              >
                <AppText
                  style={[
                    styles.chipText,
                    { color: colors.brandOnBrand, fontWeight: chip.primary ? "600" : "500" }
                  ]}
                >
                  {chip.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

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
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingHorizontal: layout.screenPadding,
    paddingTop: 4
  },
  welcome: {
    gap: spacing.lg
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
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  chipText: {
    fontFamily,
    fontSize: 13
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
