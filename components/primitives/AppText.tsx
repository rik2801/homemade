import type { ReactNode } from "react";
import { Text, type TextProps, StyleSheet } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { fontFamily } from "@/theme/typography";

type AppTextProps = TextProps & {
  children: ReactNode;
  variant?: "brand" | "title" | "section" | "body" | "caption" | "micro" | "eyebrow" | "heading" | "metric";
  muted?: boolean;
};

export function AppText({ children, variant = "body", muted, style, ...props }: AppTextProps) {
  const { colors } = useAppTheme();

  return (
    <Text
      {...props}
      style={[
        styles.base,
        styles[variant],
        { color: muted ? colors.muted : colors.text, fontFamily },
        variant === "brand" ? { color: colors.text } : null,
        variant === "section" ? { color: colors.muted } : null,
        variant === "eyebrow" ? { color: colors.muted } : null,
        style
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false
  },
  brand: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.3
  },
  title: {
    fontSize: 30,
    fontWeight: "400",
    letterSpacing: -0.6,
    lineHeight: 33
  },
  section: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.88,
    textTransform: "uppercase"
  },
  body: {
    fontSize: 15,
    fontWeight: "400",
    letterSpacing: -0.2,
    lineHeight: 22
  },
  caption: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 19
  },
  micro: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.2,
    lineHeight: 13
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.88,
    textTransform: "uppercase"
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.2,
    lineHeight: 23
  },
  metric: {
    fontSize: 32,
    fontWeight: "400",
    letterSpacing: -0.3,
    lineHeight: 34
  }
});
