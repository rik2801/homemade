import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radius, spacing } from "@/theme/spacing";

type CardProps = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  tone?: "default" | "warm" | "sage";
};

export function Card({ children, style, tone = "default" }: CardProps) {
  const { colors } = useAppTheme();
  const backgroundColor =
    tone === "warm" ? colors.surfaceWarm : tone === "sage" ? colors.surfaceSage : colors.surface;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor: colors.border,
          shadowColor: colors.shadow
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 2
  }
});
