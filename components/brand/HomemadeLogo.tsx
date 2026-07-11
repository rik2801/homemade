import { Image, StyleSheet, View, type ViewStyle } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

const LOGO_ASPECT = 1024 / 374;

const logos = {
  light: require("@/assets/images/homemade-green.png"),
  dark: require("@/assets/images/homemade-yellow.png"),
  white: require("@/assets/images/homemade-white.png")
} as const;

type HomemadeLogoProps = {
  height?: number;
  align?: "left" | "center";
  variant?: "auto" | "white";
  style?: ViewStyle;
};

export function HomemadeLogo({ height = 34, align = "center", variant = "auto", style }: HomemadeLogoProps) {
  const { isDark } = useAppTheme();
  const source = variant === "white" ? logos.white : isDark ? logos.dark : logos.light;

  return (
    <View style={[styles.wrap, align === "center" ? styles.center : styles.left, style]}>
      <Image
        accessibilityLabel="Homemade"
        resizeMode="contain"
        source={source}
        style={{ width: height * LOGO_ASPECT, height }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: "center"
  },
  left: {
    alignItems: "flex-start"
  },
  center: {
    alignItems: "center"
  }
});
