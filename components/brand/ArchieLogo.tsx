import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import {
  archieBrandColor,
  archieEmphasisStyle,
  archieFontFamily,
  archieTextScale
} from "@/theme/typography";

const LOGO_BOX_HEIGHT = 44;

type ArchieLogoProps = {
  height?: number;
  align?: "left" | "center";
  style?: ViewStyle;
};

export function ArchieLogo({ height = LOGO_BOX_HEIGHT, align = "center", style }: ArchieLogoProps) {
  const fontSize = Math.round(height * 0.66 * archieTextScale);
  const lineHeight = Math.round(fontSize * 1.34);

  return (
    <View
      style={[
        styles.wrap,
        align === "center" ? styles.center : styles.left,
        { minHeight: height + 8 },
        style
      ]}
    >
      <Text
        accessibilityLabel="Archie"
        style={[
          styles.logo,
          {
            color: archieBrandColor,
            fontFamily: archieFontFamily,
            fontSize,
            lineHeight,
            ...archieEmphasisStyle(archieBrandColor)
          }
        ]}
      >
        Archie
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    justifyContent: "center",
    overflow: "visible",
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  left: {
    alignItems: "flex-start"
  },
  center: {
    alignItems: "center"
  },
  logo: {
    flexShrink: 0,
    includeFontPadding: false,
    paddingBottom: 3,
    paddingHorizontal: 4,
    paddingTop: 7,
    textAlign: "center"
  }
});
