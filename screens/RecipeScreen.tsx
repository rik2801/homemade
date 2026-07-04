import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { IngredientIcon } from "@/components/recipe/IngredientIcon";
import { SoupHeroIllustration } from "@/components/recipe/SoupHeroIllustration";
import { isSwapDemoRecipe } from "@/features/recipe/data/homemadeRecipe";
import type { RecipeId } from "@/features/recipe/data/homemadeRecipe";
import { iconKeyForLabel } from "@/lib/swapFlow";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { layout, radius, spacing } from "@/theme/spacing";

type RecipeScreenProps = {
  showBack?: boolean;
};

export function RecipeScreen({ showBack = false }: RecipeScreenProps) {
  const { colors } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  const recipe = useAppStore((state) => state.recipe);
  const setRecipesView = useAppStore((state) => state.setRecipesView);
  const displaySteps = useAppStore((state) => state.displaySteps);
  const openSwapSheet = useAppStore((state) => state.openSwapSheet);
  const appliedSubstitutions = useAppStore((state) => state.appliedSubstitutions);
  const selectedIngredientId = useAppStore((state) => state.selectedIngredientId);
  const assistantContext = useAppStore((state) => state.assistantContext);
  const justAppliedId = useAppStore((state) => state.justAppliedId);
  const assistantPhase = useAppStore((state) => state.assistantPhase);

  useEffect(() => {
    if (justAppliedId) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 280, animated: true });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [justAppliedId]);

  async function handleSwapPress() {
    if (assistantPhase === "loading" || !isSwapDemoRecipe(recipe.id)) return;
    await Haptics.selectionAsync();
    openSwapSheet();
  }

  async function handleBack() {
    await Haptics.selectionAsync();
    setRecipesView("list");
  }

  const swapEnabled = isSwapDemoRecipe(recipe.id);

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={{ backgroundColor: colors.background }}
    >
      {showBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Back to recipes" onPress={handleBack} style={styles.backRow}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2}>
            <Path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <AppText style={styles.backLabel}>All recipes</AppText>
        </Pressable>
      ) : null}

      <View style={styles.hero}>
        <AppText variant="title">{recipe.title}</AppText>
        <AppText muted style={styles.subtitle}>
          {recipe.subtitle}
        </AppText>
        <View style={styles.chips}>
          {recipe.dietaryBadges.map((badge) => (
            <View key={badge} style={[styles.chip, { borderColor: colors.brandBorder, backgroundColor: colors.brandSoft }]}>
              <AppText style={[styles.chipText, { color: colors.brandOnBrand }]}>{badge}</AppText>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.photoCard, { borderColor: colors.border }]}>
        <SoupHeroIllustration recipeId={recipe.id as RecipeId} />
        <View style={[styles.macros, { borderTopColor: colors.border }]}>
          <MacroItem label="Servings" value={String(recipe.servings)} isLast={false} />
          {recipe.nutrition.macros.map((macro, index) => (
            <MacroItem
              key={macro.label}
              label={macro.label}
              value={macro.value}
              isLast={index === recipe.nutrition.macros.length - 1}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={[styles.sectionHead, { borderBottomColor: colors.border }]}>
          <AppText variant="section">Ingredients</AppText>
          {swapEnabled ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Swap an ingredient"
              onPress={handleSwapPress}
              style={[styles.swapBtn, { borderColor: colors.brandBorder, backgroundColor: colors.surface }]}
            >
              <Svg width={10} height={10} viewBox="0 0 24 24" stroke={colors.brandOnBrand} fill="none" strokeWidth={2}>
                <Path d="M16 3h5v5" />
                <Path d="M4 20 21 3" />
                <Path d="M21 16v5h-5" />
                <Path d="M15 15 3 3" />
              </Svg>
              <AppText style={[styles.swapLabel, { color: colors.brandOnBrand }]}>Swap</AppText>
            </Pressable>
          ) : (
            <View style={styles.sectionSpacer} />
          )}
        </View>

        <View style={styles.ingGrid}>
          {recipe.ingredients.map((ingredient) => {
            const sub = appliedSubstitutions[ingredient.id];
            const isSelected =
              assistantContext === "recipe" && selectedIngredientId === ingredient.id && !sub;
            const isJustApplied = justAppliedId === ingredient.id;
            const displayLabel = sub ? sub.currentItem : ingredient.label;
            const displayAmount = sub ? sub.currentAmount : ingredient.amount;
            const displayIcon = sub
              ? iconKeyForLabel(sub.currentItem, ingredient.icon)
              : ingredient.icon;

            const isUpdated = Boolean(sub);
            const isHighlighted = isSelected || isJustApplied || isUpdated;

            return (
              <View
                key={ingredient.id}
                style={[
                  styles.ingRow,
                  isHighlighted
                    ? {
                        backgroundColor: colors.brandSoft,
                        borderColor: colors.brandBorder,
                        borderWidth: 1.5,
                        borderRadius: radius.md,
                        padding: 4
                      }
                    : null
                ]}
              >
                <IngredientIcon icon={displayIcon} showSwapDot={Boolean(sub)} />
                <View style={styles.ingBody}>
                  <View style={styles.ingTitleRow}>
                    <AppText style={styles.ingName} numberOfLines={2}>
                      {displayLabel}
                    </AppText>
                    {isUpdated ? (
                      <View style={[styles.updatedBadge, { backgroundColor: colors.brand }]}>
                        <AppText style={[styles.updatedText, { color: colors.brandOnBrand }]}>Updated</AppText>
                      </View>
                    ) : null}
                  </View>
                  <AppText style={[styles.ingAmt, { color: colors.faint }]}>{displayAmount}</AppText>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.sectionPrep}>
        <View style={[styles.sectionHead, { borderBottomColor: colors.border }]}>
          <AppText variant="section">Preparation</AppText>
          <View style={styles.sectionSpacer} />
        </View>
        <View style={styles.steps}>
          {displaySteps.map((step, index) => {
            const isChanged =
              justAppliedId &&
              index === recipe.substitutionStepIndex &&
              appliedSubstitutions[recipe.substitutionIngredientId];

            return (
              <View
                key={`${index}-${step}`}
                style={[
                  styles.stepRow,
                  isChanged
                    ? {
                        backgroundColor: colors.brandSoft,
                        borderRadius: radius.md,
                        marginHorizontal: -4,
                        paddingHorizontal: 4
                      }
                    : null
                ]}
              >
                <AppText style={[styles.stepNum, { color: colors.faint }]}>{index + 1}</AppText>
                <AppText style={[styles.stepText, { color: colors.muted }]}>{step}</AppText>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

function MacroItem({ label, value, isLast }: { label: string; value: string; isLast: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.macro, !isLast ? { borderRightColor: colors.borderLight, borderRightWidth: StyleSheet.hairlineWidth } : null]}>
      <AppText style={styles.macroVal}>{value}</AppText>
      <AppText style={[styles.macroLbl, { color: colors.faint }]}>{label.toUpperCase()}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: layout.screenPadding
  },
  backRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: spacing.sm,
    paddingTop: spacing.sm
  },
  backLabel: {
    fontFamily,
    fontSize: 14,
    fontWeight: "500"
  },
  hero: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingTop: 15
  },
  subtitle: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  chipText: {
    fontFamily,
    fontSize: 10,
    fontWeight: "500"
  },
  photoCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden"
  },
  macros: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    paddingBottom: 11,
    paddingHorizontal: 4,
    paddingTop: 10
  },
  macro: {
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4
  },
  macroVal: {
    color: "#111827",
    fontFamily,
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: -0.3,
    lineHeight: 16
  },
  macroLbl: {
    fontFamily,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    lineHeight: 12,
    marginTop: 3,
    textTransform: "uppercase"
  },
  section: {
    marginTop: spacing.xxl
  },
  sectionPrep: {
    marginBottom: spacing.sm,
    marginTop: spacing.xxl
  },
  sectionHead: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    minHeight: 44,
    paddingBottom: 12
  },
  sectionSpacer: {
    width: 26
  },
  swapBtn: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    height: 28,
    justifyContent: "center",
    paddingHorizontal: 10
  },
  swapLabel: {
    fontFamily,
    fontSize: 11,
    fontWeight: "600"
  },
  ingGrid: {
    columnGap: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 4
  },
  ingRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 4,
    paddingVertical: 6,
    width: "48.5%"
  },
  ingBody: {
    flex: 1,
    gap: 1,
    minWidth: 0
  },
  ingTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4
  },
  updatedBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  updatedText: {
    fontFamily,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase"
  },
  ingName: {
    fontFamily,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: -0.1,
    lineHeight: 16
  },
  ingAmt: {
    fontFamily,
    fontSize: 11,
    lineHeight: 13,
    marginTop: 1
  },
  steps: {
    paddingBottom: spacing.sm
  },
  stepRow: {
    flexDirection: "row",
    paddingBottom: 10,
    paddingLeft: 22,
    paddingTop: 10,
    position: "relative"
  },
  stepNum: {
    fontFamily,
    fontSize: 12,
    fontWeight: "600",
    left: 0,
    position: "absolute",
    top: 10
  },
  stepText: {
    flex: 1,
    fontFamily,
    fontSize: 15,
    lineHeight: 23
  }
});
