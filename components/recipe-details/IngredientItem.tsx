import { View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { IngredientIcon } from "@/components/recipe/IngredientIcon";
import { recipeDetailsStyles as styles } from "./recipeDetails.styles";
import type { IngredientItemProps } from "./recipeDetails.types";

export function IngredientItem({
  label,
  amount,
  icon,
  isUpdated,
  isHighlighted,
  showSwapDot
}: IngredientItemProps) {
  return (
    <View style={[styles.ingredientItem, isHighlighted ? styles.ingredientItemHighlighted : null]}>
      <IngredientIcon icon={icon} size={36} showSwapDot={showSwapDot} />
      <View style={styles.ingredientText}>
        <View style={styles.ingredientTitleRow}>
          <AppText style={styles.ingredientName} numberOfLines={2}>
            {label}
          </AppText>
          {isUpdated ? (
            <View style={styles.updatedBadge}>
              <AppText style={styles.updatedBadgeText}>Updated</AppText>
            </View>
          ) : null}
        </View>
        <AppText style={styles.ingredientAmount}>{amount}</AppText>
      </View>
    </View>
  );
}
