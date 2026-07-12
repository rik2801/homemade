import {
  Blend,
  Canvas,
  Fill,
  FractalNoise,
  LinearGradient,
  vec
} from "@shopify/react-native-skia";
import type { ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useEffect } from "react";

type ArchieGradientBackgroundProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Full-strength by default; pass a lower value once conversation starts. */
  gradientOpacity?: number;
  /** Base color beneath the gradient canvas. */
  underlayColor?: string;
};

/** Homemade aura palette used for the Meet Archie gradient. */
export const ARCHIE_AURA_COLORS = {
  deepPurple: "#7131FE",
  brightPurple: "#8E46FF",
  orange: "#FF4A23",
  hotPink: "#FF65A1",
  candyPink: "#FF88F2",
  lavender: "#EF7CFF",
  coral: "#FA7EA1",
  violet: "#863FFF"
} as const;

const GRADIENT_FADE_MS = 360;
const BASE_UNDERLAY_LIGHT = "#FFF7FB";

export function ArchieGradientBackground({
  children,
  style,
  gradientOpacity = 1,
  underlayColor
}: ArchieGradientBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const opacity = useSharedValue(gradientOpacity);
  const baseColor = underlayColor ?? BASE_UNDERLAY_LIGHT;

  useEffect(() => {
    opacity.value = withTiming(gradientOpacity, { duration: GRADIENT_FADE_MS });
  }, [gradientOpacity, opacity]);

  const canvasStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));

  return (
    <View style={[styles.root, { backgroundColor: baseColor }, style]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, canvasStyle]}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Fill>
            <Blend mode="softLight">
              <Blend mode="screen">
                <LinearGradient
                  colors={[
                    ARCHIE_AURA_COLORS.deepPurple,
                    ARCHIE_AURA_COLORS.violet,
                    ARCHIE_AURA_COLORS.hotPink,
                    ARCHIE_AURA_COLORS.orange
                  ]}
                  end={vec(width, height * 0.92)}
                  positions={[0, 0.32, 0.68, 1]}
                  start={vec(0, 0)}
                />
                <LinearGradient
                  colors={[
                    ARCHIE_AURA_COLORS.lavender,
                    ARCHIE_AURA_COLORS.candyPink,
                    ARCHIE_AURA_COLORS.coral,
                    ARCHIE_AURA_COLORS.brightPurple
                  ]}
                  end={vec(width * 0.15, height)}
                  positions={[0, 0.38, 0.72, 1]}
                  start={vec(width, 0)}
                />
              </Blend>
              <FractalNoise
                freqX={0.004}
                freqY={0.014}
                octaves={4}
                seed={18}
                tileHeight={height}
                tileWidth={width}
              />
            </Blend>
          </Fill>
        </Canvas>
      </Animated.View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  }
});
