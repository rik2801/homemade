import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { DietMarker } from "@/components/recipe/DietMarker";
import { SoupHeroIllustration } from "@/components/recipe/SoupHeroIllustration";
import type { RecipeId } from "@/features/recipe/data/homemadeRecipe";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { DietType } from "@/types/recipe";
import { fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

const CARD_IMAGE_HEIGHT = 274;

type CookbookRecipeCardProps = {
  recipeId: RecipeId;
  title: string;
  timeLabel: string;
  dietType: DietType;
  badges: readonly string[];
  featured?: boolean;
  onPress: () => void;
  onOpenReasons?: () => void;
};

export function CookbookRecipeCard({
  recipeId,
  title,
  timeLabel,
  dietType,
  badges,
  featured = false,
  onPress,
  onOpenReasons
}: CookbookRecipeCardProps) {
  const { colors } = useAppTheme();
  const hasBadges = badges.length > 0;

  async function handlePress() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  async function handleOpenReasons() {
    await Haptics.selectionAsync();
    onOpenReasons?.();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${title} recipe`}
      onPress={handlePress}
      style={[
        styles.card,
        featured ? styles.cardFeatured : styles.cardStandard,
        { borderColor: featured ? colors.brand : colors.border }
      ]}
    >
      <View style={styles.imageWrap}>
        <SoupHeroIllustration recipeId={recipeId} height={CARD_IMAGE_HEIGHT} />
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
            onPress={(event) => {
              event.stopPropagation();
              handleOpenReasons();
            }}
            style={[styles.infoBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
          >
            <AppText style={[styles.infoBtnLabel, { color: colors.text }]}>i</AppText>
          </Pressable>
        ) : null}
        <ImageVignette gradientId={`card-vignette-${recipeId}`} />
        <View pointerEvents="none" style={styles.bottomOverlay}>
          <View style={styles.overlayContent}>
            <View style={styles.titleRow}>
              <View style={styles.titleWithMarker}>
                <AppText variant="heading" style={[styles.recipeTitle, styles.overlayText]}>
                  {title}
                </AppText>
                {!hasBadges ? <DietMarker dietType={dietType} /> : null}
              </View>
              <View style={styles.timeRow}>
                <ClockIcon color="#FFFFFF" />
                <AppText style={[styles.timeText, styles.overlayText]}>{timeLabel}</AppText>
              </View>
            </View>
            {hasBadges ? (
              <View style={styles.metaRow}>
                <DietMarker dietType={dietType} />
                {badges.map((badge) => (
                  <MetaPill key={badge} label={badge} />
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function ImageVignette({ gradientId }: { gradientId: string }) {
  return (
    <Svg pointerEvents="none" style={styles.vignette} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000000" stopOpacity="0" />
          <Stop offset="0.42" stopColor="#000000" stopOpacity="0" />
          <Stop offset="0.56" stopColor="#000000" stopOpacity="0.18" />
          <Stop offset="0.68" stopColor="#000000" stopOpacity="0.4" />
          <Stop offset="0.78" stopColor="#000000" stopOpacity="0.62" />
          <Stop offset="0.88" stopColor="#000000" stopOpacity="0.82" />
          <Stop offset="0.96" stopColor="#000000" stopOpacity="0.94" />
          <Stop offset="1" stopColor="#000000" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
    </Svg>
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

function MetaPill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <AppText style={[styles.pillText, styles.overlayText]}>{label}</AppText>
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
  imageWrap: {
    overflow: "hidden",
    position: "relative"
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  bottomOverlay: {
    bottom: 0,
    left: 0,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    position: "absolute",
    right: 0
  },
  overlayContent: {
    position: "relative"
  },
  recommendedBadge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    left: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: "absolute",
    top: spacing.sm,
    zIndex: 2
  },
  recommendedText: {
    fontFamily,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase"
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
    width: 21,
    zIndex: 2
  },
  infoBtnLabel: {
    fontFamily,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 10
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
  overlayText: {
    color: "#FFFFFF"
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
    gap: 6,
    marginTop: 10
  },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.32)",
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
  }
});
