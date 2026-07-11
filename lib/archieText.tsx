import type { ReactNode } from "react";
import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";
import { archieEmphasisStyle, archieFontFamily, archieTextScale } from "@/theme/typography";

const ARCHIE_WORD_PATTERN = /(Archie)/g;

export function containsArchieWord(text: string): boolean {
  return text.includes("Archie");
}

function archieWordStyle(baseStyle?: StyleProp<TextStyle>, archieStyle?: StyleProp<TextStyle>): TextStyle {
  const flat = StyleSheet.flatten(baseStyle) ?? {};
  const flatArchie = StyleSheet.flatten(archieStyle) ?? {};
  const fontSize = typeof flat.fontSize === "number" ? flat.fontSize : 15;
  const lineHeight =
    typeof flat.lineHeight === "number" ? flat.lineHeight : Math.round(fontSize * 1.47);
  const color =
    typeof flatArchie.color === "string"
      ? flatArchie.color
      : typeof flat.color === "string"
        ? flat.color
        : "#111827";

  return {
    color,
    fontFamily: archieFontFamily,
    fontSize: Math.round(fontSize * archieTextScale),
    includeFontPadding: false,
    lineHeight: Math.round(lineHeight * archieTextScale * 1.08),
    ...archieEmphasisStyle(color),
    ...flatArchie
  };
}

export function renderArchieTextChildren(
  text: string,
  baseStyle?: StyleProp<TextStyle>,
  archieStyle?: StyleProp<TextStyle>
): ReactNode {
  if (!containsArchieWord(text)) {
    return text;
  }

  return text
    .split(ARCHIE_WORD_PATTERN)
    .filter(Boolean)
    .map((segment, index) => (
      <Text
        key={`${index}-${segment}`}
        style={segment === "Archie" ? archieWordStyle(baseStyle, archieStyle) : baseStyle}
      >
        {segment}
      </Text>
    ));
}
