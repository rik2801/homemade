import { StyleSheet, View } from "react-native";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { ToastBanner } from "@/components/layout/ToastBanner";
import { ArchieComposer } from "@/components/archie/ArchieComposer";
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

export default function AppShell() {
  const { colors } = useAppTheme();
  const onboardingCompleted = useAppStore((state) => state.onboardingCompleted);
  const activeTab = useAppStore((state) => state.activeTab);

  if (!onboardingCompleted) {
    return <OnboardingFlow />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <BrandHeader />
      <View style={styles.body}>
        {activeTab === "home" ? <HomeScreen /> : null}
        {activeTab === "recipes" ? <RecipesScreen /> : null}
        {activeTab === "archie" ? <ArchieScreen /> : null}
        {activeTab === "profile" ? <ProfileScreen /> : null}
      </View>
      {activeTab === "archie" ? <ArchieComposer /> : null}
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
  }
});
