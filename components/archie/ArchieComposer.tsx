import * as Haptics from "expo-haptics";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputSelectionChangeEventData,
  View
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { getRecipeById } from "@/features/recipe/data/homemadeRecipe";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

function ImageIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="m3 16 5-5 4 4 5-6 4 5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path d="M14.5 8.5h.01" stroke={color} strokeLinecap="round" strokeWidth={2.5} />
    </Svg>
  );
}

function RecipeIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function CloseIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6 6 18M6 6l12 12" stroke={color} strokeLinecap="round" strokeWidth={2.2} />
    </Svg>
  );
}

function SendArrowIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 19V5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
      />
      <Path
        d="m5 12 7-7 7 7"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
      />
    </Svg>
  );
}

export const ARCHIE_COMPOSER_ESTIMATED_HEIGHT = 200;
const MIN_INPUT_HEIGHT = 44;
const MAX_INPUT_HEIGHT = 140;
const INPUT_VERTICAL_PADDING = 12;
const COMPOSER_CARD_MIN_HEIGHT = 64;
const COMPOSER_CARD_MAX_HEIGHT = MAX_INPUT_HEIGHT + 28;
const EMPTY_SELECTION = { start: 0, end: 0 };
const ARCHIE_COMPOSER_BOTTOM_TRIM = 0.2;
const ARCHIE_COMPOSER_BOTTOM_LIFT = 0.2;

export function archieComposerBottomOffset(bottomInset: number) {
  const base = Math.max(bottomInset, spacing.sm) + spacing.lg;
  return Math.max(spacing.xs, Math.round(base * (ARCHIE_COMPOSER_BOTTOM_TRIM + ARCHIE_COMPOSER_BOTTOM_LIFT)));
}

export function archieComposerScrollInset(bottomInset: number) {
  return ARCHIE_COMPOSER_ESTIMATED_HEIGHT + archieComposerBottomOffset(bottomInset) + spacing.sm;
}

