import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import { ImageBackground, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { HomemadeLogo } from "@/components/brand/HomemadeLogo";
import { ArchieGradientBackground } from "@/components/onboarding/ArchieGradientBackground";
import {
  MEET_ARCHIE_CONTINUE_DELAY_MS,
  MEET_ARCHIE_REVEAL_FADE_MS,
  MeetArchieOnboardingStep
} from "@/components/onboarding/MeetArchieOnboardingStep";
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

const ONBOARDING_BG = require("@/assets/images/onboarding-bg.png");
const ONBOARDING_TEXT = "#FFFFFF";
const ONBOARDING_TEXT_MUTED = "rgba(255, 255, 255, 0.78)";
const ONBOARDING_CHIP_BORDER = "rgba(255, 255, 255, 0.38)";
const ONBOARDING_CHIP_FROST_TINT = "rgba(255, 255, 255, 0.18)";
const ONBOARDING_DISPLAY_STEP_COUNT = 3;
const ONBOARDING_STEP_COUNT = ONBOARDING_DISPLAY_STEP_COUNT;

type OnboardingStep = 0 | 1 | 2 | 3;

function onboardingProgressLabel(step: OnboardingStep): string | null {
  if (step === 2) return null;
  if (step === 3) return `3 of ${ONBOARDING_DISPLAY_STEP_COUNT}`;
  return `${step + 1} of ${ONBOARDING_DISPLAY_STEP_COUNT}`;
}

export function OnboardingFlow() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const [step, setStep] = useState<OnboardingStep>(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [cookingFor, setCookingFor] = useState(DEFAULT_PREFERENCES.cookingFor);
  const [dietaryGoals, setDietaryGoals] = useState<string[]>([...DEFAULT_PREFERENCES.dietaryGoals]);
  const [allergies, setAllergies] = useState<string[]>([...DEFAULT_PREFERENCES.allergies]);
  const [pantryMode, setPantryMode] = useState<PantryMode>(DEFAULT_PREFERENCES.pantryMode);

  const [meetArchieContinueReady, setMeetArchieContinueReady] = useState(false);
  const meetArchieContinueOpacity = useSharedValue(1);

  useEffect(() => {
    setContentHeight(0);
  }, [step]);

  useEffect(() => {
    if (step !== 2) {
      setMeetArchieContinueReady(true);
      meetArchieContinueOpacity.value = 1;
      return;
    }

    setMeetArchieContinueReady(false);
    meetArchieContinueOpacity.value = 0;

    const continueTimer = setTimeout(() => {
      setMeetArchieContinueReady(true);
      meetArchieContinueOpacity.value = withTiming(1, { duration: MEET_ARCHIE_REVEAL_FADE_MS });
    }, MEET_ARCHIE_CONTINUE_DELAY_MS);

    return () => clearTimeout(continueTimer);
  }, [meetArchieContinueOpacity, step]);

  const meetArchieContinueStyle = useAnimatedStyle(() => ({
    opacity: meetArchieContinueOpacity.value
  }));

  const contentPadding = useMemo(() => {
    if (scrollHeight === 0 || contentHeight === 0) {
      return spacing.lg;
    }

    if (contentHeight > scrollHeight) {
      return spacing.lg;
    }

    return (scrollHeight - contentHeight) / 2;
  }, [scrollHeight, contentHeight]);

  const contentContainerStyle = useMemo(
    () => [
      styles.content,
      {
        minHeight: contentHeight > 0 && contentHeight <= scrollHeight ? scrollHeight : undefined,
        paddingTop: contentPadding,
        paddingBottom: contentPadding
      }
    ],
    [contentHeight, contentPadding, scrollHeight]
  );

  function toggleItem(list: string[], value: string) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  async function handleContinue() {
    await Haptics.selectionAsync();
    if (step < 3) {
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

  const isMeetArchieStep = step === 2;
  const progressLabel = onboardingProgressLabel(step);
  const headerTextColor = isMeetArchieStep ? colors.text : ONBOARDING_TEXT;
  const headerMutedColor = isMeetArchieStep ? colors.text : ONBOARDING_TEXT_MUTED;

  const screenBody = (
    <View
      style={[
        styles.overlay,
        isMeetArchieStep ? styles.overlayMeetArchie : null,
        { paddingTop: insets.top }
      ]}
    >
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
              <ChevronLeft color={headerTextColor} />
            </Pressable>
          ) : (
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.backChevronSpacer} />
          )}
        </View>
        {isMeetArchieStep ? (
          <View style={styles.brand} />
        ) : (
          <HomemadeLogo align="center" height={36} variant="white" style={styles.brand} />
        )}
        <View style={[styles.topSide, styles.topSideRight]}>
          {progressLabel ? (
            <AppText style={[styles.progress, { color: headerMutedColor }]}>{progressLabel}</AppText>
          ) : (
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.progressSpacer} />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        bounces={!isMeetArchieStep}
        scrollEnabled={!isMeetArchieStep}
        showsVerticalScrollIndicator={false}
        onLayout={(event) => setScrollHeight(event.nativeEvent.layout.height)}
        contentContainerStyle={contentContainerStyle}
      >
        <View
          key={`onboarding-step-${step}`}
          style={styles.step}
          onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}
        >
          {step === 0 ? (
            <>
              <AppText variant="title" style={styles.title}>
                Who are you cooking for?
              </AppText>
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
            </>
          ) : null}

          {step === 1 ? (
            <>
              <AppText variant="title" style={styles.title}>
                Any dietary goals?
              </AppText>
              <AppText style={styles.subtitle}>
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
            </>
          ) : null}

          {step === 2 ? <MeetArchieOnboardingStep /> : null}

          {step === 3 ? (
            <>
              <AppText variant="title" style={styles.title}>
                What should Archie avoid?
              </AppText>
              <AppText style={styles.subtitle}>
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

              <AppText style={styles.subtitle}>
                How should Archie handle pantry items?
              </AppText>
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
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Animated.View style={[styles.primaryBtnWrap, isMeetArchieStep ? meetArchieContinueStyle : undefined]}>
          <Pressable
            accessibilityRole="button"
            disabled={isMeetArchieStep && !meetArchieContinueReady}
            onPress={handleContinue}
            style={[
              styles.primaryBtn,
              { backgroundColor: isMeetArchieStep ? colors.text : colors.brand }
            ]}
          >
            <AppText
              style={[
                styles.primaryLabel,
                { color: isMeetArchieStep ? "#FFFFFF" : colors.brandOnBrand }
              ]}
            >
              {step === 3 ? "Start cooking" : "Continue"}
            </AppText>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );

  return isMeetArchieStep ? (
    <ArchieGradientBackground style={styles.root}>{screenBody}</ArchieGradientBackground>
  ) : (
    <ImageBackground source={ONBOARDING_BG} resizeMode="cover" style={styles.root}>
      {screenBody}
    </ImageBackground>
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
          : styles.chipFrosted
      ]}
    >
      {!selected ? (
        <>
          <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
          <View pointerEvents="none" style={styles.chipFrostTint} />
        </>
      ) : null}
      <AppText
        style={[
          styles.chipText,
          {
            color: selected ? colors.brandOnBrand : ONBOARDING_TEXT,
            fontWeight: selected ? "600" : "500"
          }
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
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.42)",
    flex: 1
  },
  overlayMeetArchie: {
    backgroundColor: "transparent"
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
  progressSpacer: {
    height: 13,
    width: "100%"
  },
  scroll: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding
  },
  step: {
    gap: spacing.lg
  },
  title: {
    color: ONBOARDING_TEXT
  },
  subtitle: {
    color: ONBOARDING_TEXT_MUTED,
    fontFamily,
    fontSize: 15,
    lineHeight: 22
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
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 11
  },
  chipFrosted: {
    backgroundColor: "transparent",
    borderColor: ONBOARDING_CHIP_BORDER
  },
  chipFrostTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: ONBOARDING_CHIP_FROST_TINT
  },
  chipText: {
    fontFamily,
    fontSize: 14
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md
  },
  primaryBtnWrap: {
    alignSelf: "stretch",
    width: "100%"
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
