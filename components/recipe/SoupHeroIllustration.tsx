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
  style?: ViewStyle;
};

export function SoupHeroIllustration({
  recipeId = "creamy-tomato-soup",
  height = 180,
  style
}: SoupHeroIllustrationProps) {
  return (
    <View style={[styles.wrap, { height }, style]}>
      <Image
        accessibilityLabel={recipeLabels[recipeId]}
        resizeMode="cover"
        source={recipeImages[recipeId]}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    width: "100%"
  },
  image: {
    height: "100%",
    width: "100%"
  }
});
