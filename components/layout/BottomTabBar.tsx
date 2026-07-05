import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import type { TabName } from "@/types/recipe";
import { spacing } from "@/theme/spacing";

type TabIconType = "home" | "recipes" | "archie" | "profile";

const ISLAND_MARGIN = 32;
const ISLAND_VERTICAL_PADDING = 8;
export const TAB_ISLAND_HEIGHT = 76;
const INDICATOR_SIZE = 60;
const INDICATOR_TOP = 8;
const CAP_CENTER = TAB_ISLAND_HEIGHT / 2;
const TAB_COUNT = 4;
const ACTIVE_INDICATOR_COLOR = "#ECC218";
const ISLAND_BACKGROUND = "#FFFFFF";
const TAB_BAR_LOW_OFFSET_SCALE = 0.15;
const TAB_BAR_LIFT_RATIO = 0.3 / 3;
const ISLAND_BOTTOM_GAP = Math.round(spacing.sm * 1.3);
const TAB_BAR_VIGNETTE_EXTRA = spacing.xxl;
const ARCHIE_ICON_SIZE = 38;
const RECIPES_ICON_SIZE = 24;
const HOME_ICON_SIZE = 26;
const PROFILE_ICON_SIZE = 26;
const ARCHIE_ACTIVE_ICON_COLOR = "#FFFFFF";
const ARCHIE_GRADIENT = {
  purple: "#6531FF",
  magenta: "#DA4A9F",
  pink: "#E273FD",
  coral: "#FF608B"
} as const;

export function tabBarBottomOffset(bottomInset: number) {
  const baseOffset = Math.max(bottomInset, spacing.sm) + spacing.sm;
  const lowOffset = baseOffset * TAB_BAR_LOW_OFFSET_SCALE;
  const liftedOffset = bottomInset + ISLAND_BOTTOM_GAP;
  return lowOffset + (liftedOffset - lowOffset) * TAB_BAR_LIFT_RATIO;
}

export function floatingTabBarScrollInset(bottomInset: number) {
  return TAB_ISLAND_HEIGHT + tabBarBottomOffset(bottomInset) + spacing.sm;
}

const tabs: { key: TabName; label: string; icon: TabIconType }[] = [
  { key: "home", label: "Home", icon: "home" },
  { key: "recipes", label: "Recipes", icon: "recipes" },
  { key: "archie", label: "Archie", icon: "archie" },
  { key: "profile", label: "Profile", icon: "profile" }
];

function indicatorLeftForIndex(index: number, tabWidth: number, islandWidth: number) {
  if (index === 0) {
    return CAP_CENTER - INDICATOR_SIZE / 2;
  }
  if (index === TAB_COUNT - 1) {
    return islandWidth - CAP_CENTER - INDICATOR_SIZE / 2;
  }
  return index * tabWidth + tabWidth / 2 - INDICATOR_SIZE / 2;
}

function tabSlotLeft(index: number, tabWidth: number, islandWidth: number) {
  return indicatorLeftForIndex(index, tabWidth, islandWidth);
}

function TabBarBottomVignette({ color, height, width }: { color: string; height: number; width: number }) {
  return (
    <Svg pointerEvents="none" width={width} height={height} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="tabBarBottomVignette" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={color} stopOpacity="1" />
          <Stop offset="0.22" stopColor={color} stopOpacity="1" />
          <Stop offset="0.45" stopColor={color} stopOpacity="0.93" />
          <Stop offset="0.68" stopColor={color} stopOpacity="0.42" />
          <Stop offset="0.86" stopColor={color} stopOpacity="0.12" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#tabBarBottomVignette)" />
    </Svg>
  );
}

function ArchieActiveIndicator() {
  const radius = INDICATOR_SIZE / 2;

  return (
    <Svg height={INDICATOR_SIZE} pointerEvents="none" viewBox={`0 0 ${INDICATOR_SIZE} ${INDICATOR_SIZE}`} width={INDICATOR_SIZE}>
      <Defs>
        <RadialGradient
          cx="32%"
          cy="24%"
          fx="18%"
          fy="12%"
          gradientUnits="objectBoundingBox"
          id="archieActiveIndicator"
          rx="78%"
          ry="78%"
        >
          <Stop offset="0" stopColor={ARCHIE_GRADIENT.pink} />
          <Stop offset="0.34" stopColor={ARCHIE_GRADIENT.coral} />
          <Stop offset="0.62" stopColor={ARCHIE_GRADIENT.magenta} />
          <Stop offset="1" stopColor={ARCHIE_GRADIENT.purple} />
        </RadialGradient>
      </Defs>
      <Circle cx={radius} cy={radius} fill="url(#archieActiveIndicator)" r={radius} />
    </Svg>
  );
}

function tabIconTint(tab: TabIconType, active: boolean, brandOnBrand: string, tabInactive: string) {
  if (!active) return tabInactive;
  if (tab === "archie") return ARCHIE_ACTIVE_ICON_COLOR;
  return brandOnBrand;
}

