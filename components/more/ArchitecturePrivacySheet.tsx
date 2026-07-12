import { ScrollView, StyleSheet, View } from "react-native";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { AppText } from "@/components/primitives/AppText";
import { ARCH_PIPELINE } from "@/features/recipe/data/homemadeRecipe";
import { buildPromptPreview } from "@/lib/swapFlow";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { radius, spacing } from "@/theme/spacing";

const PRIVACY_NOTES = [
  "No patient name",
  "No medical history",
  "No user identifier",
  "No stored pantry inventory",
  "Only recipe context and user-entered substitute are sent"
] as const;

const PROTOTYPE_NOTES = [
  "No real LLM call in prototype",
  "No patient identifiers sent",
  "No pantry database",
  "User-provided ingredient context only",
  "Rule-based fallback available"
] as const;

export function ArchitecturePrivacySheet() {
  const { colors } = useAppTheme();
  const visible = useAppStore((state) => state.archSheetVisible);
  const closeArchSheet = useAppStore((state) => state.closeArchSheet);
  const recipe = useAppStore((state) => state.recipe);
  const userHasSubstitute = useAppStore((state) => state.userHasSubstitute);

  const cookingFor = useAppStore((state) => state.cookingFor);
  const dietaryGoals = useAppStore((state) => state.dietaryGoals);
  const allergies = useAppStore((state) => state.allergies);
  const pantryMode = useAppStore((state) => state.pantryMode);

  const promptPreview = buildPromptPreview(recipe, "heavy cream", userHasSubstitute ?? "Greek yogurt", {
    cookingFor,
    dietaryGoals,
    allergies,
    pantryMode
  });

  return (
    <BottomSheet visible={visible} onClose={closeArchSheet} title="Architecture & Privacy">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Privacy-safe prompt preview</AppText>
          <View style={[styles.code, { backgroundColor: colors.canvas, borderColor: colors.border }]}>
            <AppText style={styles.codeText}>{JSON.stringify(promptPreview, null, 2)}</AppText>
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Pipeline</AppText>
          <View style={styles.pipeline}>
            {ARCH_PIPELINE.map((step, index) => (
              <View key={step} style={styles.pipelineRow}>
                <View style={[styles.node, { backgroundColor: colors.brandSoft, borderColor: colors.brandBorder }]}>
                  <AppText style={[styles.nodeText, { color: colors.brandOnBrand }]}>{step}</AppText>
                </View>
                {index < ARCH_PIPELINE.length - 1 ? (
                  <View style={[styles.line, { backgroundColor: colors.border }]} />
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Privacy notes</AppText>
          {PRIVACY_NOTES.map((note) => (
            <View key={note} style={styles.noteRow}>
              <View style={[styles.bullet, { backgroundColor: colors.brand }]} />
              <AppText muted style={styles.noteText}>
                {note}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Prototype notes</AppText>
          {PROTOTYPE_NOTES.map((note) => (
            <View key={note} style={styles.noteRow}>
              <View style={[styles.bullet, { backgroundColor: colors.brand }]} />
              <AppText muted style={styles.noteText}>
                {note}
              </AppText>
            </View>
          ))}
          <AppText muted style={styles.version}>
            Prototype v1
          </AppText>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.lg,
    paddingBottom: spacing.md
  },
  section: {
    gap: spacing.sm
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase"
  },
  code: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md
  },
  codeText: {
    fontFamily: "Menlo",
    fontSize: 12,
    lineHeight: 18
  },
  pipeline: {
    gap: spacing.xs
  },
  pipelineRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  node: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  nodeText: {
    fontSize: 12,
    fontWeight: "600"
  },
  line: {
    flex: 1,
    height: 1
  },
  noteRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  bullet: {
    borderRadius: 3,
    height: 6,
    width: 6
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20
  },
  version: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: spacing.sm
  }
});
