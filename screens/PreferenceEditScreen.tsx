import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/primitives/AppText";
import { PROFILE_COLORS } from "@/components/profile/profileColors";
import {
  ALLERGY_OPTIONS,
  COOKING_FOR_OPTIONS,
  DIETARY_GOAL_OPTIONS,
  PANTRY_MODE_OPTIONS,
  type PantryMode
} from "@/features/preferences/data/preferenceOptions";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import type { ProfileSheetMode } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { layout, radius, spacing } from "@/theme/spacing";

export function preferenceEditTitle(mode: ProfileSheetMode) {
  switch (mode) {
    case "cookingFor":
      return "Cooking for";
    case "dietaryGoals":
      return "Dietary goals";
    case "allergies":
      return "Allergies / Avoid";
    case "pantryMode":
      return "Pantry behavior";
    default:
      return "Preferences";
  }
}

export function PreferenceEditScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const mode = useAppStore((state) => state.profileSheetMode);
  const closeProfileSheet = useAppStore((state) => state.closeProfileSheet);
  const cookingFor = useAppStore((state) => state.cookingFor);
  const dietaryGoals = useAppStore((state) => state.dietaryGoals);
  const allergies = useAppStore((state) => state.allergies);
  const pantryMode = useAppStore((state) => state.pantryMode);
  const setCookingFor = useAppStore((state) => state.setCookingFor);
  const setDietaryGoals = useAppStore((state) => state.setDietaryGoals);
  const setAllergies = useAppStore((state) => state.setAllergies);
  const setPantryMode = useAppStore((state) => state.setPantryMode);

  const [draftCookingFor, setDraftCookingFor] = useState(cookingFor);
  const [draftDietaryGoals, setDraftDietaryGoals] = useState<string[]>(dietaryGoals);
  const [draftAllergies, setDraftAllergies] = useState<string[]>(allergies);
  const [draftPantryMode, setDraftPantryMode] = useState<PantryMode>(pantryMode);

  useEffect(() => {
    setDraftCookingFor(cookingFor);
    setDraftDietaryGoals([...dietaryGoals]);
    setDraftAllergies([...allergies]);
    setDraftPantryMode(pantryMode);
  }, [mode, cookingFor, dietaryGoals, allergies, pantryMode]);

  const pageBackground = isDark ? colors.background : PROFILE_COLORS.pageBackground;

  function toggleItem(list: string[], value: string) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  async function handleSave() {
    await Haptics.selectionAsync();
    if (mode === "cookingFor") setCookingFor(draftCookingFor);
    if (mode === "dietaryGoals") setDietaryGoals(draftDietaryGoals);
    if (mode === "allergies") setAllergies(draftAllergies);
    if (mode === "pantryMode") setPantryMode(draftPantryMode);
    closeProfileSheet();
  }

  return (
    <View style={[styles.screen, { backgroundColor: pageBackground }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xxl }
        ]}
      >
        {mode === "cookingFor"
          ? COOKING_FOR_OPTIONS.map((option) => (
              <PreferenceOption
                key={option}
                label={option}
                selected={draftCookingFor === option}
                onPress={() => setDraftCookingFor(option)}
              />
            ))
          : null}

        {mode === "dietaryGoals"
          ? DIETARY_GOAL_OPTIONS.map((option) => (
              <PreferenceOption
                key={option}
                label={option}
                selected={draftDietaryGoals.includes(option)}
                onPress={() => setDraftDietaryGoals((current) => toggleItem(current, option))}
              />
            ))
          : null}

        {mode === "allergies"
          ? ALLERGY_OPTIONS.map((option) => (
              <PreferenceOption
                key={option}
                label={option}
                selected={draftAllergies.includes(option)}
                onPress={() => setDraftAllergies((current) => toggleItem(current, option))}
              />
            ))
          : null}

        {mode === "pantryMode"
          ? PANTRY_MODE_OPTIONS.map((option) => (
              <PreferenceOption
                key={option.value}
                label={option.label}
                selected={draftPantryMode === option.value}
                onPress={() => setDraftPantryMode(option.value)}
              />
            ))
          : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, spacing.lg),
            backgroundColor: pageBackground,
            borderTopColor: isDark ? colors.border : PROFILE_COLORS.cardBorder
          }
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: colors.brand }]}
        >
          <AppText style={[styles.saveLabel, { color: colors.brandOnBrand }]}>Save</AppText>
        </Pressable>
      </View>
    </View>
  );
}

function PreferenceOption({
  label,
  selected,
  onPress
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  async function handlePress() {
    await Haptics.selectionAsync();
    onPress();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={handlePress}
      style={[
        styles.option,
        selected
          ? { backgroundColor: colors.brandSoft, borderColor: colors.brandBorder }
          : { backgroundColor: colors.surface, borderColor: colors.border }
      ]}
    >
      <AppText style={[styles.optionText, { color: selected ? colors.brandOnBrand : colors.text }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm
  },
  option: {
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    justifyContent: "center"
  },
  optionText: {
    fontFamily,
    fontSize: 14,
    fontWeight: "400"
  },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth
  },
  saveBtn: {
    alignItems: "center",
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 48
  },
  saveLabel: {
    fontFamily,
    fontSize: 14,
    fontWeight: "500"
  }
});
