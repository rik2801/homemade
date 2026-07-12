import { useColorScheme } from "react-native";
import { palettes, type AppScheme } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";

export function useAppTheme() {
  const systemScheme = (useColorScheme() ?? "light") as AppScheme;
  const darkMode = useAppStore((state) => state.darkMode);
  const scheme: AppScheme = darkMode ? "dark" : "light";
  const colors = palettes[scheme] ?? palettes.light;

  return {
    scheme,
    systemScheme,
    colors,
    isDark: darkMode,
    darkMode
  };
}
