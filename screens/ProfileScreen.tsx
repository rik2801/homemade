import * as Haptics from "expo-haptics";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ClipboardListIcon,
  LeafIcon,
  MoonIcon,
  ShieldAlertIcon,
  UsersIcon
} from "@/components/profile/ProfileIcons";
import { PROFILE_COLORS } from "@/components/profile/profileColors";
import { ProfileSummaryCard } from "@/components/profile/ProfileSummaryCard";
import { ProfileSeparator, ProfileSettingRow } from "@/components/profile/ProfileSettingRow";
import { floatingTabBarScrollInset } from "@/components/layout/BottomTabBar";
import { pantryModeLabel } from "@/lib/preferences";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { layout, spacing } from "@/theme/spacing";

export function ProfileScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const cookingFor = useAppStore((state) => state.cookingFor);
  const dietaryGoals = useAppStore((state) => state.dietaryGoals);
  const allergies = useAppStore((state) => state.allergies);
  const pantryMode = useAppStore((state) => state.pantryMode);
  const darkMode = useAppStore((state) => state.darkMode);
  const setDarkMode = useAppStore((state) => state.setDarkMode);
  const openProfileSheet = useAppStore((state) => state.openProfileSheet);

  const pageBackground = isDark ? colors.background : PROFILE_COLORS.pageBackground;
  const cardBackground = isDark ? colors.surface : PROFILE_COLORS.cardBackground;
  const cardBorder = isDark ? colors.border : PROFILE_COLORS.cardBorder;
  const allergyValue = allergies.length > 0 ? allergies.join(", ") : "None selected";

  async function openSheet(mode: "cookingFor" | "dietaryGoals" | "allergies" | "pantryMode") {
    await Haptics.selectionAsync();
    openProfileSheet(mode);
  }

  async function handleDarkModeChange(next: boolean) {
    await Haptics.selectionAsync();
    setDarkMode(next);
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: floatingTabBarScrollInset(insets.bottom) }
      ]}
      style={{ backgroundColor: pageBackground, flex: 1 }}
    >
      <ProfileSummaryCard />

      <View
        style={[
          styles.settingsGroup,
          {
            backgroundColor: cardBackground,
            borderColor: cardBorder
          }
        ]}
      >
        <ProfileSettingRow
          icon={<UsersIcon color={PROFILE_COLORS.cookingForIcon} />}
          iconBackgroundColor={PROFILE_COLORS.cookingForBackground}
          label="Cooking for"
          value={cookingFor}
          trailing="chevron"
          accessibilityHint="Opens cooking context settings"
          onPress={() => openSheet("cookingFor")}
        />
        <ProfileSeparator />
        <ProfileSettingRow
          icon={<LeafIcon color={PROFILE_COLORS.dietaryIcon} />}
          iconBackgroundColor={PROFILE_COLORS.dietaryBackground}
          label="Dietary goals"
          chips={dietaryGoals}
          trailing="chevron"
          accessibilityHint="Opens dietary goals settings"
          onPress={() => openSheet("dietaryGoals")}
        />
        <ProfileSeparator />
        <ProfileSettingRow
          icon={<ShieldAlertIcon color={PROFILE_COLORS.allergyIcon} />}
          iconBackgroundColor={PROFILE_COLORS.allergyBackground}
          label="Allergies / Avoid"
          value={allergyValue}
          trailing="chevron"
          accessibilityHint="Opens allergy settings"
          onPress={() => openSheet("allergies")}
        />
        <ProfileSeparator />
        <ProfileSettingRow
          icon={<ClipboardListIcon color={PROFILE_COLORS.pantryIcon} />}
          iconBackgroundColor={PROFILE_COLORS.pantryBackground}
          label="Pantry behavior"
          value={pantryModeLabel(pantryMode)}
          trailing="chevron"
          accessibilityHint="Opens pantry behavior settings"
          onPress={() => openSheet("pantryMode")}
        />
        <ProfileSeparator />
        <ProfileSettingRow
          icon={<MoonIcon color={PROFILE_COLORS.technicalIcon} />}
          iconBackgroundColor={PROFILE_COLORS.technicalBackground}
          label="Appearance"
          value="Dark mode"
          trailing="switch"
          switchValue={darkMode}
          onSwitchChange={handleDarkModeChange}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    gap: 0
  },
  settingsGroup: {
    marginTop: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4
    },
    elevation: 2
  }
});
