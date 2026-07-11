import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  AppState,
  type LayoutChangeEvent,
  StyleSheet,
  View
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from "react-native-reanimated";
import { AppText } from "@/components/primitives/AppText";
import { fontFamily } from "@/theme/typography";
import { radius } from "@/theme/spacing";

const PROMPT_TEXT = "#111827";
const PILL_BG = "rgba(17, 24, 39, 0.1)";
const PILL_BORDER = "rgba(17, 24, 39, 0.16)";
const PILL_BORDER_WIDTH = 1.1;
export const MARQUEE_GAP = 11;
const ROW_HEIGHT = 38;

type PromptMarqueeProps = {
  prompts: readonly string[];
  direction: "left" | "right";
  duration: number;
  animate?: boolean;
};

export function useMarqueePlaybackEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function syncPlayback() {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      if (!mounted) return;
      setEnabled(!reduceMotion && AppState.currentState === "active");
    }

    void syncPlayback();

    const reduceMotionSub = AccessibilityInfo.addEventListener("reduceMotionChanged", (reduceMotion) => {
      setEnabled(!reduceMotion && AppState.currentState === "active");
    });

    const appStateSub = AppState.addEventListener("change", (state) => {
      void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
        if (!mounted) return;
        setEnabled(!reduceMotion && state === "active");
      });
    });

    return () => {
      mounted = false;
      reduceMotionSub.remove();
      appStateSub.remove();
    };
  }, []);

  return enabled;
}

export function PromptMarquee({ prompts, direction, duration, animate = true }: PromptMarqueeProps) {
  const [groupWidth, setGroupWidth] = useState(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(translateX);

    if (!animate || groupWidth <= 0) {
      translateX.value = 0;
      return;
    }

    const loopWidth = groupWidth + MARQUEE_GAP;
    const from = direction === "left" ? 0 : -loopWidth;
    const to = direction === "left" ? -loopWidth : 0;

    translateX.value = from;
    translateX.value = withRepeat(
      withTiming(to, { duration, easing: Easing.linear }),
      -1,
      false
    );

    return () => cancelAnimation(translateX);
  }, [animate, direction, duration, groupWidth, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  function handleGroupLayout(event: LayoutChangeEvent) {
    const width = Math.round(event.nativeEvent.layout.width);
    if (width > 0 && width !== groupWidth) {
      setGroupWidth(width);
    }
  }

  return (
    <View style={styles.marqueeClip} pointerEvents="none">
      <Animated.View style={[styles.track, animate ? animatedStyle : undefined]}>
        <View style={styles.group} onLayout={handleGroupLayout}>
          {prompts.map((prompt) => (
            <PromptPill key={`a-${prompt}`} label={prompt} />
          ))}
        </View>
        {animate ? (
          <View style={styles.group}>
            {prompts.map((prompt) => (
              <PromptPill key={`b-${prompt}`} label={prompt} />
            ))}
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

function PromptPill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <AppText style={styles.pillText}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  marqueeClip: {
    height: ROW_HEIGHT,
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  track: {
    flexDirection: "row",
    gap: MARQUEE_GAP
  },
  group: {
    flexDirection: "row",
    gap: MARQUEE_GAP
  },
  pill: {
    backgroundColor: PILL_BG,
    borderColor: PILL_BORDER,
    borderRadius: radius.pill,
    borderWidth: PILL_BORDER_WIDTH,
    paddingHorizontal: 13,
    paddingVertical: 9
  },
  pillText: {
    color: PROMPT_TEXT,
    fontFamily,
    fontSize: 14,
    lineHeight: 18
  }
});
