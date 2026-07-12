import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { CookingBowlIllustration } from "@/components/profile/ProfileIcons";
import { PROFILE_COLORS } from "@/components/profile/profileColors";
import { useAppTheme } from "@/hooks/useAppTheme";
import { fontFamily } from "@/theme/typography";

export function ProfileSummaryCard() {
  const { colors, isDark } = useAppTheme();
  const gradientStart = isDark ? colors.brandOliveSoft : PROFILE_COLORS.summaryStart;
  const gradientEnd = isDark ? "#2A3318" : PROFILE_COLORS.summaryEnd;
  const titleColor = isDark ? colors.text : PROFILE_COLORS.primaryText;
  const subtitleColor = isDark ? colors.muted : PROFILE_COLORS.summarySubtitle;

  return (
    <View
      style={[
        styles.summaryCard,
        { backgroundColor: isDark ? colors.brandOliveSoft : PROFILE_COLORS.summarySolid }
      ]}
    >
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="profileSummaryGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={gradientStart} />
            <Stop offset="1" stopColor={gradientEnd} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#profileSummaryGrad)" />
      </Svg>

      <View style={styles.summaryText}>
        <AppText style={[styles.summaryTitle, { color: titleColor }]}>Your cooking profile</AppText>
        <AppText style={[styles.summarySubtitle, { color: subtitleColor }]}>
          Personalized for better answers
        </AppText>
      </View>

      <View style={styles.summaryIllustration} importantForAccessibility="no">
        <CookingBowlIllustration size={72} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    minHeight: 112,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden"
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12
  },
  summaryTitle: {
    fontFamily,
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: -0.2
  },
  summarySubtitle: {
    marginTop: 4,
    fontFamily,
    fontSize: 10,
    lineHeight: 14
  },
  summaryIllustration: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  }
});
