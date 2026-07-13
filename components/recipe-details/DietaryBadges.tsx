import { View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { recipeDetailsStyles as styles } from "./recipeDetails.styles";
import type { DietaryBadgesProps } from "./recipeDetails.types";

export function DietaryBadges({ badges }: DietaryBadgesProps) {
  if (badges.length === 0) return null;

  return (
    <View style={styles.badges}>
      {badges.map((badge) => (
        <View key={badge} style={styles.badge}>
          <AppText style={styles.badgeText}>{badge}</AppText>
        </View>
      ))}
    </View>
  );
}
