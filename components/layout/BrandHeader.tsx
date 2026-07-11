import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { ArchieLogo } from "@/components/brand/ArchieLogo";
import { HomemadeLogo } from "@/components/brand/HomemadeLogo";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { layout } from "@/theme/spacing";

function ChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

function ChatHistoryIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <Path d="M8 9h8" />
      <Path d="M8 13h5" />
    </Svg>
  );
}

export function BrandHeader() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const activeTab = useAppStore((state) => state.activeTab);
  const exitArchie = useAppStore((state) => state.exitArchie);
  const openArchieSidebar = useAppStore((state) => state.openArchieSidebar);
  const isArchie = activeTab === "archie";

  async function handleBack() {
    await Haptics.selectionAsync();
    exitArchie();
  }

  async function handleOpenChats() {
    await Haptics.selectionAsync();
    openArchieSidebar();
  }

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + layout.headerPaddingTop,
          backgroundColor: isArchie ? "transparent" : colors.background
        }
      ]}
    >
      {isArchie ? (
        <View style={styles.archieBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Leave Archie"
            hitSlop={8}
            onPress={handleBack}
            style={styles.sideButton}
          >
            <ChevronLeft color={colors.text} />
          </Pressable>
          <View pointerEvents="none" style={styles.logoOverlay}>
            <ArchieLogo align="center" />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open chat list"
            hitSlop={8}
            onPress={handleOpenChats}
            style={styles.sideButton}
          >
            <ChatHistoryIcon color={colors.text} />
          </Pressable>
        </View>
      ) : (
        <HomemadeLogo align="center" height={36} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    overflow: "visible",
    paddingBottom: layout.headerPaddingBottom,
    paddingHorizontal: layout.screenPadding
  },
  archieBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
    overflow: "visible",
    position: "relative",
    width: "100%"
  },
  sideButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
    zIndex: 1
  },
  logoOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    zIndex: 0
  }
});
