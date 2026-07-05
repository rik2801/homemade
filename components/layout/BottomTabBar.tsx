import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import type { TabName } from "@/types/recipe";
import { spacing } from "@/theme/spacing";

type TabIconType = "home" | "recipes" | "archie" | "profile";

const ISLAND_MARGIN = 32;
const ISLAND_VERTICAL_PADDING = 8;
const ISLAND_BOTTOM_SHIFT_RATIO = 0.05;
export const TAB_ISLAND_HEIGHT = 76;
const INDICATOR_SIZE = 60;
const INDICATOR_TOP = 8;
const CAP_CENTER = TAB_ISLAND_HEIGHT / 2;
const TAB_COUNT = 4;
const ACTIVE_INDICATOR_COLOR = "#ECC218";
const ISLAND_BACKGROUND = "#FFFFFF";

export function floatingTabBarScrollInset(bottomInset: number) {
  return TAB_ISLAND_HEIGHT + Math.max(bottomInset, spacing.sm) + spacing.lg + spacing.sm;
}

function islandBottomOffset(bottomInset: number, windowHeight: number) {
  const base = Math.max(bottomInset, spacing.sm) + spacing.sm;
  return Math.max(bottomInset, base - windowHeight * ISLAND_BOTTOM_SHIFT_RATIO);
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

function TabIcon({ type, color }: { type: TabIconType; color: string }) {
  if (type === "home") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75}>
        <Path d="M3 10.5 12 4l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5H15v-6.5H9V21.5H4.5A1.5 1.5 0 0 1 3 20v-9.5Z" />
      </Svg>
    );
  }

  if (type === "recipes") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75}>
        <Path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </Svg>
    );
  }

  if (type === "archie") {
    return (
      <View style={styles.sparkleWrap}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.85} style={styles.sparkleLarge}>
          <Path d="M12 3v5" />
          <Path d="M12 16v5" />
          <Path d="M5 10H2" />
          <Path d="M22 10h-3" />
          <Path d="M7.05 5.05 4.93 2.93" />
          <Path d="M19.07 17.07l-2.12-2.12" />
          <Path d="M7.05 14.95l-2.12 2.12" />
          <Path d="M19.07 2.93l-2.12 2.12" />
        </Svg>
        <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} style={styles.sparkleSmall}>
          <Path d="M12 6v3" />
          <Path d="M12 15v3" />
          <Path d="M8 10H6" />
          <Path d="M18 10h-2" />
        </Svg>
      </View>
    );
  }

  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75}>
      <Path d="M20 21a8 8 0 1 0-16 0" />
      <Circle cx={12} cy={7} r={4} />
    </Svg>
  );
}

export function BottomTabBar() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
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

  return (
    <View
      pointerEvents="box-none"
      style={[styles.shell, { bottom: islandBottomOffset(insets.bottom, windowHeight) }]}
    >
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
          <Animated.View pointerEvents="none" style={[styles.activeIndicator, indicatorStyle]} />
          {tabs.map((tab, index) => {
            const active = activeTab === tab.key;
            const tint = active ? colors.brandOnBrand : colors.tabInactive;
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
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: "center",
    backgroundColor: "transparent",
    left: 0,
    pointerEvents: "box-none",
    position: "absolute",
    right: 0
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
    backgroundColor: ACTIVE_INDICATOR_COLOR,
    borderRadius: INDICATOR_SIZE / 2,
    height: INDICATOR_SIZE,
    position: "absolute",
    top: INDICATOR_TOP,
    width: INDICATOR_SIZE,
    zIndex: 0
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    zIndex: 1
  },
  sparkleWrap: {
    height: 22,
    position: "relative",
    width: 22
  },
  sparkleLarge: {
    bottom: 0,
    left: 0,
    position: "absolute"
  },
  sparkleSmall: {
    position: "absolute",
    right: 0,
    top: 0
  }
});
