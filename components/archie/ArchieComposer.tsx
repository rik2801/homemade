import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

function UploadIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v10"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="m8 7 4-4 4 4"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="M4 15v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
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

export const ARCHIE_COMPOSER_ESTIMATED_HEIGHT = 128;
const ARCHIE_COMPOSER_BOTTOM_TRIM = 0.2;
const ARCHIE_COMPOSER_BOTTOM_LIFT = 0.2;

export function archieComposerBottomOffset(bottomInset: number) {
  const base = Math.max(bottomInset, spacing.sm) + spacing.lg;
  return Math.max(spacing.xs, Math.round(base * (ARCHIE_COMPOSER_BOTTOM_TRIM + ARCHIE_COMPOSER_BOTTOM_LIFT)));
}

export function archieComposerScrollInset(bottomInset: number) {
  return ARCHIE_COMPOSER_ESTIMATED_HEIGHT + archieComposerBottomOffset(bottomInset) + spacing.sm;
}

export function ArchieComposer() {
  const { colors, isDark } = useAppTheme();
  const inputRef = useRef<TextInput>(null);
  const assistantPhase = useAppStore((state) => state.assistantPhase);
  const composerFocusToken = useAppStore((state) => state.composerFocusToken);
  const setArchieComposerDraft = useAppStore((state) => state.setArchieComposerDraft);
  const submitAssistantInput = useAppStore((state) => state.submitAssistantInput);
  const [text, setText] = useState("");

  useEffect(() => {
    return () => setArchieComposerDraft("");
  }, [setArchieComposerDraft]);

  useEffect(() => {
    if (composerFocusToken <= 0) return;
    inputRef.current?.focus();
  }, [composerFocusToken]);

  const disabled =
    assistantPhase === "loading" ||
    assistantPhase === "pick_recipe" ||
    assistantPhase === "pick_ingredient";
  const canSend = text.trim().length > 0 && !disabled;
  const placeholder =
    assistantPhase === "awaiting_substitute" ? "What do you have instead?" : "Describe the dish...";
  const sendBackground = isDark ? colors.text : "#111827";
  const sendIconColor = isDark ? colors.background : "#FFFFFF";

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    await Haptics.selectionAsync();
    setText("");
    setArchieComposerDraft("");
    submitAssistantInput(trimmed);
  }

  function handleChangeText(value: string) {
    setText(value);
    setArchieComposerDraft(value);
  }

  async function handleUpload() {
    if (disabled) return;
    await Haptics.selectionAsync();
  }

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
            shadowColor: colors.shadow
          }
        ]}
      >
        <TextInput
          ref={inputRef}
          editable={!disabled}
          multiline
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          style={[styles.input, { color: colors.text, fontFamily }]}
          textAlignVertical="top"
          value={text}
          onChangeText={handleChangeText}
        />
        <View style={styles.toolbar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Upload"
            disabled={disabled}
            onPress={handleUpload}
            style={[
              styles.uploadBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: disabled ? 0.5 : 1
              }
            ]}
          >
            <UploadIcon color={colors.text} />
            <AppText style={styles.uploadLabel}>Upload</AppText>
          </Pressable>
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
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "stretch",
    width: "100%"
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    minHeight: 80,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20
  },
  input: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 17,
    maxHeight: 120,
    minHeight: 48,
    padding: 0
  },
  toolbar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  uploadBtn: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 38,
    paddingHorizontal: spacing.md,
    paddingVertical: 7
  },
  uploadLabel: {
    fontFamily,
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: -0.1
  },
  sendBtn: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  }
});
