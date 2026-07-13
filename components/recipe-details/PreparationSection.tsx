import { View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { PreparationStep } from "./PreparationStep";
import { recipeDetailsStyles as styles } from "./recipeDetails.styles";
import type { PreparationSectionProps } from "./recipeDetails.types";

/**
 * TODO: Connect a "Step-by-step mode" outline button here when a cooking-mode
 * flow exists in the app. Do not render a non-functional control.
 */
export function PreparationSection({
  steps,
  originalSteps,
  justAppliedId
}: PreparationSectionProps) {
  return (
    <>
      <View style={styles.prepDivider} />
      <View style={styles.prepSection}>
        <View style={styles.sectionHead}>
          <AppText style={styles.sectionTitle}>Preparation</AppText>
        </View>

        <View>
          {steps.map((step, index) => {
            const isChanged = Boolean(justAppliedId) && step !== originalSteps[index];
            return (
              <PreparationStep
                key={`${index}-${step}`}
                index={index}
                text={step}
                isChanged={isChanged}
                isLast={index === steps.length - 1}
              />
            );
          })}
        </View>
      </View>
    </>
  );
}
