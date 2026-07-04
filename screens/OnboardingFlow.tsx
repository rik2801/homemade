import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { HomemadeLogo } from "@/components/brand/HomemadeLogo";
import {
  ALLERGY_OPTIONS,
  COOKING_FOR_OPTIONS,
  DEFAULT_PREFERENCES,
  DIETARY_GOAL_OPTIONS,
  PANTRY_MODE_OPTIONS,
  type PantryMode,
  type UserPreferences
} from "@/features/preferences/data/preferenceOptions";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { layout, radius, spacing } from "@/theme/spacing";

type OnboardingStep = 0 | 1 | 2;

export function OnboardingFlow() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const skipOnboardingWithDefaults = useAppStore((state) => state.skipOnboardingWithDefaults);

  const [step, setStep] = useState<OnboardingStep>(0);
  const [cookingFor, setCookingFor] = useState(DEFAULT_PREFERENCES.cookingFor);
  const [dietaryGoals, setDietaryGoals] = useState<string[]>([...DEFAULT_PREFERENCES.dietaryGoals]);
  const [allergies, setAllergies] = useState<string[]>([...DEFAULT_PREFERENCES.allergies]);
  const [pantryMode, setPantryMode] = useState<PantryMode>(DEFAULT_PREFERENCES.pantryMode);

  function toggleItem(list: string[], value: string) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  async function handleContinue() {
    await Haptics.selectionAsync();
    if (step < 2) {
      setStep((current) => (current + 1) as OnboardingStep);
      return;
    }

    const preferences: UserPreferences = { cookingFor, dietaryGoals, allergies, pantryMode };
    completeOnboarding(preferences);
  }

  async function handleBack() {
    await Haptics.selectionAsync();
    if (step > 0) setStep((current) => (current - 1) as OnboardingStep);
  }

  async function handleSkip() {
    await Haptics.selectionAsync();
    skipOnboardingWithDefaults();
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View style={styles.topSide}>
          {step > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              onPress={handleBack}
              style={styles.backChevronBtn}
            >
              <ChevronLeft color={colors.text} />
            </Pressable>
          ) : (
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.backChevronSpacer} />
          )}
        </View>
        <HomemadeLogo align="center" height={36} style={styles.brand} />
        <View style={[styles.topSide, styles.topSideRight]}>
          <AppText style={[styles.progress, { color: colors.faint }]}>{step + 1} of 3</AppText>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        {step === 0 ? (
          <View style={styles.step}>
            <AppText variant="title">Who are you cooking for?</AppText>
            <View style={styles.options}>
              {COOKING_FOR_OPTIONS.map((option) => (
                <OptionChip
                  key={option}
                  label={option}
                  selected={cookingFor === option}
                  onPress={() => setCookingFor(option)}
                />
              ))}
            </View>
            <Pressable accessibilityRole="button" onPress={handleSkip} style={styles.skipBtn}>
              <AppText style={[styles.skipText, { color: colors.muted }]}>Use demo preferences</AppText>
            </Pressable>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.step}>
            <AppText variant="title">Any dietary goals?</AppText>
            <AppText muted style={styles.subtitle}>
              Select all that apply. Archie uses these when suggesting swaps.
            </AppText>
            <View style={styles.options}>
              {DIETARY_GOAL_OPTIONS.map((option) => (
                <OptionChip
                  key={option}
                  label={option}
                  selected={dietaryGoals.includes(option)}
                  onPress={() => setDietaryGoals((current) => toggleItem(current, option))}
                />
              ))}
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.step}>
            <AppText variant="title">What should Archie avoid?</AppText>
            <AppText muted style={styles.subtitle}>
              Select allergens or ingredients to avoid in recommendations.
            </AppText>
            <View style={styles.options}>
              {ALLERGY_OPTIONS.map((option) => (
                <OptionChip
                  key={option}
                  label={option}
                  selected={allergies.includes(option)}
                  onPress={() => setAllergies((current) => toggleItem(current, option))}
                />
              ))}
            </View>

            <View style={styles.section}>
              <AppText variant="section">How should Archie handle pantry items?</AppText>
              <View style={styles.options}>
                {PANTRY_MODE_OPTIONS.map((option) => (
                  <OptionChip
                    key={option.value}
                    label={option.label}
                    selected={pantryMode === option.value}
                    onPress={() => setPantryMode(option.value)}
                  />
                ))}
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, borderTopColor: colors.borderLight }]}>
        <Pressable
          accessibilityRole="button"
          onPress={handleContinue}
          style={[styles.primaryBtn, { backgroundColor: colors.brand }]}
        >
          <AppText style={[styles.primaryLabel, { color: colors.brandOnBrand }]}>
            {step === 2 ? "Start cooking" : "Continue"}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function ChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

function OptionChip({
  label,
  selected,
  onPress
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  async function handlePress() {
    await Haptics.selectionAsync();
    onPress();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={handlePress}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: colors.brand, borderColor: colors.brand }
          : { backgroundColor: colors.surface, borderColor: colors.border }
      ]}
    >
      <AppText
        style={[
          styles.chipText,
          { color: selected ? colors.brandOnBrand : colors.text, fontWeight: selected ? "600" : "500" }
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 40 + spacing.md * 2,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.md
  },
  topSide: {
    alignItems: "flex-start",
    justifyContent: "center",
    minHeight: 40,
    minWidth: 72,
    width: 72
  },
  topSideRight: {
    alignItems: "flex-end"
  },
  brand: {
    flex: 1
  },
  backChevronBtn: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    marginLeft: -8,
    width: 40
  },
  backChevronSpacer: {
    height: 40,
    marginLeft: -8,
    width: 40
  },
  progress: {
    fontFamily,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "right",
    width: "100%"
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg
  },
  step: {
    gap: spacing.lg
  },
  subtitle: {
    fontFamily,
    fontSize: 15,
    lineHeight: 22
  },
  section: {
    gap: spacing.md,
    marginTop: spacing.md
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 11
  },
  chipText: {
    fontFamily,
    fontSize: 14
  },
  skipBtn: {
    alignSelf: "flex-start",
    paddingVertical: spacing.sm
  },
  skipText: {
    fontFamily,
    fontSize: 14,
    textDecorationLine: "underline"
  },
  footer: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md
  },
  primaryBtn: {
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 48,
    width: "100%"
  },
  primaryLabel: {
    fontFamily,
    fontSize: 15,
    fontWeight: "600"
  }
});
