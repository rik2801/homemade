import { Platform } from "react-native";

/** Matches HTML: ui-monospace, SF Mono, Menlo, Consolas */
export const fontFamily = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace"
});

export const fontFamilyBold = Platform.select({
  ios: "Menlo-Bold",
  android: "monospace",
  default: "monospace"
});
