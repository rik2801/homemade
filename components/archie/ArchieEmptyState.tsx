import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { ArchieMascotAvatar, MASCOT_LIFT, MASCOT_SIZE } from "@/components/archie/ArchieMascotAvatar";
import { useAppTheme } from "@/hooks/useAppTheme";
import { fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

export { ARCHIE_MASCOT_IMAGE } from "@/components/archie/ArchieMascotAvatar";

const CONTENT_LIFT = MASCOT_SIZE * 0.15;

export type ArchieQuickAction = {
  id: string;
  label: string;
  onPress: () => void | Promise<void>;
};

export type ArchieEmptyStateProps = {
  headline: string;
  subtext?: string;
  avatar?: ReactNode;
  quickActions: ArchieQuickAction[];
};

export function ArchieAvatarPlaceholder() {
  return (
    <View style={styles.mascotWrap}>
      <ArchieMascotAvatar />
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
      <View style={styles.contentWrap}>
        <AppText style={styles.headline}>{headline}</AppText>
        {subtext ? (
          <AppText muted style={styles.subtext}>
            {subtext}
          </AppText>
        ) : null}
        <View style={styles.actionGrid}>
          {quickActions.map((action) => (
            <QuickActionTile key={action.id} action={action} />
          ))}
        </View>
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
  mascotWrap: {
    marginBottom: -MASCOT_LIFT,
    transform: [{ translateY: -MASCOT_LIFT }]
  },
  contentWrap: {
    alignItems: "center",
    gap: spacing.md,
    marginBottom: -CONTENT_LIFT,
    transform: [{ translateY: -CONTENT_LIFT }],
    width: "100%"
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
    fontWeight: "400",
    letterSpacing: -0.1,
    lineHeight: 16,
    textAlign: "center"
  }
});

export const archieEmptyStateDefaults = {
  headline: "How can I help with today's recipe?"
} as const;