export const ArchieComposer = memo(function ArchieComposer() {
  const { colors, isDark } = useAppTheme();
  const inputRef = useRef<TextInput>(null);
  const assistantPhase = useAppStore((state) => state.assistantPhase);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const composerFocusToken = useAppStore((state) => state.composerFocusToken);
  const composerImageUri = useAppStore((state) => state.composerImageUri);
  const composerActiveRecipeId = useAppStore((state) => state.composerActiveRecipeId);
  const setArchieComposerDraft = useAppStore((state) => state.setArchieComposerDraft);
  const submitComposerMessage = useAppStore((state) => state.submitComposerMessage);
  const openComposerImageSheet = useAppStore((state) => state.openComposerImageSheet);
  const openComposerRecipeSheet = useAppStore((state) => state.openComposerRecipeSheet);
  const setComposerImage = useAppStore((state) => state.setComposerImage);
  const clearComposerActiveRecipe = useAppStore((state) => state.clearComposerActiveRecipe);
  type Selection = { start: number; end: number };

  const [text, setText] = useState("");
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
  const [shouldScroll, setShouldScroll] = useState(false);
  const textRef = useRef("");
  const selectionRef = useRef<Selection>(EMPTY_SELECTION);
  const wasTypingAtEndRef = useRef(true);

  textRef.current = text;

  function keepCaretAtEnd(textLength: number) {
    const nextSelection = { start: textLength, end: textLength };
    selectionRef.current = nextSelection;

    requestAnimationFrame(() => {
      inputRef.current?.setNativeProps({ selection: nextSelection });
    });
  }

  function resetComposerInput() {
    setInputHeight(MIN_INPUT_HEIGHT);
    setShouldScroll(false);
    selectionRef.current = EMPTY_SELECTION;
    wasTypingAtEndRef.current = true;
  }

  useEffect(() => {
    if (text.length === 0) {
      resetComposerInput();
    }
  }, [text]);

  useEffect(() => {
    return () => setArchieComposerDraft("");
  }, [setArchieComposerDraft]);

  // Never leak a draft from one chat session into another.
  useEffect(() => {
    setText("");
    setArchieComposerDraft("");
    resetComposerInput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  useEffect(() => {
    if (composerFocusToken <= 0) return;
    inputRef.current?.focus();
  }, [composerFocusToken]);

  const disabled =
    assistantPhase === "loading" ||
    assistantPhase === "pick_recipe" ||
    assistantPhase === "pick_ingredient";
  const activeRecipeTitle = composerActiveRecipeId
    ? getRecipeById(composerActiveRecipeId)?.title
    : null;
  const canSend = (text.trim().length > 0 || Boolean(composerImageUri)) && !disabled;
  const showImagePill = !composerImageUri;
  const showRecipePill = !composerActiveRecipeId;
  const showAttachPills = showImagePill || showRecipePill;
  const placeholder =
    assistantPhase === "awaiting_substitute"
      ? "What do you have instead?"
      : composerImageUri
        ? "Add a note about this photo..."
        : composerActiveRecipeId
          ? "Ask about this recipe..."
          : "What are you cooking?";
  const sendBackground = isDark ? colors.text : "#111827";
  const sendIconColor = isDark ? colors.background : "#FFFFFF";

  async function handleSend() {
    if (!canSend) return;
    await Haptics.selectionAsync();
    const trimmed = text.trim();
    setText("");
    resetComposerInput();
    setArchieComposerDraft("");
    submitComposerMessage(trimmed);
  }

  function handleChangeText(value: string) {
    const previousLength = textRef.current.length;
    const typingAtEnd =
      wasTypingAtEndRef.current ||
      selectionRef.current.start === previousLength ||
      selectionRef.current.end === previousLength;

    setText(value);
    setArchieComposerDraft(value);

    if (typingAtEnd && value.length > 0) {
      keepCaretAtEnd(value.length);
    }
  }

  function handleSelectionChange(event: { nativeEvent: TextInputSelectionChangeEventData }) {
    const nextSelection = event.nativeEvent.selection;
    selectionRef.current = nextSelection;
    wasTypingAtEndRef.current =
      nextSelection.start === textRef.current.length && nextSelection.end === textRef.current.length;
  }

  const handleContentSizeChange = useCallback(
    (event: { nativeEvent: { contentSize: { height: number } } }) => {
      const contentHeight = event.nativeEvent.contentSize.height;
      const paddedHeight = contentHeight + INPUT_VERTICAL_PADDING;
      const nextHeight = Math.min(
        Math.max(paddedHeight, MIN_INPUT_HEIGHT),
        MAX_INPUT_HEIGHT
      );
      const nextShouldScroll = paddedHeight > MAX_INPUT_HEIGHT;

      setInputHeight(nextHeight);
      setShouldScroll(nextShouldScroll);

      if (wasTypingAtEndRef.current && textRef.current.length > 0) {
        keepCaretAtEnd(textRef.current.length);
      }
    },
    []
  );

  async function handleAddImage() {
    if (disabled) return;
    await Haptics.selectionAsync();
    openComposerImageSheet();
  }

  async function handleAttachRecipe() {
    if (disabled) return;
    await Haptics.selectionAsync();
    openComposerRecipeSheet();
  }

  async function handleRemoveImage() {
    await Haptics.selectionAsync();
    setComposerImage(null);
  }

  async function handleClearActiveRecipe() {
    await Haptics.selectionAsync();
    clearComposerActiveRecipe();
  }

  async function handleChangeRecipe() {
    if (disabled) return;
    await Haptics.selectionAsync();
    openComposerRecipeSheet();
  }

  return (
    <View style={styles.wrap}>
      {showAttachPills ? (
        <View style={styles.attachRow}>
          {showImagePill ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add image"
              disabled={disabled}
              onPress={handleAddImage}
              style={[
                styles.attachPill,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: disabled ? 0.5 : 1
                }
              ]}
            >
              <ImageIcon color={colors.text} />
              <AppText style={styles.attachPillLabel}>Add image</AppText>
            </Pressable>
          ) : null}
          {showRecipePill ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Attach recipe"
              disabled={disabled}
              onPress={handleAttachRecipe}
              style={[
                styles.attachPill,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: disabled ? 0.5 : 1
                }
              ]}
            >
              <RecipeIcon color={colors.text} />
              <AppText style={styles.attachPillLabel}>Attach recipe</AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {composerImageUri ? (
        <View style={[styles.previewChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image source={{ uri: composerImageUri }} style={styles.previewImage} />
          <View style={styles.previewCopy}>
            <AppText style={styles.previewLabel}>Photo attached</AppText>
            <AppText muted style={styles.previewHint}>
              Add a note or send as-is
            </AppText>
          </View>
          <Pressable accessibilityLabel="Remove photo" onPress={handleRemoveImage} style={styles.previewRemove}>
            <CloseIcon color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

      {activeRecipeTitle ? (
        <View style={[styles.contextChip, { backgroundColor: colors.canvas, borderColor: colors.border }]}>
          <AppText style={[styles.contextChipText, { color: colors.text }]}>
            Cooking: {activeRecipeTitle}
          </AppText>
          <Pressable accessibilityLabel="Change recipe" onPress={handleChangeRecipe} style={styles.contextChipAction}>
            <AppText style={[styles.contextChipActionText, { color: colors.muted }]}>Change</AppText>
          </Pressable>
          <Pressable accessibilityLabel="Remove recipe context" onPress={handleClearActiveRecipe} style={styles.contextChipRemove}>
            <CloseIcon color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

      <View
        style={[
          styles.composerCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight
          }
        ]}
      >
        <View style={styles.composerRow}>
          <TextInput
            ref={inputRef}
            editable={!disabled}
            multiline={true}
            placeholder={placeholder}
            placeholderTextColor={colors.faint}
            scrollEnabled={shouldScroll}
            style={[
              styles.textInput,
              {
                color: colors.text,
                fontFamily,
                height: inputHeight
              }
            ]}
            textAlignVertical="top"
            value={text}
            onChangeText={handleChangeText}
            onContentSizeChange={handleContentSizeChange}
            onSelectionChange={handleSelectionChange}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            disabled={!canSend}
            onPress={handleSend}
            style={[
              styles.sendBtn,
              {
                backgroundColor: sendBackground,
                opacity: canSend ? 1 : 0.35
              }
            ]}
          >
            <SendArrowIcon color={sendIconColor} />
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "stretch",
    gap: spacing.sm,
    width: "100%"
  },
  composerCard: {
    alignItems: "flex-end",
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: COMPOSER_CARD_MAX_HEIGHT,
    minHeight: COMPOSER_CARD_MIN_HEIGHT,
    paddingHorizontal: 15,
    paddingVertical: 11
  },
  composerRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%"
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    minHeight: MIN_INPUT_HEIGHT,
    maxHeight: MAX_INPUT_HEIGHT,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 0,
    fontSize: 17,
    lineHeight: 22,
    textAlignVertical: "top",
    ...(Platform.OS === "android" ? { includeFontPadding: false as const } : {})
  },
  attachRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  attachPill: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 34,
    paddingHorizontal: spacing.md,
    paddingVertical: 6
  },
  attachPillLabel: {
    fontFamily,
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: -0.1
  },
  previewChip: {
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  previewImage: {
    borderRadius: radius.md,
    height: 44,
    width: 44
  },
  previewIconWrap: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  previewCopy: {
    flex: 1,
    gap: 2
  },
  previewLabel: {
    fontFamily,
    fontSize: 11,
    fontWeight: "600"
  },
  previewHint: {
    fontFamily,
    fontSize: 9,
    lineHeight: 12
  },
  previewRemove: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 28
  },
  contextChip: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: 6
  },
  contextChipText: {
    fontFamily,
    fontSize: 11,
    fontWeight: "600"
  },
  contextChipAction: {
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  contextChipActionText: {
    fontFamily,
    fontSize: 10,
    fontWeight: "600"
  },
  contextChipRemove: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24
  },
  sendBtn: {
    alignSelf: "flex-end",
    alignItems: "center",
    borderRadius: 20,
    height: 36,
    justifyContent: "center",
    width: 36
  }
});
