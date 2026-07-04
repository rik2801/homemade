import { useColorScheme } from "react-native";
import { palettes, type AppScheme } from "@/theme/colors";

export function useAppTheme() {
  const scheme = (useColorScheme() ?? "light") as AppScheme;
  const colors = palettes[scheme] ?? palettes.light;

  return {
    scheme,
    colors,
    isDark: scheme === "dark"
  };
}
