import { StyleSheet, View } from "react-native";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { ToastBanner } from "@/components/layout/ToastBanner";
import { ArchieChatSidebar } from "@/components/archie/ArchieChatSidebar";
import { ArchieComposer, archieComposerBottomOffset } from "@/components/archie/ArchieComposer";
import { ComposerAttachmentSheets } from "@/components/archie/ComposerAttachmentSheets";
import { ArchitecturePrivacySheet } from "@/components/more/ArchitecturePrivacySheet";
import { PreferenceEditSheet } from "@/components/profile/PreferenceEditSheet";
import { SwapIngredientSheet } from "@/components/swap/SwapIngredientSheet";
import { ArchieScreen } from "@/screens/ArchieScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { OnboardingFlow } from "@/screens/OnboardingFlow";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { RecipesScreen } from "@/screens/RecipesScreen";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { layout, spacing } from "@/theme/spacing";

export default function AppShell() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const onboardingCompleted = useAppStore((state) => state.onboardingCompleted);
  const activeTab = useAppStore((state) => state.activeTab);
  const archieComposerBottom = useMemo(
    () => archieComposerBottomOffset(Math.round(insets.bottom)),
    [insets.bottom]
  );

  if (!onboardingCompleted) {
    return <OnboardingFlow />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <BrandHeader />
      <View style={styles.body}>
        {activeTab === "home" ? <HomeScreen /> : null}
        {activeTab === "recipes" ? <RecipesScreen /> : null}
        {activeTab === "archie" ? (
          <View style={[styles.archieBody, { backgroundColor: colors.brandSoft }]}>
            <View style={styles.archieContent}>
              <ArchieScreen />
            </View>
            <View
              style={[
                styles.archieComposerFooter,
                { backgroundColor: colors.brandSoft, paddingBottom: archieComposerBottom }
              ]}
            >
              <ArchieComposer />
            </View>
          </View>
        ) : null}
        {activeTab === "profile" ? <ProfileScreen /> : null}
      </View>
      <BottomTabBar />
      <ToastBanner />
      <ArchieChatSidebar />
      <SwapIngredientSheet />
      <ComposerAttachmentSheets />
      <ArchitecturePrivacySheet />
      <PreferenceEditSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  body: {
    flex: 1
  },
  archieBody: {
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
