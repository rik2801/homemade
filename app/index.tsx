import { StyleSheet, View } from "react-native";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { ToastBanner } from "@/components/layout/ToastBanner";
import { ArchieChatSidebar } from "@/components/archie/ArchieChatSidebar";
import { ArchieComposer, archieComposerBottomOffset } from "@/components/archie/ArchieComposer";
import { ComposerAttachmentSheets } from "@/components/archie/ComposerAttachmentSheets";
import { ArchieGradientBackground } from "@/components/onboarding/ArchieGradientBackground";
import { ArchitecturePrivacySheet } from "@/components/more/ArchitecturePrivacySheet";
import { PROFILE_COLORS } from "@/components/profile/profileColors";
import { SwapIngredientSheet } from "@/components/swap/SwapIngredientSheet";
import { ArchieScreen } from "@/screens/ArchieScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { OnboardingFlow } from "@/screens/OnboardingFlow";
import { PreferenceEditScreen } from "@/screens/PreferenceEditScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { RecipesScreen } from "@/screens/RecipesScreen";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { layout, spacing } from "@/theme/spacing";

export default function AppShell() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const onboardingCompleted = useAppStore((state) => state.onboardingCompleted);
  const activeTab = useAppStore((state) => state.activeTab);
  const profileSheetVisible = useAppStore((state) => state.profileSheetVisible);
  const chatMessages = useAppStore((state) => state.chatMessages);
  const conversationStarted = chatMessages.length > 0;
  const archieComposerBottom = useMemo(
    () => archieComposerBottomOffset(Math.round(insets.bottom)),
    [insets.bottom]
  );
  const editingPreferences = activeTab === "profile" && profileSheetVisible;
  const shellBackground =
    activeTab === "profile" && !isDark ? PROFILE_COLORS.pageBackground : colors.background;

  if (!onboardingCompleted) {
    return <OnboardingFlow />;
  }

  return (
    <View style={[styles.root, activeTab === "archie" ? styles.rootArchie : { backgroundColor: shellBackground }]}>
      {activeTab === "archie" ? (
        <ArchieGradientBackground
          gradientOpacity={conversationStarted ? 0.01 : 1}
          style={styles.archieShell}
        >
          <BrandHeader />
          <View style={styles.archieContent}>
            <ArchieScreen />
          </View>
          <View style={[styles.archieComposerFooter, { paddingBottom: archieComposerBottom }]}>
            <ArchieComposer />
          </View>
        </ArchieGradientBackground>
      ) : (
        <>
          <BrandHeader />
          <View style={styles.body}>
            {activeTab === "home" ? <HomeScreen /> : null}
            {activeTab === "recipes" ? <RecipesScreen /> : null}
            {activeTab === "profile" ? (editingPreferences ? <PreferenceEditScreen /> : <ProfileScreen />) : null}
          </View>
        </>
      )}
      {editingPreferences ? null : <BottomTabBar />}
      <ToastBanner />
      <ArchieChatSidebar />
      <SwapIngredientSheet />
      <ComposerAttachmentSheets />
      <ArchitecturePrivacySheet />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  rootArchie: {
    backgroundColor: "transparent"
  },
  body: {
    flex: 1
  },
  archieShell: {
    flex: 1,
    minHeight: 0
  },
  archieContent: {
    flex: 1,
    minHeight: 0
  },
  archieComposerFooter: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg
  }
});
