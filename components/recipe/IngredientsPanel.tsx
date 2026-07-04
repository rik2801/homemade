import { StyleSheet, View } from "react-native";
import { Card } from "@/components/primitives/Card";
import { IngredientRow } from "@/components/recipe/IngredientRow";
import { SectionHeader } from "@/components/recipe/SectionHeader";
import { spacing } from "@/theme/spacing";
import type { Ingredient, Recipe, SubstitutionOption } from "@/types/recipe";

type IngredientsPanelProps = {
  recipe: Recipe;
  ingredients: Ingredient[];
  selectedSwap: SubstitutionOption | null;
  onOpenAssistant: () => void;
};

export function IngredientsPanel({
  recipe,
  ingredients,
  selectedSwap,
  onOpenAssistant
}: IngredientsPanelProps) {
  return (
    <Card>
      <SectionHeader title="Ingredients" detail="partner-approved" />
      <View style={styles.stack}>
        {ingredients.map((ingredient) => (
          <IngredientRow
            key={`${ingredient.id}-${ingredient.label}`}
            ingredient={ingredient}
            isSwapped={Boolean(selectedSwap && ingredient.id === recipe.substitutionIngredientId)}
            selectedSwap={selectedSwap}
            onSwap={onOpenAssistant}
          />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.sm,
    marginTop: spacing.md
  }
});
