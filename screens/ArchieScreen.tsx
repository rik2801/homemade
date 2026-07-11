import { useEffect, useMemo, useRef } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { archieComposerScrollInset } from "@/components/archie/ArchieComposer";
import {
  ArchieEmptyState,
  archieEmptyStateDefaults
} from "@/components/archie/ArchieEmptyState";
import { ArchieStructuredResponseCard } from "@/components/archie/ArchieStructuredResponseCard";
import { ArchieProgressCard } from "@/components/archie/ArchieProgressCard";
import { IngredientPickerCards } from "@/components/archie/IngredientPickerCards";
import { RecipePickerCards } from "@/components/archie/RecipePickerCards";
import { SubstitutePromptChips } from "@/components/archie/SubstitutePromptChips";
import { AppText } from "@/components/primitives/AppText";
import { SwapRecommendationCard } from "@/components/swap/SwapRecommendationCard";
import { useAppTheme } from "@/hooks/useAppTheme";
import { appendChatMessages } from "@/lib/archieChat";
import { formatAssistantMessage, resolveMessageStructuredResponse } from "@/lib/mapArchieStructuredResponse";
import { runSwapGeneration } from "@/services/assistantService";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { layout, radius, spacing } from "@/theme/spacing";

export function ArchieScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const assistantPhase = useAppStore((state) => state.assistantPhase);
  const recipe = useAppStore((state) => state.recipe);
  const chatMessages = useAppStore((state) => state.chatMessages);
  const chatLoading = useAppStore((state) => state.chatLoading);
  const pendingSuggestion = useAppStore((state) => state.pendingSuggestion);
  const progressStep = useAppStore((state) => state.progressStep);
  const selectedIngredientId = useAppStore((state) => state.selectedIngredientId);
  const userHasSubstitute = useAppStore((state) => state.userHasSubstitute);
  const fallbackMode = useAppStore((state) => state.fallbackMode);
  const dietaryGoals = useAppStore((state) => state.dietaryGoals);
  const allergies = useAppStore((state) => state.allergies);
  const cookingFor = useAppStore((state) => state.cookingFor);
  const pantryMode = useAppStore((state) => state.pantryMode);
  const lastApplied = useAppStore((state) => state.lastApplied);
  const applyPhase = useAppStore((state) => state.applyPhase);
  const setProgressStep = useAppStore((state) => state.setProgressStep);
  const setPendingSuggestion = useAppStore((state) => state.setPendingSuggestion);
  const setAssistantPhase = useAppStore((state) => state.setAssistantPhase);

  const showWelcome =
    assistantPhase === "idle" &&
    chatMessages.length === 0 &&
    !chatLoading &&
    !pendingSuggestion &&
    !lastApplied;

  const emptyOpacity = useSharedValue(showWelcome ? 1 : 0);
  const conversationOpacity = useSharedValue(showWelcome ? 0 : 1);

  useEffect(() => {
    const nextEmpty = showWelcome ? 1 : 0;
    const nextConversation = showWelcome ? 0 : 1;

    if (emptyOpacity.value !== nextEmpty) {
      emptyOpacity.value = withTiming(nextEmpty, { duration: 280 });
    }
    if (conversationOpacity.value !== nextConversation) {
      conversationOpacity.value = withTiming(nextConversation, { duration: 280 });
    }
  }, [conversationOpacity, emptyOpacity, showWelcome]);

  useEffect(() => {
    if (showWelcome) return;
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [
    assistantPhase,
    applyPhase,
    chatLoading,
    chatMessages,
    pendingSuggestion,
    showWelcome,
    lastApplied
  ]);

  function handleContentSizeChange() {
    if (showWelcome) return;
    scrollRef.current?.scrollToEnd({ animated: false });
  }

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
    const sessionAtStart = useAppStore.getState().activeSessionId;

    runSwapGeneration(recipe, selectedIngredientId, userHasSubstitute, fallbackMode, {
      dietaryGoals,
      allergies,
      cookingFor,
      pantryMode
    }).then((suggestion) => {
      if (cancelled) return;
      // Session changed mid-generation — never write into the wrong chat.
      if (useAppStore.getState().activeSessionId !== sessionAtStart) return;
      clearInterval(interval);
      setProgressStep(3);
      setPendingSuggestion(suggestion);
      const formatted = formatAssistantMessage(
        `Try ${suggestion.displayItem} (${suggestion.recommendedUsage}). ${suggestion.why}`,
        { source: suggestion.source === "fallback" ? "fallback" : "ai" }
      );
      useAppStore.setState((state) => ({
        chatMessages: appendChatMessages(state.chatMessages, {
          role: "assistant",
          text: formatted.text,
          ...(formatted.structuredResponse ? { structuredResponse: formatted.structuredResponse } : {})
        })
      }));
      setAssistantPhase("suggestion");
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    assistantPhase,
    recipe,
    selectedIngredientId,
    userHasSubstitute,
    fallbackMode,
    dietaryGoals,
    allergies,
    cookingFor,
    pantryMode,
    setAssistantPhase,
    setPendingSuggestion,
    setProgressStep
  ]);

  const emptyStyle = useAnimatedStyle(() => ({
    opacity: emptyOpacity.value
  }));

  const conversationStyle = useAnimatedStyle(() => ({
    opacity: conversationOpacity.value
  }));

  const composerInset = useMemo(
    () => archieComposerScrollInset(Math.round(insets.bottom)),
    [insets.bottom]
  );

  return (
    <View style={styles.screen}>
      <Animated.View
        pointerEvents={showWelcome ? "box-none" : "none"}
        style={[
          styles.emptyLayer,
          emptyStyle,
          {
            paddingBottom: composerInset * 0.45,
            paddingHorizontal: layout.screenPadding
          }
        ]}
      >
        <ArchieEmptyState headline={archieEmptyStateDefaults.headline} />
      </Animated.View>

      <Animated.View pointerEvents={showWelcome ? "none" : "auto"} style={[styles.conversationLayer, conversationStyle]}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          onContentSizeChange={handleContentSizeChange}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: composerInset, paddingTop: spacing.sm }
          ]}
          style={styles.conversationScroll}
        >
          {chatMessages.map((message, index) => {
            const priorUserMessage = chatMessages
              .slice(0, index)
              .reverse()
              .find((item) => item.role === "user");

            const structuredResponse =
              message.role === "assistant"
                ? resolveMessageStructuredResponse(message, {
                    hasImage: Boolean(priorUserMessage?.imageUri),
                    userMessage: priorUserMessage?.text
                  })
                : null;

            if (message.role === "assistant" && structuredResponse) {
              return (
                <View key={message.id} style={styles.messageGroup}>
                  <ArchieStructuredResponseCard {...structuredResponse} />
                </View>
              );
            }

            return (
              <View key={message.id} style={styles.messageGroup}>
                <View
                  style={[
                    styles.bubble,
                    message.role === "user" ? styles.userBubble : styles.assistBubble,
                    {
                      backgroundColor: message.role === "user" ? colors.borderLight : colors.canvas
                    }
                  ]}
                >
                  {message.imageUri ? (
                    <Image source={{ uri: message.imageUri }} style={styles.messageImage} />
                  ) : null}
                  {message.text ? (
                    <AppText
                      muted={message.role === "assistant"}
                      style={[
                        message.role === "user" ? styles.userText : styles.intro,
                        message.role === "user" ? { color: colors.text } : undefined
                      ]}
                    >
                      {message.text}
                    </AppText>
                  ) : null}
                </View>
              </View>
            );
          })}

          {assistantPhase === "pick_recipe" ? (
            <View style={[styles.bubble, styles.assistBubble, { backgroundColor: colors.canvas }]}>
              <RecipePickerCards />
            </View>
          ) : null}

          {assistantPhase === "pick_ingredient" ? (
            <View style={[styles.bubble, styles.assistBubble, { backgroundColor: colors.canvas }]}>
              <IngredientPickerCards />
            </View>
          ) : null}

          {assistantPhase === "awaiting_substitute" ? (
            <View style={[styles.bubble, styles.assistBubble, { backgroundColor: colors.canvas }]}>
              <SubstitutePromptChips />
            </View>
          ) : null}

          {assistantPhase === "loading" || chatLoading ? (
            <ArchieProgressCard key={`progress-${progressStep}-${chatLoading ? "chat" : "swap"}`} />
          ) : null}

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
    justifyContent: "flex-start",
    paddingTop: spacing.xl,
    zIndex: 1
  },
  conversationLayer: {
    flex: 1,
    minHeight: 0,
    zIndex: 0
  },
  conversationScroll: {
    flex: 1,
    minHeight: 0
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: layout.screenPadding,
    paddingTop: 4
  },
  messageGroup: {
    gap: spacing.sm
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
    fontSize: 11,
    lineHeight: 16
  },
  userText: {
    fontFamily,
    fontSize: 11,
    lineHeight: 16
  },
  messageImage: {
    borderRadius: radius.md,
    height: 120,
    marginBottom: spacing.sm,
    width: 160
  },
  appliedCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  appliedTitle: {
    fontFamily,
    fontSize: 11,
    fontWeight: "700"
  }
});
