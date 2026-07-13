import { StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import type { IngredientIcon as IconType } from "@/types/recipe";

const thumbColors: Record<IconType, string> = {
  tomato: "#FFF0EE",
  milk: "#F8F6FF",
  onion: "#FAF5F0",
  garlic: "#F9F9F7",
  broth: "#F5F0E8",
  oil: "#F4F8F0",
  salt: "#F7F7F7",
  pepper: "#F3F3F3",
  yogurt: "#F5F8FF",
  herb: "#EEF6EE"
};

function IconSvg({ type }: { type: IconType }) {
  switch (type) {
    case "tomato":
      return (
        <Svg width={20} height={20} viewBox="0 0 32 32">
          <Rect x={6} y={10} width={20} height={18} rx={3} fill="#E8E8E8" />
          <Rect x={8} y={12} width={16} height={14} rx={2} fill="#D63D2A" />
          <Path d="M14 10V7a2 2 0 0 1 4 0v3" fill="#4A9E4A" />
        </Svg>
      );
    case "milk":
      return (
        <Svg width={20} height={20} viewBox="0 0 32 32">
          <Path d="M11 6h10l3 8H8l3-8z" fill="#F0EEFF" />
          <Path d="M8 14h16v12c0 1.1-.9 2-2 2H10c-1.1 0-2-.9-2-2V14z" fill="#FFF" />
        </Svg>
      );
    case "yogurt":
      return (
        <Svg width={20} height={20} viewBox="0 0 32 32">
          <Path d="M9 10h14l2 4H7l2-4z" fill="#E8EEF8" />
          <Rect x={8} y={14} width={16} height={12} rx={3} fill="#FFF" />
        </Svg>
      );
    case "onion":
      return (
        <Svg width={20} height={20} viewBox="0 0 32 32">
          <Ellipse cx={16} cy={18} rx={10} ry={9} fill="#E8D4B8" />
          <Ellipse cx={16} cy={18} rx={7} ry={6.5} fill="#D4BC9A" />
        </Svg>
      );
    case "garlic":
      return (
        <Svg width={20} height={20} viewBox="0 0 32 32">
          <Ellipse cx={16} cy={20} rx={8} ry={9} fill="#F5F2E8" />
          <Ellipse cx={13} cy={18} rx={3} ry={5} fill="#EBE6D8" />
        </Svg>
      );
    case "broth":
      return (
        <Svg width={20} height={20} viewBox="0 0 32 32">
          <Ellipse cx={16} cy={22} rx={12} ry={4} fill="#D4C4A8" />
          <Path d="M6 14h20v8c0 2.2-4.5 4-10 4s-10-1.8-10-4v-8z" fill="#C9A86C" />
        </Svg>
      );
    case "oil":
      return (
        <Svg width={20} height={20} viewBox="0 0 32 32">
          <Rect x={12} y={8} width={8} height={3} fill="#8AAB5C" />
          <Path d="M11 11h10l-1 17c0 .6-.4 1-1 1h-6c-.6 0-1-.4-1-1L11 11z" fill="#A8C46C" />
        </Svg>
      );
    case "salt":
      return (
        <Svg width={20} height={20} viewBox="0 0 32 32">
          <Rect x={11} y={6} width={10} height={4} rx={1} fill="#E0E0E0" />
          <Path d="M10 10h12l-1 16c0 .6-.5 1-1 1h-8c-.5 0-1-.4-1-1L10 10z" fill="#F5F5F5" />
        </Svg>
      );
    case "pepper":
      return (
        <Svg width={20} height={20} viewBox="0 0 32 32">
          <Circle cx={14} cy={20} r={3} fill="#2A2A2A" />
          <Circle cx={18} cy={17} r={2.5} fill="#3D3D3D" />
        </Svg>
      );
    default:
      return (
        <Svg width={20} height={20} viewBox="0 0 32 32">
          <Path d="M16 26V14" stroke="#5A9E4A" strokeWidth={2} strokeLinecap="round" />
          <Path d="M16 18c-4-6-8-4-8-8s4-2 8 2" stroke="#6CB85C" strokeWidth={2} fill="none" />
        </Svg>
      );
  }
}

type IngredientIconProps = {
  icon: IconType;
  size?: number;
  showSwapDot?: boolean;
};

export function IngredientIcon({ icon, size = 24, showSwapDot }: IngredientIconProps) {
  const borderRadius = Math.max(7, Math.round(size * 0.32));

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.thumb,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: thumbColors[icon]
          }
        ]}
      >
        <IconSvg type={icon} />
      </View>
      {showSwapDot ? <View style={styles.dot} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative"
  },
  thumb: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  dot: {
    backgroundColor: "#FF3B30",
    borderColor: "#FFFFFF",
    borderRadius: 7,
    borderWidth: 1.5,
    height: 14,
    position: "absolute",
    right: -2,
    top: -2,
    width: 14
  }
});
