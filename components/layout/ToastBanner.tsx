import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

export function ToastBanner() {
  const { colors } = useAppTheme();
  const toastMessage = useAppStore((state) => state.toastMessage);
  const clearToast = useAppStore((state) => state.clearToast);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(clearToast, 2000);
    return () => clearTimeout(timer);
  }, [toastMessage, clearToast]);

  if (!toastMessage) return null;

  return (
    <Animated.View entering={FadeInDown} exiting={FadeOut} style={[styles.toast, { backgroundColor: colors.text }]}>
      <Svg width={16} height={16} viewBox="0 0 24 24" stroke="#FFFFFF" fill="none" strokeWidth={2}>
        <Path d="M20 6 9 17l-5-5" />
      </Svg>
      <AppText style={styles.text}>{toastMessage}</AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: radius.pill,
    bottom: 120,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: "absolute",
    zIndex: 50
  },
  text: {
    color: "#FFFFFF",
    fontFamily,
    fontSize: 14,
    fontWeight: "600"
  }
});
