import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { ArchieMascotAvatar } from "@/components/archie/ArchieMascotAvatar";
import { fontFamily } from "@/theme/typography";
import { spacing } from "@/theme/spacing";

export { ARCHIE_MASCOT_IMAGE } from "@/components/archie/ArchieMascotAvatar";

export type ArchieEmptyStateProps = {
  headline: string;
  subtext?: string;
  avatar?: ReactNode;
};

export function ArchieAvatarPlaceholder() {
  return (
    <View style={styles.mascotWrap}>
      <ArchieMascotAvatar />
    </View>
  );
}

export function ArchieEmptyState({ headline, subtext, avatar }: ArchieEmptyStateProps) {
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
    alignItems: "center"
  },
  contentWrap: {
    alignItems: "center",
    gap: spacing.md,
    width: "100%"
  },
  headline: {
    color: "#111827",
    fontFamily,
    fontSize: 15,
    fontWeight: "400",
    letterSpacing: -0.3,
    lineHeight: 20,
    textAlign: "center"
  },
  subtext: {
    fontFamily,
    fontSize: 9,
    lineHeight: 13,
    maxWidth: 280,
    textAlign: "center"
  }
});

export const archieEmptyStateDefaults = {
  headline: "How can I help with today's recipe?"
} as const;
