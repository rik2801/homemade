import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { ArchieLogo } from "@/components/brand/ArchieLogo";
import { HomemadeLogo } from "@/components/brand/HomemadeLogo";
import { AppText } from "@/components/primitives/AppText";
import { SettingsGearIcon } from "@/components/profile/ProfileIcons";
import { PROFILE_COLORS } from "@/components/profile/profileColors";
import { RECIPE_DETAILS_COLORS } from "@/components/recipe-details/recipeDetailsColors";
import { preferenceEditTitle } from "@/screens/PreferenceEditScreen";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
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
  const { colors, isDark } = useAppTheme();
  const activeTab = useAppStore((state) => state.activeTab);
  const recipesView = useAppStore((state) => state.recipesView);
  const setRecipesView = useAppStore((state) => state.setRecipesView);
  const exitArchie = useAppStore((state) => state.exitArchie);
  const openArchieSidebar = useAppStore((state) => state.openArchieSidebar);
  const openArchSheet = useAppStore((state) => state.openArchSheet);
  const profileSheetVisible = useAppStore((state) => state.profileSheetVisible);
  const profileSheetMode = useAppStore((state) => state.profileSheetMode);
  const closeProfileSheet = useAppStore((state) => state.closeProfileSheet);
  const isArchie = activeTab === "archie";
  const isProfile = activeTab === "profile";
  const isPreferenceEdit = isProfile && profileSheetVisible;
  const isRecipeDetail = activeTab === "recipes" && recipesView === "detail";
  const chatMessages = useAppStore((state) => state.chatMessages);
  const archieConversationStarted = chatMessages.length > 0;
  const archieIconColor =
    archieConversationStarted && isDark ? "#FFFFFF" : "#111827";
  const headerBackground = isArchie
    ? "transparent"
    : isRecipeDetail && !isDark
      ? RECIPE_DETAILS_COLORS.background
      : (isProfile || isPreferenceEdit) && !isDark
        ? PROFILE_COLORS.pageBackground
        : colors.background;

  async function handleBack() {
    await Haptics.selectionAsync();
    exitArchie();
  }

  async function handleRecipeBack() {
    await Haptics.selectionAsync();
    setRecipesView("list");
  }

  async function handleOpenChats() {
    await Haptics.selectionAsync();
    openArchieSidebar();
  }

  async function handleOpenSettings() {
    await Haptics.selectionAsync();
    openArchSheet();
  }

  async function handleClosePreferenceEdit() {
    await Haptics.selectionAsync();
    closeProfileSheet();
  }

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + layout.headerPaddingTop,
          backgroundColor: headerBackground
        },
        isRecipeDetail ? styles.recipeDetailHeader : null
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
            <ChevronLeft color={archieIconColor} />
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
            <ChatHistoryIcon color={archieIconColor} />
          </Pressable>
        </View>
      ) : isPreferenceEdit ? (
        <View style={styles.profileBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to profile"
            hitSlop={8}
            onPress={handleClosePreferenceEdit}
            style={styles.backButton}
          >
            <ChevronLeft color={isDark ? colors.text : PROFILE_COLORS.primaryText} />
          </Pressable>
          <View pointerEvents="none" style={styles.logoOverlay}>
            <AppText style={[styles.editTitle, { color: isDark ? colors.text : PROFILE_COLORS.primaryText }]}>
              {preferenceEditTitle(profileSheetMode)}
            </AppText>
          </View>
        </View>
      ) : isProfile ? (
        <View style={styles.profileBar}>
          <View pointerEvents="none" style={styles.logoOverlay}>
            <HomemadeLogo align="center" height={32} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            hitSlop={8}
            onPress={handleOpenSettings}
            style={styles.settingsButton}
          >
            <SettingsGearIcon color={isDark ? colors.text : PROFILE_COLORS.brandGreen} />
          </Pressable>
        </View>
      ) : isRecipeDetail ? (
        <View style={styles.recipeDetailBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back to all recipes"
            hitSlop={8}
            onPress={handleRecipeBack}
            style={({ pressed }) => [
              styles.recipeBackButton,
              { opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}
          >
            <ChevronLeft color={isDark ? colors.text : RECIPE_DETAILS_COLORS.textPrimary} />
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
  },
  profileBar: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    position: "relative",
    width: "100%"
  },
  backButton: {
    position: "absolute",
    left: 0,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1
  },
  settingsButton: {
    position: "absolute",
    right: 0,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1
  },
  editTitle: {
    fontFamily,
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: -0.2
  },
  recipeDetailHeader: {
    paddingBottom: 4
  },
  recipeDetailBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-start",
    minHeight: 44,
    width: "100%"
  },
  recipeBackButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    width: 44
  }
});
