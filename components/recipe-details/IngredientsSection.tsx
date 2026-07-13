import { Pressable, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { IngredientItem } from "./IngredientItem";
import { RECIPE_DETAILS_COLORS } from "./recipeDetailsColors";
import { recipeDetailsStyles as styles } from "./recipeDetails.styles";
import type { IngredientDisplayItem, IngredientsSectionProps } from "./recipeDetails.types";

function SwapIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M16 3h5v5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 20 21 3" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 16v5h-5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 15 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function chunkIngredients(items: IngredientDisplayItem[]) {
  const rows: IngredientDisplayItem[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

export function IngredientsSection({
  ingredients,
  onSwapPress,
  swapDisabled = false
}: IngredientsSectionProps) {
  const rows = chunkIngredients(ingredients);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <AppText style={styles.sectionTitle}>Ingredients</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Swap an ingredient"
          disabled={swapDisabled}
          onPress={onSwapPress}
          style={({ pressed }) => [
            styles.outlineButton,
            {
              opacity: swapDisabled ? 0.5 : pressed ? 0.72 : 1,
              transform: [{ scale: pressed && !swapDisabled ? 0.98 : 1 }]
            }
          ]}
        >
          <SwapIcon color={RECIPE_DETAILS_COLORS.textPrimary} />
          <AppText style={styles.outlineButtonLabel}>Swap</AppText>
        </Pressable>
      </View>

      <View style={styles.ingredientsGrid}>
        {rows.map((row) => (
          <View key={row.map((item) => item.id).join("-")} style={styles.ingredientsRow}>
            {row.map((ingredient) => (
              <View key={ingredient.id} style={styles.ingredientCell}>
                <IngredientItem {...ingredient} />
              </View>
            ))}
            {row.length === 1 ? <View style={styles.ingredientCellEmpty} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}
