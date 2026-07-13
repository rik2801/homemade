import { useWindowDimensions, View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { SoupHeroIllustration } from "@/components/recipe/SoupHeroIllustration";
import type { RecipeId } from "@/features/recipe/data/homemadeRecipe";
import { DietaryBadges } from "./DietaryBadges";
import { recipeDetailsStyles as styles } from "./recipeDetails.styles";
import type { RecipeHeroProps } from "./recipeDetails.types";

export function RecipeHero({ title, subtitle, dietaryBadges, recipeId }: RecipeHeroProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 375;
  const imageSize = Math.min(isCompact ? width * 0.48 : width * 0.52, 220);
  const glowSize = imageSize + 18;
  // Keep ~3.5/4 of the circle on-screen; clip only the right edge.
  const imageBleed = Math.round(imageSize * 0.125);

  return (
    <View style={styles.hero}>
      <View style={styles.heroTextColumn}>
        <AppText
          accessibilityRole="header"
          style={[styles.title, isCompact ? styles.titleCompact : null]}
        >
          {title}
        </AppText>
        <AppText style={styles.subtitle}>{subtitle}</AppText>
        <DietaryBadges badges={dietaryBadges} />
      </View>

      <View style={styles.heroImageColumn}>
        <View
          style={[
            styles.imageGlow,
            styles.imageShadow,
            {
              width: glowSize,
              height: glowSize,
              borderRadius: glowSize / 2,
              marginRight: -imageBleed
            }
          ]}
        >
          <SoupHeroIllustration
            recipeId={recipeId as RecipeId}
            size={imageSize}
            circular
            accessibilityLabel={`${title} recipe`}
          />
        </View>
      </View>
    </View>
  );
}
