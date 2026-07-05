import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { useAppTheme } from "@/hooks/useAppTheme";
import { fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

const AVATAR_OUTER_SIZE = 92;
const AVATAR_INNER_SIZE = 68;
const AVATAR_OUTER_TINT = "#E9F4E6";
const AVATAR_INNER_GREEN = "#52673C";

export type ArchieQuickAction = {
  id: string;
  label: string;
  onPress: () => void | Promise<void>;
};

export type ArchieEmptyStateProps = {
  headline: string;
  subtext: string;
  avatar?: ReactNode;
  quickActions: ArchieQuickAction[];
};

export function ArchieAvatarPlaceholder() {
  return (
    <View style={styles.avatarOuter}>
      <View style={styles.avatarInner}>
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3l1.4 4.3H18l-3.6 2.6 1.4 4.3L12 11.6 8.2 14.2l1.4-4.3L6 7.3h4.6L12 3z"
            fill="#FFFFFF"
            opacity={0.92}
          />
          <Path
            d="M19 14l.8 2.4H22l-2 1.5.8 2.4L19 18.8l-1.8 1.5.8-2.4-2-1.5h2.2L19 14z"
            fill="#FFFFFF"
            opacity={0.72}
          />
        </Svg>
      </View>
    </View>
  );
}

function QuickActionTile({ action }: { action: ArchieQuickAction }) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={action.onPress}
      style={({ pressed }) => [
        styles.actionTile,
        {
          backgroundColor: pressed ? colors.brandSoft : colors.surface,
          borderColor: pressed ? colors.brandBorder : colors.borderLight,
          shadowColor: colors.shadow
        }
      ]}
    >
      <AppText style={styles.actionLabel}>{action.label}</AppText>
    </Pressable>
  );
}

export function ArchieEmptyState({ headline, subtext, avatar, quickActions }: ArchieEmptyStateProps) {
  return (
    <View style={styles.root}>
      {avatar ?? <ArchieAvatarPlaceholder />}
      <AppText style={styles.headline}>{headline}</AppText>
      <AppText muted style={styles.subtext}>
        {subtext}
      </AppText>
      <View style={styles.actionGrid}>
        {quickActions.map((action) => (
          <QuickActionTile key={action.id} action={action} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    gap: spacing.md,
    maxWidth: 320,
    width: "100%"
  },
  avatarOuter: {
    alignItems: "center",
    backgroundColor: AVATAR_OUTER_TINT,
    borderRadius: AVATAR_OUTER_SIZE / 2,
    height: AVATAR_OUTER_SIZE,
    justifyContent: "center",
    width: AVATAR_OUTER_SIZE
  },
  avatarInner: {
    alignItems: "center",
    backgroundColor: AVATAR_INNER_GREEN,
    borderRadius: AVATAR_INNER_SIZE / 2,
    height: AVATAR_INNER_SIZE,
    justifyContent: "center",
    width: AVATAR_INNER_SIZE
  },
  headline: {
    fontFamily,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
    lineHeight: 28,
    textAlign: "center"
  },
  subtext: {
    fontFamily,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 280,
    textAlign: "center"
  },
  actionGrid: {
    columnGap: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.xs,
    rowGap: spacing.sm,
    width: "100%"
  },
  actionTile: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    width: "47.5%"
  },
  actionLabel: {
    fontFamily,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: -0.1,
    lineHeight: 16,
    textAlign: "center"
  }
});

export const archieEmptyStateDefaults = {
  headline: "How can I help with today's recipe?",
  subtext:
    "I can help swap ingredients, adjust recipes and keep meals aligned with your dietary goals."
} as const;
