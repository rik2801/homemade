import * as Haptics from "expo-haptics";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { PressableScale } from "@/components/primitives/PressableScale";
import { IngredientIcon } from "@/components/recipe/IngredientIcon";
import { iconKeyForLabel } from "@/lib/swapFlow";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import type { PendingSuggestion } from "@/types/recipe";
import { fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

type SwapRecommendationCardProps = {
  suggestion: PendingSuggestion;
};

export function SwapRecommendationCard({ suggestion }: SwapRecommendationCardProps) {
  const { colors } = useAppTheme();
  const applyPhase = useAppStore((state) => state.applyPhase);
  const applySuggestion = useAppStore((state) => state.applySuggestion);
  const cancelSuggestion = useAppStore((state) => state.cancelSuggestion);
  const requestAnotherOption = useAppStore((state) => state.requestAnotherOption);
  const selectedIngredientId = useAppStore((state) => state.selectedIngredientId);

  const isApplying = applyPhase === "loading";
  const isSuccess = applyPhase === "success";
  const isFallback = suggestion.source === "fallback";
  const icon = selectedIngredientId
    ? iconKeyForLabel(suggestion.displayItem, "herb")
    : iconKeyForLabel(suggestion.displayItem, "yogurt");

  async function handleApply() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    applySuggestion();
  }

  async function handleCancel() {
    await Haptics.selectionAsync();
    cancelSuggestion();
  }

  async function handleAnotherOption() {
    await Haptics.selectionAsync();
    requestAnotherOption();
  }

  const applyLabel = isApplying ? "Applying to recipe…" : isSuccess ? "Applied to recipe" : "Apply to recipe";

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={[styles.headerBar, { backgroundColor: colors.brand }]}>
        <AppText style={[styles.headerTitle, { color: colors.brandOnBrand }]}>Archie&apos;s recommendation</AppText>
      </View>

      <View style={styles.cardBody}>
        <View
          style={[
            styles.sourceBadge,
            isFallback
              ? { backgroundColor: colors.canvas, borderColor: colors.border, borderWidth: 1 }
              : { backgroundColor: colors.brandSoft, borderColor: colors.brandBorder, borderWidth: 1 }
          ]}
        >
          <AppText style={[styles.sourceText, { color: isFallback ? colors.muted : colors.brandOnBrand }]}>
            {isFallback ? "Fallback rule" : "AI suggestion"}
          </AppText>
        </View>

        {isFallback ? (
          <AppText muted style={styles.fallbackNotice}>
            Using rule-based substitution because AI is unavailable.
          </AppText>
        ) : null}

        <View style={[styles.swapBlock, { backgroundColor: colors.canvas, borderColor: colors.borderLight }]}>
          <View style={[styles.swapRowNew, { backgroundColor: colors.surface }]}>
            <IngredientIcon icon={icon} showSwapDot={false} />
            <View style={styles.swapText}>
              <AppText style={styles.swapName}>{suggestion.displayItem}</AppText>
            </View>
          </View>
        </View>

        <TrustSection
          label="Original"
          value={`${capitalize(suggestion.originalItem)}, ${suggestion.originalAmount}`}
        />
        <TrustSection label="User has" value={suggestion.userHas} />
        <TrustSection label="Use" value={suggestion.recommendedUsage} />
        <TrustSection label="Why this works" value={suggestion.why} />
        {suggestion.dietaryFit ? <TrustSection label="Dietary fit" value={suggestion.dietaryFit} /> : null}
        {suggestion.recipeImpact ? <TrustSection label="Recipe impact" value={suggestion.recipeImpact} /> : null}
        {suggestion.confidence ? <TrustSection label="Confidence" value={suggestion.confidence} /> : null}

        <View style={styles.benefits}>
          {suggestion.benefits.map((benefit) => (
            <View key={benefit} style={[styles.benefitChip, { borderColor: colors.brandOlive }]}>
              <AppText style={[styles.benefitText, { color: colors.brandOlive }]}>{benefit}</AppText>
            </View>
          ))}
        </View>

        {isSuccess ? (
          <View style={[styles.success, { backgroundColor: colors.greenSoft }]}>
            <AppText style={{ color: colors.green, fontFamily, fontWeight: "600" }}>✓ Applied to recipe</AppText>
          </View>
        ) : (
          <View style={styles.actions}>
            <PressableScale
              accessibilityRole="button"
              disabled={isApplying}
              onPress={handleApply}
              style={[styles.applyBtn, { backgroundColor: colors.brand }]}
            >
              {isApplying ? (
                <ActivityIndicator color={colors.brandOnBrand} />
              ) : (
                <AppText style={[styles.applyLabel, { color: colors.brandOnBrand }]}>{applyLabel}</AppText>
              )}
            </PressableScale>
            <View style={styles.secondaryRow}>
              <PressableScale
                accessibilityRole="button"
                disabled={isApplying}
                onPress={handleAnotherOption}
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
              >
                <AppText style={[styles.secondaryLabel, { color: colors.brandOnBrand }]}>Another option</AppText>
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                disabled={isApplying}
                onPress={handleCancel}
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
              >
                <AppText style={[styles.secondaryLabel, { color: colors.muted }]}>Cancel</AppText>
              </PressableScale>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function TrustSection({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.trustSection}>
      <AppText style={[styles.trustLabel, { color: colors.faint }]}>{label.toUpperCase()}</AppText>
      <AppText style={[styles.trustValue, { color: colors.muted }]}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden"
  },
  headerBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12
  },
  headerTitle: {
    fontFamily,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.1
  },
  cardBody: {
    gap: spacing.md,
    padding: spacing.md
  },
  sourceBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  sourceText: {
    fontFamily,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase"
  },
  fallbackNotice: {
    fontFamily,
    fontSize: 13,
    lineHeight: 19
  },
  swapBlock: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 14
  },
  swapRowNew: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm
  },
  swapText: {
    flex: 1,
    gap: 2
  },
  swapName: {
    fontFamily,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3
  },
  trustSection: {
    gap: 4
  },
  trustLabel: {
    fontFamily,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.66
  },
  trustValue: {
    fontFamily,
    fontSize: 15,
    lineHeight: 22
  },
  benefits: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  benefitChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  benefitText: {
    fontFamily,
    fontSize: 10,
    fontWeight: "500"
  },
  actions: {
    gap: spacing.sm
  },
  applyBtn: {
    alignItems: "center",
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 48
  },
  applyLabel: {
    fontFamily,
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  secondaryBtn: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 44
  },
  secondaryLabel: {
    fontFamily,
    fontSize: 14,
    fontWeight: "600"
  },
  success: {
    alignItems: "center",
    borderRadius: radius.md,
    padding: spacing.md
  }
});