function TabIcon({ type, color }: { type: TabIconType; color: string }) {
  if (type === "home") {
    return (
      <Svg width={HOME_ICON_SIZE} height={HOME_ICON_SIZE} viewBox="0 0 24 24" fill="none">
        <Path
          fill={color}
          d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"
        />
      </Svg>
    );
  }

  if (type === "recipes") {
    return (
      <Svg width={RECIPES_ICON_SIZE} height={RECIPES_ICON_SIZE} viewBox="0 0 24 24" fill="none">
        <Path
          clipRule="evenodd"
          fill={color}
          fillRule="evenodd"
          d="M9 2.3h9.5a.7.7 0 0 1 .7.7v18.8a.7.7 0 0 1-.7.7H9a5 5 0 0 1-5-5V7a5 5 0 0 1 5-4.7z M9 6.9h5a.65.65 0 0 1 0 1.3H9a.65.65 0 0 1 0-1.3z M17.4 16.8H4.2V19Q4.2 22.9 9 22.9h8.4V16.8z"
        />
      </Svg>
    );
  }

  if (type === "archie") {
    return (
      <Svg width={ARCHIE_ICON_SIZE} height={ARCHIE_ICON_SIZE} viewBox="0 0 24 24" fill="none">
        <Path
          fill={color}
          d="M9 6.5c1 3.5 3 5.5 6 6.2-3 .7-5 2.7-6 6.2-1-3.5-3-5.5-6-6.2 3-.7 5-2.7 6-6.2z"
        />
        <Path
          fill={color}
          d="M18 3.5c.5 1.7 1.5 2.5 3.2 2.8-1.7.3-2.7 1.1-3.2 2.8-.5-1.7-1.5-2.5-3.2-2.8 1.7-.3 2.7-1.1 3.2-2.8z"
        />
      </Svg>
    );
  }

  return (
    <Svg width={PROFILE_ICON_SIZE} height={PROFILE_ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} fill={color} />
      <Path fill={color} d="M4 20c0-4 3.6-7 8-7s8 3 8 7v1H4v-1z" />
    </Svg>
  );
}

export function BottomTabBar() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { colors, scheme } = useAppTheme();
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  const islandWidth = windowWidth - ISLAND_MARGIN * 2;
  const tabWidth = islandWidth / TAB_COUNT;
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.key === activeTab));
  const indicatorLeft = useSharedValue(indicatorLeftForIndex(activeIndex, tabWidth, islandWidth));

  useEffect(() => {
    indicatorLeft.value = withSpring(indicatorLeftForIndex(activeIndex, tabWidth, islandWidth), {
      dampingRatio: 1,
      duration: 280
    });
  }, [activeIndex, indicatorLeft, islandWidth, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorLeft.value
  }));

  async function handlePress(tab: TabName) {
    await Haptics.selectionAsync();
    setActiveTab(tab);
  }

  const bottomOffset = tabBarBottomOffset(insets.bottom);
  const vignetteHeight = bottomOffset + TAB_ISLAND_HEIGHT + TAB_BAR_VIGNETTE_EXTRA;

  return (
    <>
      <View pointerEvents="none" style={[styles.vignetteShell, { height: vignetteHeight }]}>
        <TabBarBottomVignette color={colors.background} height={vignetteHeight} width={windowWidth} />
      </View>
      <View pointerEvents="box-none" style={[styles.shell, { bottom: bottomOffset }]}>
      <View
        style={[
          styles.islandShadow,
          {
            shadowColor: scheme === "dark" ? "#000000" : "#111827",
            width: islandWidth
          }
        ]}
      >
        <View style={[styles.island, { width: islandWidth }]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activeIndicator,
              indicatorStyle,
              activeTab !== "archie" && styles.activeIndicatorDefault
            ]}
          >
            {activeTab === "archie" ? <ArchieActiveIndicator /> : null}
          </Animated.View>
          {tabs.map((tab, index) => {
            const active = activeTab === tab.key;
            const tint = tabIconTint(tab.icon, active, colors.brandOnBrand, colors.tabInactive);
            const slotLeft = tabSlotLeft(index, tabWidth, islandWidth);

            return (
              <Pressable
                key={tab.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={tab.label}
                onPress={() => handlePress(tab.key)}
                style={[
                  styles.tab,
                  {
                    height: INDICATOR_SIZE,
                    left: slotLeft,
                    top: INDICATOR_TOP,
                    width: INDICATOR_SIZE
                  }
                ]}
              >
                <TabIcon type={tab.icon} color={tint} />
              </Pressable>
            );
          })}
        </View>
      </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  vignetteShell: {
    bottom: 0,
    left: 0,
    pointerEvents: "none",
    position: "absolute",
    right: 0,
    zIndex: 0
  },
  shell: {
    alignItems: "center",
    backgroundColor: "transparent",
    left: 0,
    pointerEvents: "box-none",
    position: "absolute",
    right: 0,
    zIndex: 1
  },
  islandShadow: {
    borderRadius: 999,
    elevation: 12,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20
  },
  island: {
    backgroundColor: ISLAND_BACKGROUND,
    borderRadius: 999,
    height: TAB_ISLAND_HEIGHT,
    overflow: "hidden",
    paddingVertical: ISLAND_VERTICAL_PADDING,
    position: "relative"
  },
  activeIndicator: {
    borderRadius: INDICATOR_SIZE / 2,
    height: INDICATOR_SIZE,
    overflow: "hidden",
    position: "absolute",
    top: INDICATOR_TOP,
    width: INDICATOR_SIZE,
    zIndex: 0
  },
  activeIndicatorDefault: {
    backgroundColor: ACTIVE_INDICATOR_COLOR
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    zIndex: 1
  }
});
