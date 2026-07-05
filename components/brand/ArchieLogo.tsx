import { Image, StyleSheet, View, type ViewStyle } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

const LOGO_ASPECT = 1672 / 941;

const logos = {
  light: require("@/assets/images/archie-green.png"),
  dark: require("@/assets/images/archir-yellow.png")
} as const;

type ArchieLogoProps = {
  height?: number;
  align?: "left" | "center";
  style?: ViewStyle;
};

export function ArchieLogo({ height = 36, align = "center", style }: ArchieLogoProps) {
  const { isDark } = useAppTheme();
  const source = isDark ? logos.dark : logos.light;

  return (
    <View style={[styles.wrap, align === "center" ? styles.center : styles.left, style]}>
      <Image
        accessibilityLabel="Archie"
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
