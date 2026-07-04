import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

const SUBSTITUTES = [
  { label: "Greek yogurt", value: "Greek yogurt" },
  { label: "Milk", value: "Milk" },
  { label: "Coconut milk", value: "Coconut milk" },
  { label: "Something else", value: "__other__" }
] as const;

export function SubstitutePromptChips() {
  const { colors } = useAppTheme();
  const selectUserSubstitute = useAppStore((state) => state.selectUserSubstitute);
  const requestComposerFocus = useAppStore((state) => state.requestComposerFocus);

  async function handlePress(value: string) {
    await Haptics.selectionAsync();
    if (value === "__other__") {
      requestComposerFocus();
      return;
    }
    selectUserSubstitute(value);
  }

  return (
    <View style={styles.wrap}>
      {SUBSTITUTES.map((chip) => (
        <Pressable
          key={chip.label}
          accessibilityRole="button"
          onPress={() => handlePress(chip.value)}
          style={[styles.chip, { borderColor: colors.brandBorder, backgroundColor: colors.surface }]}
        >
          <AppText style={[styles.chipText, { color: colors.brandOnBrand }]}>{chip.label}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.sm
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  chipText: {
    fontFamily,
    fontSize: 13,
    fontWeight: "500"
  }
});
