import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { Card } from "@/components/primitives/Card";
import { FoodCanvas } from "@/components/recipe/FoodCanvas";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radius, spacing } from "@/theme/spacing";
import type { Recipe } from "@/types/recipe";

type HeroCardProps = {
  recipe: Recipe;
};

export function HeroCard({ recipe }: HeroCardProps) {
  const { colors } = useAppTheme();

  return (
    <Card style={styles.card}>
      <FoodCanvas />
      <AppText muted style={styles.subtitle}>
        {recipe.subtitle}
      </AppText>
      <View style={styles.stats}>
        {[
          ["Prep", recipe.prepTime],
          ["Cook", recipe.cookTime],
          ["Serves", String(recipe.servings)]
        ].map(([label, value]) => (
          <View key={label} style={[styles.stat, { backgroundColor: colors.surfaceWarm }]}>
            <AppText variant="caption" muted>
              {label}
            </AppText>
            <AppText style={styles.statValue}>{value}</AppText>
          </View>
        ))}
      </View>
      <View style={styles.tags}>
        {recipe.dietaryBadges.map((constraint) => (
          <View key={constraint} style={[styles.tag, { backgroundColor: colors.surfaceSage }]}>
            <AppText variant="caption" style={{ color: colors.basil }}>
              {constraint}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg
  },
  subtitle: {
    marginTop: spacing.xs
  },
  stats: {
    flexDirection: "row",
    gap: spacing.sm
  },
  stat: {
    flex: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  statValue: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 20,
    marginTop: 4
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  tag: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8
  }
});
