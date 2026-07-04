import * as Haptics from "expo-haptics";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, Layout } from "react-native-reanimated";
import { AppText } from "@/components/primitives/AppText";
import { PressableScale } from "@/components/primitives/PressableScale";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radius, spacing } from "@/theme/spacing";
import type { Ingredient, SubstitutionOption } from "@/types/recipe";

type IngredientRowProps = {
  ingredient: Ingredient;
  isSwapped: boolean;
  selectedSwap: SubstitutionOption | null;
  onSwap: () => void;
};

export function IngredientRow({ ingredient, isSwapped, selectedSwap, onSwap }: IngredientRowProps) {
  const { colors } = useAppTheme();

  async function handleSwap() {
    await Haptics.selectionAsync();
    onSwap();
  }

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      layout={Layout.springify().damping(18).stiffness(180)}
      style={[
        styles.row,
        {
          backgroundColor: isSwapped ? colors.surfaceSage : colors.surfaceWarm,
          borderColor: isSwapped ? colors.basil : colors.border
        }
      ]}
    >
      <View style={styles.copy}>
        <AppText variant="caption" style={{ color: colors.tomato }}>
          {ingredient.amount}
        </AppText>
        <AppText style={styles.label}>{ingredient.label}</AppText>
        {isSwapped && selectedSwap ? (
          <AppText variant="caption" style={{ color: colors.basil, marginTop: 6 }}>
            Replaced {ingredient.originalLabel}. {selectedSwap.dietaryFit}
          </AppText>
        ) : null}
      </View>
      {ingredient.swappable ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Swap heavy cream"
          onPress={handleSwap}
          style={[styles.button, { backgroundColor: colors.tomato }]}
        >
          <AppText variant="caption" style={styles.buttonText}>
            Swap
          </AppText>
        </PressableScale>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 72,
    padding: spacing.md
  },
  copy: {
    flex: 1
  },
  label: {
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 3
  },
  button: {
    borderRadius: radius.pill,
    paddingHorizontal: 17,
    paddingVertical: 11
  },
  buttonText: {
    color: "#FFFDF7"
  }
});
