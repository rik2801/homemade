import { Platform, type TextStyle } from "react-native";

/** Matches HTML: ui-monospace, SF Mono, Menlo, Consolas */
export const fontFamily = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace"
});

/** Giomori Italic — used for the Archie brand word wherever it appears in UI copy. */
export const archieFontFamily = "Giomori-Italic";
export const archieTextScale = 1.25;
export const archieWeightBoost = 0.4;
/** Meet Archie / Archie header brand magenta */
export const archieBrandColor = "#9A1179";

/** Thickens single-weight Giomori strokes when no bold font file is available. */
export function archieEmphasisStyle(color: string): Pick<
  TextStyle,
  "fontWeight" | "textShadowColor" | "textShadowOffset" | "textShadowRadius"
> {
  return {
    fontWeight: "600",
    textShadowColor: color,
    textShadowOffset: { width: 0.18 + archieWeightBoost * 0.82, height: 0 },
    textShadowRadius: archieWeightBoost * 0.22
  };
}

export const fontFamilyBold = Platform.select({
  ios: "Menlo-Bold",
  android: "monospace",
  default: "monospace"
});
