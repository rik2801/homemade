import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { DietMarker } from "@/components/recipe/DietMarker";
import { SoupHeroIllustration } from "@/components/recipe/SoupHeroIllustration";
import type { RecipeId } from "@/features/recipe/data/homemadeRecipe";
import { useAppTheme } from "@/hooks/useAppTheme";
import { type ColorPalette } from "@/theme/colors";
import type { DietType } from "@/types/recipe";
import { fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

type CookbookRecipeCardProps = {
  recipeId: RecipeId;
  title: string;
  timeLabel: string;
  dietType: DietType;
  badges: readonly string[];
  featured?: boolean;
  onStartCooking: () => void;
  onOpenReasons?: () => void;
};

export function CookbookRecipeCard({
  recipeId,
  title,
  timeLabel,
  dietType,
  badges,
  featured = false,
  onStartCooking,
  onOpenReasons
}: CookbookRecipeCardProps) {
  const { colors } = useAppTheme();
  const hasBadges = badges.length > 0;

  async function handleStartCooking() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStartCooking();
  }

  async function handleOpenReasons() {
    await Haptics.selectionAsync();
    onOpenReasons?.();
  }

  return (
    <View
      style={[
        styles.card,
        featured ? styles.cardFeatured : styles.cardStandard,
        {
          backgroundColor: colors.surface,
          borderColor: featured ? colors.brand : colors.border
        }
      ]}
    >
      <View style={styles.imageWrap}>
        <SoupHeroIllustration recipeId={recipeId} />
        {featured ? (
          <View style={[styles.recommendedBadge, { backgroundColor: colors.greenSoft, borderColor: "#155A19" }]}>
            <AppText style={[styles.recommendedText, { color: "#155A19" }]}>Recommended</AppText>
          </View>
        ) : null}
        {featured && onOpenReasons ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Why this recipe was recommended"
            hitSlop={8}
            onPress={handleOpenReasons}
            style={[styles.infoBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
          >
            <AppText style={[styles.infoBtnLabel, { color: colors.text }]}>i</AppText>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <View style={styles.titleWithMarker}>
              <AppText variant="heading" style={styles.recipeTitle}>
                {title}
              </AppText>
              {!hasBadges ? <DietMarker dietType={dietType} /> : null}
            </View>
            <View style={styles.timeRow}>
              <ClockIcon color={colors.muted} />
              <AppText muted style={styles.timeText}>
                {timeLabel}
              </AppText>
            </View>
          </View>
        </View>
        {hasBadges ? (
          <View style={styles.pillsBlock}>
            <View style={styles.metaRow}>
              <DietMarker dietType={dietType} />
              {badges.map((badge) => (
                <MetaPill key={badge} label={badge} colors={colors} />
              ))}
            </View>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={handleStartCooking}
          style={[styles.primaryBtn, { backgroundColor: colors.brand }]}
        >
          <AppText style={[styles.primaryBtnLabel, { color: colors.brandOnBrand }]}>Start cooking</AppText>
        </Pressable>
      </View>
    </View>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75}>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MetaPill({ label, colors }: { label: string; colors: ColorPalette }) {
  return (
    <View style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.canvas }]}>
      <AppText style={[styles.pillText, { color: colors.muted }]}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: "hidden"
  },
  cardFeatured: {
    borderWidth: 2
  },
  cardStandard: {
    borderWidth: 1
  },
  recommendedBadge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    left: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: "absolute",
    top: spacing.sm,
    zIndex: 1
  },
  recommendedText: {
    fontFamily,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase"
  },
  imageWrap: {
    overflow: "hidden",
    position: "relative"
  },
  infoBtn: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 21,
    justifyContent: "center",
    position: "absolute",
    right: spacing.sm,
    top: spacing.sm,
    width: 21
  },
  infoBtnLabel: {
    fontFamily,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 10
  },
  cardBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md
  },
  titleBlock: {
    paddingBottom: 17,
    paddingTop: 11
  },
  pillsBlock: {
    paddingBottom: 13
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  titleWithMarker: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    flexShrink: 1,
    gap: 6
  },
  recipeTitle: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 18
  },
  timeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  timeText: {
    fontFamily,
    fontSize: 10,
    lineHeight: 14
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  pillText: {
    fontFamily,
    fontSize: 9,
    fontWeight: "500",
    lineHeight: 12
  },
  primaryBtn: {
    alignItems: "center",
    borderRadius: radius.md,
    justifyContent: "center",
    marginTop: spacing.xs,
    minHeight: 40
  },
  primaryBtnLabel: {
    fontFamily,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16
  }
});
