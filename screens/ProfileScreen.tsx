import type { ReactNode } from "react";
import * as Haptics from "expo-haptics";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { pantryModeLabel } from "@/lib/preferences";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { layout, radius, spacing } from "@/theme/spacing";

const TECH_NOTES = [
  "No real LLM call in prototype",
  "No patient identifiers sent",
  "No pantry database",
  "User-provided ingredient context only",
  "Rule-based fallback available"
];

export function ProfileScreen() {
  const { colors } = useAppTheme();
  const cookingFor = useAppStore((state) => state.cookingFor);
  const dietaryGoals = useAppStore((state) => state.dietaryGoals);
  const allergies = useAppStore((state) => state.allergies);
  const pantryMode = useAppStore((state) => state.pantryMode);
  const fallbackMode = useAppStore((state) => state.fallbackMode);
  const toggleFallbackMode = useAppStore((state) => state.toggleFallbackMode);
  const openArchSheet = useAppStore((state) => state.openArchSheet);
  const openProfileSheet = useAppStore((state) => state.openProfileSheet);

  async function handleToggle() {
    await Haptics.selectionAsync();
    toggleFallbackMode();
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={{ backgroundColor: colors.background }}
    >
      <SettingsGroup title="Cooking context">
        <PreferenceRow
          label="Cooking for"
          value={cookingFor}
          onPress={() => openProfileSheet("cookingFor")}
        />
      </SettingsGroup>

      <SettingsGroup title="Dietary goals">
        <ChipRow values={dietaryGoals} emptyLabel="None selected" onPress={() => openProfileSheet("dietaryGoals")} />
      </SettingsGroup>

      <SettingsGroup title="Allergies / avoid">
        <ChipRow values={allergies} emptyLabel="None selected" onPress={() => openProfileSheet("allergies")} />
      </SettingsGroup>

      <SettingsGroup title="Pantry behavior">
        <PreferenceRow
          label="Mode"
          value={pantryModeLabel(pantryMode)}
          onPress={() => openProfileSheet("pantryMode")}
        />
      </SettingsGroup>

      <SettingsGroup title="Prototype / technical">
        <View style={[styles.block, { backgroundColor: colors.canvas }]}>
          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.rowBody}>
              <AppText style={styles.rowTitle}>Simulate AI unavailable</AppText>
              <AppText style={[styles.rowDesc, { color: colors.muted }]}>
                Use rule-based fallback when the AI service cannot respond.
              </AppText>
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: fallbackMode }}
              onPress={handleToggle}
              style={[styles.toggle, { backgroundColor: fallbackMode ? colors.brand : colors.border }]}
            >
              <View
                style={[
                  styles.knob,
                  {
                    backgroundColor: colors.surface,
                    transform: [{ translateX: fallbackMode ? 18 : 0 }]
                  }
                ]}
              />
            </Pressable>
          </View>

          <Pressable accessibilityRole="button" onPress={openArchSheet} style={styles.linkRow}>
            <View style={styles.rowBody}>
              <AppText style={styles.rowTitle}>Architecture & Privacy</AppText>
              <AppText style={[styles.rowDesc, { color: colors.muted }]}>
                Prompt preview, pipeline, and privacy notes
              </AppText>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" stroke={colors.faint} fill="none" strokeWidth={2}>
              <Path d="m9 18 6-6-6-6" />
            </Svg>
          </Pressable>
        </View>

        <BulletList items={TECH_NOTES} />

        <View style={[styles.block, { backgroundColor: colors.canvas }]}>
          <AppText style={styles.version}>Prototype v1</AppText>
        </View>
      </SettingsGroup>
    </ScrollView>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <AppText variant="section">{title}</AppText>
      {children}
    </View>
  );
}

function PreferenceRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  const { colors } = useAppTheme();

  async function handlePress() {
    await Haptics.selectionAsync();
    onPress();
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      style={[styles.block, styles.prefRow, { backgroundColor: colors.canvas, borderColor: colors.borderLight }]}
    >
      <View style={styles.rowBody}>
        <AppText style={[styles.rowDesc, { color: colors.faint }]}>{label}</AppText>
        <AppText style={styles.rowTitle}>{value}</AppText>
      </View>
      <Svg width={18} height={18} viewBox="0 0 24 24" stroke={colors.faint} fill="none" strokeWidth={2}>
        <Path d="m9 18 6-6-6-6" />
      </Svg>
    </Pressable>
  );
}

function ChipRow({
  values,
  emptyLabel,
  onPress
}: {
  values: string[];
  emptyLabel: string;
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
      onPress={handlePress}
      style={[styles.block, styles.chipRow, { backgroundColor: colors.canvas, borderColor: colors.borderLight }]}
    >
      <View style={styles.chipWrap}>
        {values.length > 0 ? (
          values.map((value) => (
            <View key={value} style={[styles.chip, { borderColor: colors.brandBorder, backgroundColor: colors.brandSoft }]}>
              <AppText style={[styles.chipText, { color: colors.brandOnBrand }]}>{value}</AppText>
            </View>
          ))
        ) : (
          <AppText muted style={styles.emptyText}>
            {emptyLabel}
          </AppText>
        )}
      </View>
      <Svg width={18} height={18} viewBox="0 0 24 24" stroke={colors.faint} fill="none" strokeWidth={2}>
        <Path d="m9 18 6-6-6-6" />
      </Svg>
    </Pressable>
  );
}

function BulletList({ items }: { items: string[] }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.block, { backgroundColor: colors.canvas }]}>
      {items.map((item) => (
        <View key={item} style={styles.listItem}>
          <AppText style={[styles.bullet, { color: colors.brand }]}>•</AppText>
          <AppText style={[styles.listText, { color: colors.muted }]}>{item}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: layout.screenPadding,
    paddingTop: 8
  },
  group: {
    gap: spacing.md
  },
  block: {
    borderRadius: radius.md,
    overflow: "hidden"
  },
  prefRow: {
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  chipRow: {
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  chipWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  chipText: {
    fontFamily,
    fontSize: 11,
    fontWeight: "500"
  },
  emptyText: {
    fontFamily,
    fontSize: 14
  },
  row: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  rowBody: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  rowTitle: {
    fontFamily,
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: -0.15
  },
  rowDesc: {
    fontFamily,
    fontSize: 13,
    lineHeight: 19
  },
  toggle: {
    borderRadius: radius.pill,
    flexShrink: 0,
    height: 26,
    justifyContent: "center",
    padding: 3,
    width: 44
  },
  knob: {
    borderRadius: radius.pill,
    height: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    width: 20
  },
  linkRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  listItem: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 5
  },
  bullet: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    width: 14
  },
  listText: {
    flex: 1,
    fontFamily,
    fontSize: 14,
    lineHeight: 20
  },
  version: {
    fontFamily,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
    paddingHorizontal: 16,
    paddingVertical: 14
  }
});
