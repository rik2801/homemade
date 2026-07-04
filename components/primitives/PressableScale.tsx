import type { ReactNode } from "react";
import { Pressable, type PressableProps, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";

type PressableScaleProps = PressableProps & {
  children: ReactNode;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({ children, onPressIn, onPressOut, style, ...props }: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(event) => {
        scale.value = withSpring(0.97, { damping: 18, stiffness: 420 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, { damping: 16, stiffness: 360 });
        onPressOut?.(event);
      }}
      style={[styles.pressable, animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    overflow: "hidden"
  }
});
