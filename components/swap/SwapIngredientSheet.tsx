import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { AppText } from "@/components/primitives/AppText";
import { IngredientIcon } from "@/components/recipe/IngredientIcon";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

export function SwapIngredientSheet() {
  const { colors } = useAppTheme();
  const visible = useAppStore((state) => state.swapSheetVisible);
  const closeSwapSheet = useAppStore((state) => state.closeSwapSheet);
  const selectIngredientForSwap = useAppStore((state) => state.selectIngredientForSwap);
  const recipe = useAppStore((state) => state.recipe);
  const hasSubstitution = useAppStore((state) => state.hasSubstitution);

  async function handleSelect(ingredientId: string) {
    if (hasSubstitution(ingredientId)) return;
    await Haptics.selectionAsync();
    selectIngredientForSwap(ingredientId);
  }

  return (
    <BottomSheet visible={visible} onClose={closeSwapSheet} title="Swap an ingredient">
      <AppText muted style={styles.hint}>
        Choose an ingredient to replace.
      </AppText>
      <View style={styles.list}>
        {recipe.ingredients.map((ingredient) => {
          const swapped = hasSubstitution(ingredient.id);

          return (
            <Pressable
              key={ingredient.id}
              accessibilityRole="button"
              disabled={swapped}
              onPress={() => handleSelect(ingredient.id)}
              style={[
                styles.option,
                {
                  borderColor: colors.border,
                  backgroundColor: swapped ? colors.canvas : colors.surface,
                  opacity: swapped ? 0.5 : 1
                }
              ]}
            >
              <IngredientIcon icon={ingredient.icon} showSwapDot={swapped} />
              <View style={styles.body}>
                <AppText style={styles.name}>{ingredient.label}</AppText>
                <AppText variant="caption" muted>
                  {ingredient.amount}
                </AppText>
              </View>
              {swapped ? (
                <View style={[styles.badge, { backgroundColor: colors.greenSoft }]}>
                  <AppText variant="caption" style={{ color: colors.green, fontFamily }}>
                    Swapped
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20
  },
  list: {
    gap: spacing.sm
  },
  option: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12
  },
  body: {
    flex: 1,
    gap: 2
  },
  name: {
    fontFamily,
    fontSize: 15,
    fontWeight: "500"
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4
  }
});
