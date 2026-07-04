import { Canvas, Circle, Group, Path, RoundedRect } from "@shopify/react-native-skia";
import { StyleSheet, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

export function FoodCanvas() {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: isDark ? "#303722" : "#EEF1D8" }]}>
      <Canvas style={styles.canvas}>
        <RoundedRect x={0} y={0} width={292} height={132} r={24} color={isDark ? "#303722" : "#EEF1D8"} />
        <Circle cx={146} cy={72} r={45} color={colors.canvas} />
        <Circle cx={146} cy={72} r={30} color={isDark ? "#3B3027" : "#FFF6E4"} />
        <Circle cx={126} cy={78} r={17} color={isDark ? "#6F5A38" : "#E5D4AC"} />
        <Group transform={[{ rotate: -0.45 }, { translateX: -18 }, { translateY: 82 }]}>
          <Path
            path="M116 0 C154 -22 196 -12 226 13 C186 31 148 24 116 0Z"
            color={colors.surfaceButter}
          />
        </Group>
        <Group transform={[{ rotate: -0.48 }, { translateX: 139 }, { translateY: 31 }]}>
          <Path path="M0 18 C22 -5 49 -3 66 7 C47 31 21 36 0 18Z" color={colors.basil} />
        </Group>
        <Group transform={[{ rotate: 0.38 }, { translateX: 194 }, { translateY: 79 }]}>
          <Path path="M0 12 C18 -4 42 -2 56 8 C40 26 16 29 0 12Z" color={colors.basil} />
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 132,
    borderRadius: 24,
    overflow: "hidden"
  },
  canvas: {
    flex: 1
  }
});
