import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AppText } from "@/components/primitives/AppText";
import { Card } from "@/components/primitives/Card";
import { SectionHeader } from "@/components/recipe/SectionHeader";
import { partnerMetrics } from "@/features/recipe/data/homemadeRecipe";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radius, spacing } from "@/theme/spacing";
import type { Recipe, SubstitutionOption } from "@/types/recipe";

type SafetyBannerProps = {
  selectedSwap: SubstitutionOption | null;
};

export function SafetyBanner({ selectedSwap }: SafetyBannerProps) {
  const { colors } = useAppTheme();

  if (!selectedSwap) {
    return null;
  }

  return (
    <Animated.View entering={FadeInDown.duration(220)}>
      <Card tone="sage" style={styles.safety}>
        <AppText style={{ color: colors.basil, fontWeight: "900" }}>Swap applied</AppText>
        <AppText variant="caption" style={{ color: colors.basil }}>
          {selectedSwap.replacement} keeps the recipe aligned with low-fat and low-sodium guidance.
        </AppText>
      </Card>
    </Animated.View>
  );
}

export function StepsPanel({ recipe }: { recipe: Recipe }) {
  const { colors } = useAppTheme();

  return (
    <Card>
      <SectionHeader title="Cook" detail="quiet guidance" />
      <View style={styles.stepStack}>
        {recipe.steps.map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: colors.surfaceButter }]}>
              <AppText variant="caption" style={{ color: colors.text }}>
                {index + 1}
              </AppText>
            </View>
            <AppText muted style={styles.stepCopy}>
              {step}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

export function SmsPreview() {
  const { colors } = useAppTheme();

  return (
    <Card>
      <SectionHeader title="SMS nudge" detail="2-3x/week" />
      <View style={[styles.message, { backgroundColor: colors.surfaceSage }]}>
        <AppText variant="caption" style={{ color: colors.basil }}>
          Homemade
        </AppText>
        <AppText style={{ color: colors.basil }}>Still have spinach and beans? Make this tonight.</AppText>
      </View>
    </Card>
  );
}

export function PartnerInsights() {
  const { colors } = useAppTheme();

  return (
    <Card>
      <SectionHeader title="Partner view" detail="lightweight signal" />
      <View style={styles.metrics}>
        {partnerMetrics.map((metric, index) => {
          const featured = index === 0;

          return (
            <View
              key={metric.label}
              style={[
                styles.metricCard,
                {
                  backgroundColor: featured ? colors.tomato : colors.surfaceWarm,
                  width: featured ? "100%" : "48%"
                }
              ]}
            >
              <AppText variant="metric" style={{ color: featured ? "#FFFDF7" : colors.text }}>
                {metric.value}
              </AppText>
              <AppText variant="caption" style={{ color: featured ? "#FFFDF7" : colors.muted, opacity: 0.82 }}>
                {metric.label}
              </AppText>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export function TrustPanel({ recipe }: { recipe: Recipe }) {
  const { colors } = useAppTheme();

  return (
    <Card>
      <SectionHeader title="Trust note" detail="HIPAA-adjacent" />
      <View style={styles.trustStack}>
        {recipe.safetyNotes.map((note) => (
          <View key={note} style={styles.trustRow}>
            <AppText style={{ color: colors.basil, fontWeight: "900" }}>✓</AppText>
            <AppText variant="caption" muted style={styles.trustCopy}>
              {note}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

export function EngineeringNote() {
  return (
    <Card tone="warm">
      <AppText variant="eyebrow">Founder mode</AppText>
      <AppText variant="caption" muted style={styles.noteCopy}>
        Built from zero as a local simulation: the assistant response can become Claude, the nudge loop can become Twilio, and the same rule objects can sit behind AWS Lambda/API Gateway with DynamoDB preferences and partner configuration.
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  safety: {
    gap: 4,
    paddingVertical: spacing.md
  },
  stepStack: {
    gap: spacing.md,
    marginTop: spacing.lg
  },
  stepRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  stepNumber: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  stepCopy: {
    flex: 1
  },
  message: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 8,
    borderRadius: 24,
    gap: 5,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    width: "86%"
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  metricCard: {
    borderRadius: radius.lg,
    minHeight: 86,
    padding: spacing.md
  },
  trustStack: {
    gap: spacing.sm,
    marginTop: spacing.md
  },
  trustRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  trustCopy: {
    flex: 1
  },
  noteCopy: {
    marginTop: spacing.sm
  }
});
