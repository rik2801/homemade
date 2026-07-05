import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { IngredientIcon } from "@/components/recipe/IngredientIcon";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

export function IngredientPickerCards() {
  const { colors } = useAppTheme();
  const recipe = useAppStore((state) => state.recipe);
  const hasSubstitution = useAppStore((state) => state.hasSubstitution);
  const selectIngredientForConversation = useAppStore((state) => state.selectIngredientForConversation);

  async function handleSelect(ingredientId: string) {
    if (hasSubstitution(ingredientId)) return;
    await Haptics.selectionAsync();
    selectIngredientForConversation(ingredientId);
  }

  return (
    <View style={styles.wrap}>
      {recipe.ingredients.map((ingredient) => {
        const swapped = hasSubstitution(ingredient.id);

        return (
          <Pressable
            key={ingredient.id}
            accessibilityRole="button"
            disabled={swapped}
            onPress={() => handleSelect(ingredient.id)}
            style={[
              styles.card,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                opacity: swapped ? 0.48 : 1
              }
            ]}
          >
            <View style={[styles.thumb, { backgroundColor: colors.surfaceWarm }]}>
              <IngredientIcon icon={ingredient.icon} showSwapDot={swapped} />
            </View>
            <View style={styles.body}>
              <AppText style={styles.title}>{ingredient.label}</AppText>
              <AppText style={[styles.meta, { color: colors.faint }]}>{ingredient.amount}</AppText>
            </View>
            {swapped ? (
              <View style={[styles.badge, { backgroundColor: colors.greenSoft }]}>
                <AppText style={[styles.badgeText, { color: colors.green }]}>Swapped</AppText>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  card: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  thumb: {
    alignItems: "center",
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  body: {
    flex: 1,
    gap: 3
  },
  title: {
    fontFamily,
    fontSize: 10,
    fontWeight: "600"
  },
  meta: {
    fontFamily,
    fontSize: 8,
    lineHeight: 11
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  badgeText: {
    fontFamily,
    fontSize: 7,
    fontWeight: "600"
  }
});
