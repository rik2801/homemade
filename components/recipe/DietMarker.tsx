import { View, StyleSheet } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import type { DietType } from "@/types/recipe";

const MARKER_SIZE = 16;

const dietColors = {
  vegetarian: {
    border: "#155A19",
    fill: "#52A447"
  },
  "non-vegetarian": {
    border: "#6B3410",
    fill: "#8B4513"
  },
  vegan: {
    border: "#155A19",
    fill: "#52A447"
  }
} as const;

const accessibilityLabels: Record<DietType, string> = {
  vegetarian: "Vegetarian",
  "non-vegetarian": "Non-vegetarian",
  vegan: "Vegan"
};

type DietMarkerProps = {
  dietType: DietType;
};

export function DietMarker({ dietType }: DietMarkerProps) {
  const colors = dietColors[dietType];

  return (
    <View
      accessibilityLabel={accessibilityLabels[dietType]}
      accessibilityRole="image"
      style={styles.wrap}
    >
      <Svg width={MARKER_SIZE} height={MARKER_SIZE} viewBox="0 0 16 16">
        <Rect
          x={0.75}
          y={0.75}
          width={14.5}
          height={14.5}
          fill="#FFFFFF"
          stroke={colors.border}
          strokeWidth={1.25}
        />
        {dietType === "vegetarian" ? (
          <Circle cx={8} cy={8} r={4.25} fill={colors.fill} />
        ) : null}
        {dietType === "non-vegetarian" ? (
          <Path d="M8 4.25 L11.75 11.25 H4.25 Z" fill={colors.fill} />
        ) : null}
        {dietType === "vegan" ? (
          <>
            <Path
              d="M8 12.75 C8 12.75 4.5 10.1 4.5 6.75 C4.5 5 5.75 3.75 8 3.75 C10.25 3.75 11.5 5 11.5 6.75 C11.5 10.1 8 12.75 8 12.75 Z"
              fill={colors.fill}
            />
            <Path
              d="M8 12.5 V6.5"
              stroke="#FFFFFF"
              strokeLinecap="round"
              strokeWidth={0.85}
            />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start"
  }
});
