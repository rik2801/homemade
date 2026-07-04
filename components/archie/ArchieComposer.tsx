import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { layout, radius, spacing } from "@/theme/spacing";

export function ArchieComposer() {
  const { colors } = useAppTheme();
  const inputRef = useRef<TextInput>(null);
  const assistantPhase = useAppStore((state) => state.assistantPhase);
  const composerFocusToken = useAppStore((state) => state.composerFocusToken);
  const submitAssistantInput = useAppStore((state) => state.submitAssistantInput);
  const [text, setText] = useState("");

  useEffect(() => {
    if (composerFocusToken <= 0) return;
    inputRef.current?.focus();
  }, [composerFocusToken]);

  const disabled = assistantPhase === "loading" || assistantPhase === "pick_recipe";
  const placeholder =
    assistantPhase === "awaiting_substitute" ? "What do you have instead?" : "Ask about an ingredient…";

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    await Haptics.selectionAsync();
    setText("");
    submitAssistantInput(trimmed);
  }

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: spacing.sm,
          backgroundColor: "rgba(255, 252, 247, 0.96)",
          borderTopColor: colors.borderLight
        }
      ]}
    >
      <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <TextInput
          ref={inputRef}
          editable={!disabled}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          returnKeyType="send"
          style={[styles.input, { color: colors.text, fontFamily }]}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          disabled={disabled}
          onPress={handleSend}
          style={[styles.sendBtn, { backgroundColor: colors.brand, opacity: disabled ? 0.5 : 1 }]}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.brandOnBrand} strokeWidth={2}>
            <Path d="m22 2-7 20-4-9-9-4Z" />
            <Path d="M22 2 11 13" />
          </Svg>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm
  },
  inputRow: {
    alignItems: "center",
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: 4,
    paddingVertical: 4
  },
  input: {
    flex: 1,
    fontSize: 15,
    minHeight: 44,
    paddingVertical: 8
  },
  sendBtn: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  }
});
