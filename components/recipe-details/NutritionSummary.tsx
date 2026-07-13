import { Fragment } from "react";
import { View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { recipeDetailsStyles as styles } from "./recipeDetails.styles";
import type { NutritionSummaryProps } from "./recipeDetails.types";

function formatNutritionValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const text = String(value).trim();
  return text.length > 0 ? text : "—";
}

export function getNutritionItems(servings: number, macros: { label: string; value: string }[]) {
  const byLabel = new Map(macros.map((macro) => [macro.label.toLowerCase(), macro.value]));

  return [
    {
      key: "servings",
      value: formatNutritionValue(servings),
      label: "Servings"
    },
    {
      key: "kcal",
      value: formatNutritionValue(byLabel.get("kcal") ?? byLabel.get("calories")),
      label: "kcal"
    },
    {
      key: "protein",
      value: formatNutritionValue(byLabel.get("protein")),
      label: "Protein"
    },
    {
      key: "fibre",
      value: formatNutritionValue(byLabel.get("fibre") ?? byLabel.get("fiber")),
      label: "Fibre"
    },
    {
      key: "sugar",
      value: formatNutritionValue(byLabel.get("sugar")),
      label: "Sugar"
    }
  ];
}

export function NutritionSummary({ items }: NutritionSummaryProps) {
  return (
    <View style={styles.nutritionCard} accessibilityRole="summary">
      {items.map((item, index) => (
        <Fragment key={item.key}>
          {index > 0 ? <View style={styles.nutritionSeparator} /> : null}
          <View style={styles.nutritionItem}>
            <AppText style={styles.nutritionValue}>{item.value}</AppText>
            <AppText style={styles.nutritionLabel}>{item.label}</AppText>
          </View>
        </Fragment>
      ))}
    </View>
  );
}
