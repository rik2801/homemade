import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { ArchieMascotAvatar } from "@/components/archie/ArchieMascotAvatar";
import {
  MARQUEE_GAP,
  PromptMarquee,
  useMarqueePlaybackEnabled
} from "@/components/onboarding/PromptMarquee";
import { layout, spacing } from "@/theme/spacing";
import { archieBrandColor, archieEmphasisStyle, archieFontFamily, archieTextScale, fontFamily } from "@/theme/typography";

const REVEAL_STEP_MS = 1000;
const REVEAL_FADE_MS = 520;

export const MEET_ARCHIE_CONTINUE_DELAY_MS = REVEAL_STEP_MS * 4;
export const MEET_ARCHIE_REVEAL_FADE_MS = REVEAL_FADE_MS;

const TITLE_DELAY_MS = 0;
const TAGLINE_DELAY_MS = REVEAL_STEP_MS;
const MASCOT_DELAY_MS = REVEAL_STEP_MS * 2;
const MARQUEE_DELAY_MS = REVEAL_STEP_MS * 3;
const MASCOT_SIZE = Math.round(196 * 1.3 * 1.15);
const MEET_ARCHIE_TEXT = "#111827";
const TITLE_FONT_SIZE = 30;
const TITLE_ARCHIE_GAP_REDUCTION = 0.3;
const MEET_TEXT_OPACITY = 0.58;
const TAGLINE_FONT_WEIGHT = "300";

const ARCHIE_PROMPTS_TOP = [
  "What can I swap for heavy cream?",
  "Make this recipe dairy-free",
  "Use what's already in my pantry",
  "Suggest a lower-sodium version"
] as const;

const ARCHIE_PROMPTS_BOTTOM = [
  "What can I use instead of eggs?",
  "Make this recipe gluten-free",
  "Help me use leftover vegetables",
  "Suggest a healthier alternative"
] as const;

export function MeetArchieOnboardingStep() {
  const titleOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const mascotOpacity = useSharedValue(0);
  const marqueeOpacity = useSharedValue(0);
  const [marqueeReady, setMarqueeReady] = useState(false);
  const marqueeAnimating = useMarqueePlaybackEnabled();

  useEffect(() => {
    titleOpacity.value = 0;
    taglineOpacity.value = 0;
    mascotOpacity.value = 0;
    marqueeOpacity.value = 0;
    setMarqueeReady(false);

    const titleTimer = setTimeout(() => {
      titleOpacity.value = withTiming(1, { duration: REVEAL_FADE_MS });
    }, TITLE_DELAY_MS);

    const taglineTimer = setTimeout(() => {
      taglineOpacity.value = withTiming(1, { duration: REVEAL_FADE_MS });
    }, TAGLINE_DELAY_MS);

    const mascotTimer = setTimeout(() => {
      mascotOpacity.value = withTiming(1, { duration: REVEAL_FADE_MS });
    }, MASCOT_DELAY_MS);

    const marqueeTimer = setTimeout(() => {
      setMarqueeReady(true);
      marqueeOpacity.value = withTiming(1, { duration: REVEAL_FADE_MS });
    }, MARQUEE_DELAY_MS);

    return () => {
      clearTimeout(titleTimer);
      clearTimeout(taglineTimer);
      clearTimeout(mascotTimer);
      clearTimeout(marqueeTimer);
    };
  }, [marqueeOpacity, mascotOpacity, taglineOpacity, titleOpacity]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value
  }));

  const mascotStyle = useAnimatedStyle(() => ({
    opacity: mascotOpacity.value
  }));

  const marqueeStyle = useAnimatedStyle(() => ({
    opacity: marqueeOpacity.value
  }));

  return (
    <View style={styles.root}>
      <View style={styles.headerBlock}>
        <Animated.View style={[titleStyle, styles.titleWrap]}>
          <Text style={styles.title}>
            <Text style={styles.meetWord}>Meet</Text>
            <Text style={styles.archieWord}> Archie.</Text>
          </Text>
        </Animated.View>
        <Animated.View style={taglineStyle}>
          <View style={styles.taglineBlock}>
            <Text style={styles.tagline}>Your AI cooking assistant</Text>
            <Text style={styles.tagline}>for smarter, easier meals.</Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.mascotWrap, mascotStyle]}>
        <ArchieMascotAvatar size={MASCOT_SIZE} />
      </Animated.View>

      <Animated.View pointerEvents="none" style={[styles.marqueeStack, marqueeStyle]}>
        <PromptMarquee
          animate={marqueeAnimating && marqueeReady}
          direction="left"
          duration={22000}
          prompts={ARCHIE_PROMPTS_TOP}
        />
        <PromptMarquee
          animate={marqueeAnimating && marqueeReady}
          direction="right"
          duration={24000}
          prompts={ARCHIE_PROMPTS_BOTTOM}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    gap: spacing.lg,
    width: "100%"
  },
  titleWrap: {
    overflow: "visible",
    width: "100%"
  },
  title: {
    includeFontPadding: false,
    lineHeight: Math.round(TITLE_FONT_SIZE * archieTextScale * 1.18),
    paddingVertical: 4,
    textAlign: "center",
    width: "100%"
  },
  meetWord: {
    color: MEET_ARCHIE_TEXT,
    fontFamily,
    fontSize: TITLE_FONT_SIZE,
    fontWeight: "400",
    letterSpacing: -0.6,
    opacity: MEET_TEXT_OPACITY
  },
  archieWord: {
    color: archieBrandColor,
    fontFamily: archieFontFamily,
    fontSize: Math.round(TITLE_FONT_SIZE * archieTextScale),
    includeFontPadding: false,
    letterSpacing: -0.6,
    lineHeight: Math.round(TITLE_FONT_SIZE * archieTextScale * 1.08),
    marginLeft: -Math.round(TITLE_FONT_SIZE * 0.4 * TITLE_ARCHIE_GAP_REDUCTION),
    paddingTop: 2,
    ...archieEmphasisStyle(archieBrandColor)
  },
  headerBlock: {
    alignItems: "center",
    gap: spacing.sm,
    width: "100%"
  },
  taglineBlock: {
    alignItems: "center",
    gap: 2,
    width: "100%"
  },
  tagline: {
    color: MEET_ARCHIE_TEXT,
    fontFamily,
    fontSize: 15,
    fontWeight: TAGLINE_FONT_WEIGHT,
    lineHeight: 22,
    opacity: MEET_TEXT_OPACITY,
    textAlign: "center",
    width: "100%"
  },
  mascotWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: MASCOT_SIZE
  },
  marqueeStack: {
    alignSelf: "stretch",
    gap: MARQUEE_GAP,
    marginHorizontal: -layout.screenPadding,
    marginTop: spacing.xs
  }
});
