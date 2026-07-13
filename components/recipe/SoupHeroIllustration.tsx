import { Image, StyleSheet, View, type ViewStyle } from "react-native";
import type { RecipeId } from "@/features/recipe/data/homemadeRecipe";

const recipeImages: Record<RecipeId, number> = {
  "creamy-tomato-soup": require("@/assets/images/creamy-tomato-soup.png"),
  "chicken-curry": require("@/assets/images/chicken-curry.png"),
  "mushroom-pasta": require("@/assets/images/mushroom-pasta.png")
};

const recipeLabels: Record<RecipeId, string> = {
  "creamy-tomato-soup": "Creamy tomato soup",
  "chicken-curry": "Chicken curry",
  "mushroom-pasta": "Mushroom pasta"
};

type SoupHeroIllustrationProps = {
  recipeId?: RecipeId;
  height?: number;
  size?: number;
  circular?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export function SoupHeroIllustration({
  recipeId = "creamy-tomato-soup",
  height = 180,
  size,
  circular = false,
  accessibilityLabel,
  style
}: SoupHeroIllustrationProps) {
  const dimension = size ?? height;
  const label = accessibilityLabel ?? recipeLabels[recipeId];

  return (
    <View
      style={[
        styles.wrap,
        circular
          ? {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2
            }
          : { height: dimension, width: "100%" },
        style
      ]}
    >
      <Image
        accessibilityRole="image"
        accessibilityLabel={label}
        resizeMode="cover"
        source={recipeImages[recipeId]}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden"
  },
  image: {
    height: "100%",
    width: "100%"
  }
});
