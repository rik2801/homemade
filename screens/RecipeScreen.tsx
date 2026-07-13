import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { floatingTabBarScrollInset } from "@/components/layout/BottomTabBar";
import { IngredientsSection } from "@/components/recipe-details/IngredientsSection";
import { NutritionSummary, getNutritionItems } from "@/components/recipe-details/NutritionSummary";
import { PreparationSection } from "@/components/recipe-details/PreparationSection";
import { RECIPE_DETAILS_COLORS } from "@/components/recipe-details/recipeDetailsColors";
import { RecipeHero } from "@/components/recipe-details/RecipeHero";
import type { IngredientDisplayItem } from "@/components/recipe-details/recipeDetails.types";
import { useAppTheme } from "@/hooks/useAppTheme";
import { iconKeyForLabel } from "@/lib/swapFlow";
import { useAppStore } from "@/store/useAppStore";
import type { SubstitutionRecord } from "@/types/recipe";

type RecipeScreenProps = {
  showBack?: boolean;
};

const EMPTY_SUBSTITUTIONS: Record<string, SubstitutionRecord> = {};

export function RecipeScreen({ showBack: _showBack = false }: RecipeScreenProps) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const recipe = useAppStore((state) => state.recipe);
  const displaySteps = useAppStore((state) => state.displaySteps);
  const openSwapSheet = useAppStore((state) => state.openSwapSheet);
  const appliedSubstitutions = useAppStore(
    (state) => state.appliedSubstitutions[state.recipe.id] ?? EMPTY_SUBSTITUTIONS
  );
  const selectedIngredientId = useAppStore((state) => state.selectedIngredientId);
  const assistantContext = useAppStore((state) => state.assistantContext);
  const justAppliedId = useAppStore((state) => state.justAppliedId);
  const assistantPhase = useAppStore((state) => state.assistantPhase);
  const pageBackground = isDark ? colors.background : RECIPE_DETAILS_COLORS.background;

  useEffect(() => {
    if (justAppliedId) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 280, animated: true });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [justAppliedId]);

  async function handleSwapPress() {
    if (assistantPhase === "loading") return;
    await Haptics.selectionAsync();
    openSwapSheet();
  }

  const nutritionItems = useMemo(
    () => getNutritionItems(recipe.servings, recipe.nutrition.macros),
    [recipe.nutrition.macros, recipe.servings]
  );

  const ingredientItems = useMemo((): IngredientDisplayItem[] => {
    return recipe.ingredients.map((ingredient) => {
      const sub = appliedSubstitutions[ingredient.id];
      const isSelected =
        assistantContext === "recipe" && selectedIngredientId === ingredient.id && !sub;
      const isJustApplied = justAppliedId === ingredient.id;
      const isUpdated = Boolean(sub);

      return {
        id: ingredient.id,
        label: sub ? sub.currentItem : ingredient.label,
        amount: sub ? sub.currentAmount : ingredient.amount,
        icon: sub ? iconKeyForLabel(sub.currentItem, ingredient.icon) : ingredient.icon,
        isUpdated,
        isHighlighted: isSelected || isJustApplied || isUpdated,
        showSwapDot: isUpdated
      };
    });
  }, [
    appliedSubstitutions,
    assistantContext,
    justAppliedId,
    recipe.ingredients,
    selectedIngredientId
  ]);

  return (
    <View style={[styles.screen, { backgroundColor: pageBackground }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: floatingTabBarScrollInset(insets.bottom) + 32 }
        ]}
        style={{ backgroundColor: pageBackground }}
      >
        <RecipeHero
          title={recipe.title}
          subtitle={recipe.subtitle}
          dietaryBadges={recipe.dietaryBadges}
          recipeId={recipe.id}
          cookTime={recipe.cookTime}
        />

        <NutritionSummary items={nutritionItems} />

        <IngredientsSection
          ingredients={ingredientItems}
          onSwapPress={handleSwapPress}
          swapDisabled={assistantPhase === "loading"}
        />

        <PreparationSection
          steps={displaySteps}
          originalSteps={recipe.steps}
          justAppliedId={justAppliedId}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1
  }
});
