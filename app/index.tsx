import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { ToastBanner } from "@/components/layout/ToastBanner";
import { ArchieComposer, archieComposerBottomOffset } from "@/components/archie/ArchieComposer";
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
  const archieComposerBottom = archieComposerBottomOffset(insets.bottom);

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
          <View style={styles.archieBody}>
            <ArchieScreen />
            <View
              pointerEvents="box-none"
              style={[styles.archieComposerSlot, { paddingBottom: archieComposerBottom }]}
            >
              <ArchieComposer />
            </View>
          </View>
        ) : null}
        {activeTab === "profile" ? <ProfileScreen /> : null}
      </View>
      <BottomTabBar />
      <ToastBanner />
      <SwapIngredientSheet />
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
    position: "relative"
  },
  archieComposerSlot: {
    alignItems: "stretch",
    bottom: 0,
    justifyContent: "flex-end",
    left: 0,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 2
  }
});
