import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { AppText } from "@/components/primitives/AppText";
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
import { radius, spacing } from "@/theme/spacing";

export function PreferenceEditSheet() {
  const { colors } = useAppTheme();
  const visible = useAppStore((state) => state.profileSheetVisible);
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
    if (!visible) return;
    setDraftCookingFor(cookingFor);
    setDraftDietaryGoals([...dietaryGoals]);
    setDraftAllergies([...allergies]);
    setDraftPantryMode(pantryMode);
  }, [visible, cookingFor, dietaryGoals, allergies, pantryMode]);

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
    <BottomSheet visible={visible} onClose={closeProfileSheet} title={sheetTitle(mode)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {mode === "cookingFor"
          ? COOKING_FOR_OPTIONS.map((option) => (
              <SheetOption
                key={option}
                label={option}
                selected={draftCookingFor === option}
                onPress={() => setDraftCookingFor(option)}
              />
            ))
          : null}

        {mode === "dietaryGoals"
          ? DIETARY_GOAL_OPTIONS.map((option) => (
              <SheetOption
                key={option}
                label={option}
                selected={draftDietaryGoals.includes(option)}
                onPress={() => setDraftDietaryGoals((current) => toggleItem(current, option))}
              />
            ))
          : null}

        {mode === "allergies"
          ? ALLERGY_OPTIONS.map((option) => (
              <SheetOption
                key={option}
                label={option}
                selected={draftAllergies.includes(option)}
                onPress={() => setDraftAllergies((current) => toggleItem(current, option))}
              />
            ))
          : null}

        {mode === "pantryMode"
          ? PANTRY_MODE_OPTIONS.map((option) => (
              <SheetOption
                key={option.value}
                label={option.label}
                selected={draftPantryMode === option.value}
                onPress={() => setDraftPantryMode(option.value)}
              />
            ))
          : null}

        <Pressable
          accessibilityRole="button"
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: colors.brand }]}
        >
          <AppText style={[styles.saveLabel, { color: colors.brandOnBrand }]}>Save</AppText>
        </Pressable>
      </ScrollView>
    </BottomSheet>
  );
}

function sheetTitle(mode: ProfileSheetMode) {
  switch (mode) {
    case "cookingFor":
      return "Cooking for";
    case "dietaryGoals":
      return "Dietary goals";
    case "allergies":
      return "Allergies / avoid";
    case "pantryMode":
      return "Pantry behavior";
    default:
      return "Preferences";
  }
}

function SheetOption({
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
      <AppText style={[styles.optionText, { color: selected ? colors.brandOnBrand : colors.text }]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.md
  },
  option: {
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: 13
  },
  optionText: {
    fontFamily,
    fontSize: 15,
    fontWeight: "500"
  },
  saveBtn: {
    alignItems: "center",
    borderRadius: radius.md,
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 48
  },
  saveLabel: {
    fontFamily,
    fontSize: 15,
    fontWeight: "600"
  }
});
