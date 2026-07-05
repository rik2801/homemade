import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import Svg, { Ellipse } from "react-native-svg";
import { useAppStore } from "@/store/useAppStore";

export const ARCHIE_MASCOT_IMAGE = require("@/assets/images/MASCOT-HOMEMADE.png");
export const MASCOT_SIZE = 250;
export const MASCOT_LIFT = MASCOT_SIZE * 0.8;

// Tuned to match reference: large vertical ovals, centered on the fruit face.
const EYE_SCALE = 0.51;
const EYE_WIDTH = MASCOT_SIZE * 0.18 * EYE_SCALE;
const EYE_HEIGHT = MASCOT_SIZE * 0.28 * EYE_SCALE;
const EYE_GAP = EYE_WIDTH * 0.22;
const EYES_CENTER_Y = MASCOT_SIZE * 0.51;
const EYES_TOP = EYES_CENTER_Y - EYE_HEIGHT / 2;
const EYE_TILT = 5;
const EYE_LOOK_X = MASCOT_SIZE * 0.014;
const EYE_LOOK_DOWN = MASCOT_SIZE * 0.038;

function BlinkingEye({
  scaleY,
  tilt
}: {
  scaleY: SharedValue<number>;
  tilt: number;
}) {
  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${tilt}deg` }, { scaleY: scaleY.value }]
  }));

  return (
    <Animated.View style={[styles.eyeWrap, eyeStyle]}>
      <Svg width={EYE_WIDTH} height={EYE_HEIGHT} viewBox={`0 0 ${EYE_WIDTH} ${EYE_HEIGHT}`}>
        <Ellipse
          cx={EYE_WIDTH / 2}
          cy={EYE_HEIGHT / 2}
          fill="#FFFFFF"
          rx={EYE_WIDTH / 2}
          ry={EYE_HEIGHT / 2}
        />
      </Svg>
    </Animated.View>
  );
}

function startIdleLookLoop(lookX: SharedValue<number>) {
  cancelAnimation(lookX);
  lookX.value = withRepeat(
    withSequence(
      withDelay(2200, withTiming(-EYE_LOOK_X, { duration: 420, easing: Easing.inOut(Easing.quad) })),
      withDelay(1400, withTiming(EYE_LOOK_X, { duration: 480, easing: Easing.inOut(Easing.quad) })),
      withDelay(1400, withTiming(0, { duration: 420, easing: Easing.inOut(Easing.quad) }))
    ),
    -1,
    false
  );
}

export function ArchieMascotAvatar() {
  const archieComposerDraft = useAppStore((state) => state.archieComposerDraft);
  const isLookingDown = archieComposerDraft.length > 0;
  const blinkScale = useSharedValue(1);
  const lookX = useSharedValue(0);
  const lookY = useSharedValue(0);

  useEffect(() => {
    blinkScale.value = withRepeat(
      withSequence(
        withDelay(
          3200,
          withSequence(
            withTiming(0.06, { duration: 90, easing: Easing.in(Easing.quad) }),
            withTiming(0.06, { duration: 50 }),
            withTiming(1, { duration: 110, easing: Easing.out(Easing.quad) })
          )
        )
      ),
      -1,
      false
    );
  }, [blinkScale]);

  useEffect(() => {
    if (isLookingDown) {
      cancelAnimation(lookX);
      lookX.value = withTiming(0, { duration: 200, easing: Easing.inOut(Easing.quad) });
      lookY.value = withTiming(EYE_LOOK_DOWN, { duration: 280, easing: Easing.inOut(Easing.quad) });
      return;
    }

    lookY.value = withTiming(0, { duration: 280, easing: Easing.inOut(Easing.quad) });
    startIdleLookLoop(lookX);
  }, [isLookingDown, lookX, lookY]);

  const eyesRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: lookX.value }, { translateY: lookY.value }]
  }));

  return (
    <View accessibilityLabel="Archie mascot" style={styles.stage}>
      <Image resizeMode="contain" source={ARCHIE_MASCOT_IMAGE} style={styles.mascotImage} />
      <View pointerEvents="none" style={styles.eyesLayer}>
        <Animated.View style={[styles.eyesRow, eyesRowStyle]}>
          <BlinkingEye scaleY={blinkScale} tilt={EYE_TILT} />
          <BlinkingEye scaleY={blinkScale} tilt={-EYE_TILT} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: MASCOT_SIZE,
    width: MASCOT_SIZE
  },
  mascotImage: {
    height: MASCOT_SIZE,
    width: MASCOT_SIZE
  },
  eyesLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center"
  },
  eyesRow: {
    columnGap: EYE_GAP,
    flexDirection: "row",
    position: "absolute",
    top: EYES_TOP
  },
  eyeWrap: {
    height: EYE_HEIGHT,
    width: EYE_WIDTH
  }
});
