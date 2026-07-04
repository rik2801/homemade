import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import type { TabName } from "@/types/recipe";
import { fontFamily } from "@/theme/typography";
import { layout } from "@/theme/spacing";

type TabIconType = "home" | "recipes" | "archie" | "profile";

const tabs: { key: TabName; label: string; icon: TabIconType }[] = [
  { key: "home", label: "Home", icon: "home" },
  { key: "recipes", label: "Recipes", icon: "recipes" },
  { key: "archie", label: "Archie", icon: "archie" },
  { key: "profile", label: "Profile", icon: "profile" }
];

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
  const { colors } = useAppTheme();
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  async function handlePress(tab: TabName) {
    await Haptics.selectionAsync();
    setActiveTab(tab);
  }

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: insets.bottom,
          backgroundColor: "rgba(255, 252, 247, 0.96)",
          borderTopColor: colors.border
        }
      ]}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        const tint = active ? colors.brand : colors.tabInactive;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => handlePress(tab.key)}
            style={styles.tab}
          >
            {active ? <View style={[styles.activeLine, { backgroundColor: colors.brand }]} /> : null}
            <TabIcon type={tab.icon} color={tint} />
            <AppText style={[styles.label, { color: tint, fontFamily, opacity: active ? 1 : 0.72 }]}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: layout.tabHeight
  },
  tab: {
    alignItems: "center",
    flex: 1,
    gap: 3,
    justifyContent: "center",
    paddingVertical: 6
  },
  activeLine: {
    borderRadius: 1,
    height: 2,
    marginBottom: 2,
    width: 18
  },
  label: {
    fontSize: 10,
    fontWeight: "500"
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
