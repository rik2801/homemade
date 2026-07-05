import { useEffect, useMemo } from "react";
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
export const TAB_MASCOT_SIZE = 54;
export const MASCOT_LIFT = MASCOT_SIZE * 0.8;

const EYE_SCALE = 0.51;
const EYE_TILT = 5;

type MascotMetrics = {
  eyeWidth: number;
  eyeHeight: number;
  eyeGap: number;
  eyesTop: number;
  eyeLookX: number;
  eyeLookDown: number;
};

function getMascotMetrics(size: number): MascotMetrics {
  const eyeWidth = size * 0.18 * EYE_SCALE;
  const eyeHeight = size * 0.28 * EYE_SCALE;

  return {
    eyeWidth,
    eyeHeight,
    eyeGap: eyeWidth * 0.22,
    eyesTop: size * 0.51 - eyeHeight / 2,
    eyeLookX: size * 0.014,
    eyeLookDown: size * 0.038
  };
}

function BlinkingEye({
  scaleY,
  tilt,
  metrics
}: {
  scaleY: SharedValue<number>;
  tilt: number;
  metrics: MascotMetrics;
}) {
  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${tilt}deg` }, { scaleY: scaleY.value }]
  }));

  return (
    <Animated.View
      style={[
        {
          height: metrics.eyeHeight,
          width: metrics.eyeWidth
        },
        eyeStyle
      ]}
    >
      <Svg width={metrics.eyeWidth} height={metrics.eyeHeight} viewBox={`0 0 ${metrics.eyeWidth} ${metrics.eyeHeight}`}>
        <Ellipse
          cx={metrics.eyeWidth / 2}
          cy={metrics.eyeHeight / 2}
          fill="#FFFFFF"
          rx={metrics.eyeWidth / 2}
          ry={metrics.eyeHeight / 2}
        />
      </Svg>
    </Animated.View>
  );
}

function startIdleLookLoop(lookX: SharedValue<number>, eyeLookX: number) {
  cancelAnimation(lookX);
  lookX.value = withRepeat(
    withSequence(
      withDelay(2200, withTiming(-eyeLookX, { duration: 420, easing: Easing.inOut(Easing.quad) })),
      withDelay(1400, withTiming(eyeLookX, { duration: 480, easing: Easing.inOut(Easing.quad) })),
      withDelay(1400, withTiming(0, { duration: 420, easing: Easing.inOut(Easing.quad) }))
    ),
    -1,
    false
  );
}

type ArchieMascotAvatarProps = {
  size?: number;
};

export function ArchieMascotAvatar({ size = MASCOT_SIZE }: ArchieMascotAvatarProps) {
  const archieComposerDraft = useAppStore((state) => state.archieComposerDraft);
  const isLookingDown = archieComposerDraft.length > 0;
  const metrics = useMemo(() => getMascotMetrics(size), [size]);
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
      lookY.value = withTiming(metrics.eyeLookDown, { duration: 280, easing: Easing.inOut(Easing.quad) });
      return;
    }

    lookY.value = withTiming(0, { duration: 280, easing: Easing.inOut(Easing.quad) });
    startIdleLookLoop(lookX, metrics.eyeLookX);
  }, [isLookingDown, lookX, lookY, metrics.eyeLookDown, metrics.eyeLookX]);

  const eyesRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: lookX.value }, { translateY: lookY.value }]
  }));

  return (
    <View
      accessibilityLabel="Archie mascot"
      style={{
        height: size,
        width: size
      }}
    >
      <Image resizeMode="contain" source={ARCHIE_MASCOT_IMAGE} style={{ height: size, width: size }} />
      <View pointerEvents="none" style={styles.eyesLayer}>
        <Animated.View
          style={[
            styles.eyesRow,
            {
              columnGap: metrics.eyeGap,
              top: metrics.eyesTop
            },
            eyesRowStyle
          ]}
        >
          <BlinkingEye metrics={metrics} scaleY={blinkScale} tilt={EYE_TILT} />
          <BlinkingEye metrics={metrics} scaleY={blinkScale} tilt={-EYE_TILT} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eyesLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center"
  },
  eyesRow: {
    flexDirection: "row",
    position: "absolute"
  }
});
