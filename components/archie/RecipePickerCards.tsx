import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { SoupHeroIllustration } from "@/components/recipe/SoupHeroIllustration";
import { RECIPE_CATALOG } from "@/features/recipe/data/homemadeRecipe";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

export function RecipePickerCards() {
  const { colors } = useAppTheme();
  const selectRecipeForSwap = useAppStore((state) => state.selectRecipeForSwap);

  async function handleSelect(recipeId: string, available: boolean) {
    if (!available) return;
    await Haptics.selectionAsync();
    selectRecipeForSwap(recipeId);
  }

  return (
    <View style={styles.wrap}>
      {RECIPE_CATALOG.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          disabled={!item.available}
          onPress={() => handleSelect(item.id, item.available)}
          style={[
            styles.card,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              opacity: item.available ? 1 : 0.48
            }
          ]}
        >
          <View style={[styles.thumb, { backgroundColor: colors.surfaceWarm }]}>
            <SoupHeroIllustration recipeId={item.id} height={40} />
          </View>
          <View style={styles.body}>
            <AppText style={styles.title}>{item.title}</AppText>
            <AppText style={[styles.meta, { color: colors.faint }]}>
              {item.servings} servings · {item.guidelines.join(" · ")}
            </AppText>
          </View>
          {!item.available ? (
            <View style={[styles.soon, { borderColor: colors.border, backgroundColor: colors.canvas }]}>
              <AppText style={[styles.soonText, { color: colors.faint }]}>Soon</AppText>
            </View>
          ) : null}
        </Pressable>
      ))}
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
    borderRadius: 8,
    height: 40,
    overflow: "hidden",
    width: 52
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
  soon: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  soonText: {
    fontFamily,
    fontSize: 7,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase"
  }
});
