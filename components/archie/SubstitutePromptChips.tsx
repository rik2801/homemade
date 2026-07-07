import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { findIngredientById } from "@/lib/swapFlow";
import { useAppTheme } from "@/hooks/useAppTheme";
import { requestSubstituteSuggestions } from "@/services/aiClient";
import { getFallbackSubstituteOptions } from "@/services/assistantService";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

const OTHER_VALUE = "__other__";

const suggestionCache = new Map<string, string[]>();

export function SubstitutePromptChips() {
  const { colors } = useAppTheme();
  const recipe = useAppStore((state) => state.recipe);
  const selectedIngredientId = useAppStore((state) => state.selectedIngredientId);
  const fallbackMode = useAppStore((state) => state.fallbackMode);
  const dietaryGoals = useAppStore((state) => state.dietaryGoals);
  const allergies = useAppStore((state) => state.allergies);
  const cookingFor = useAppStore((state) => state.cookingFor);
  const selectUserSubstitute = useAppStore((state) => state.selectUserSubstitute);
  const requestComposerFocus = useAppStore((state) => state.requestComposerFocus);

  const [options, setOptions] = useState<string[] | null>(null);

  const ingredient = selectedIngredientId
    ? findIngredientById(recipe, selectedIngredientId)
    : undefined;

  useEffect(() => {
    if (!ingredient) return;

    const cacheKey = `${recipe.id}:${ingredient.id}`;
    const cached = suggestionCache.get(cacheKey);
    if (cached) {
      setOptions(cached);
      return;
    }

    let cancelled = false;
    setOptions(null);

    const fallback = () => getFallbackSubstituteOptions(ingredient.label);

    if (fallbackMode) {
      setOptions(fallback());
      return;
    }

    requestSubstituteSuggestions(recipe, ingredient, { dietaryGoals, allergies, cookingFor })
      .then((response) => {
        if (cancelled) return;
        const labels = response.suggestions.map((item) => item.label).slice(0, 4);
        const resolved = labels.length > 0 ? labels : fallback();
        suggestionCache.set(cacheKey, resolved);
        setOptions(resolved);
      })
      .catch(() => {
        if (cancelled) return;
        setOptions(fallback());
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.id, ingredient?.id, fallbackMode]);

  async function handlePress(value: string) {
    await Haptics.selectionAsync();
    if (value === OTHER_VALUE) {
      requestComposerFocus();
      return;
    }
    selectUserSubstitute(value);
  }

  if (!ingredient) return null;

  if (!options) {
    return (
      <View style={styles.wrap}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.chip,
              styles.skeletonChip,
              { borderColor: colors.borderLight, backgroundColor: colors.canvas }
            ]}
          />
        ))}
      </View>
    );
  }

  const chips = [...options.map((label) => ({ label, value: label })), { label: "Something else", value: OTHER_VALUE }];

  return (
    <View style={styles.wrap}>
      {chips.map((chip) => (
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
  skeletonChip: {
    minWidth: 92
  },
  chipText: {
    fontFamily,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 20
  }
});
