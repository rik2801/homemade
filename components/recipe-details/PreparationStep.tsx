import { View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { recipeDetailsStyles as styles } from "./recipeDetails.styles";
import type { PreparationStepProps } from "./recipeDetails.types";

export function PreparationStep({ index, text, isChanged, isLast }: PreparationStepProps) {
  return (
    <View
      style={[
        styles.preparationStep,
        !isLast ? styles.preparationStepBorder : null,
        isChanged ? styles.preparationStepChanged : null
      ]}
    >
      <View style={styles.stepNumber}>
        <AppText style={styles.stepNumberText}>{index + 1}</AppText>
      </View>
      <AppText style={styles.stepText}>{text}</AppText>
    </View>
  );
}
