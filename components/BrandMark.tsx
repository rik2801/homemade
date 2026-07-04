import Svg, { Ellipse, G, Path, Rect } from "react-native-svg";
import { useAppTheme } from "@/hooks/useAppTheme";

type BrandMarkProps = {
  size?: number;
};

export function BrandMark({ size = 48 }: BrandMarkProps) {
  const { colors } = useAppTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityLabel="Homemade">
      <Rect width="48" height="48" rx="24" fill={colors.tomato} />
      <G rotation="26" origin="24 24">
        <Ellipse cx="24" cy="24" rx="15" ry="9" fill={colors.surfaceButter} />
        <Path
          d="M14 23C18 17 28 15 35 19C30 19 22 23 17 29C15.8 27.6 14.8 25.6 14 23Z"
          fill="#FFF3C8"
          opacity="0.72"
        />
      </G>
    </Svg>
  );
}
