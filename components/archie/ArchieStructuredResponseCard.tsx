import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { useAppTheme } from "@/hooks/useAppTheme";
import { isSemanticallyDuplicate, removeOverlappingSections } from "@/lib/archieAnswerFormatting";
import type { ArchieStructuredResponse } from "@/types/recipe";
import { archieBrandColor, fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

export type ArchieStructuredResponseCardProps = ArchieStructuredResponse;

export function ArchieStructuredResponseCard(props: ArchieStructuredResponseCardProps) {
  const { colors } = useAppTheme();

  const preferenceValue = props.preferenceFit ?? props.dietaryFit;

  const sections = removeOverlappingSections(props.summary, [
    props.isImageResponse && props.identified
      ? { key: "identified", label: "Identified", value: props.identified }
      : { key: "identified", label: "Identified", value: "" },
    { key: "howToUse", label: "How to use", value: props.howToUse ?? "" },
    {
      key: "preferenceFit",
      label: props.preferenceFit ? "For your goals" : "Dietary fit",
      value: preferenceValue ?? ""
    },
    { key: "watchOut", label: "Watch out", value: props.watchOut ?? "" },
    { key: "recipeUpdate", label: "Recipe update", value: props.recipeUpdate ?? "" },
    { key: "whyThisWorks", label: "Why this works", value: props.whyThisWorks ?? "" },
    { key: "nutritionNote", label: "Nutrition note", value: props.nutritionNote ?? "" },
    { key: "nextStep", label: "Next step", value: props.nextStep ?? "" }
  ]).filter((section) => {
    // Hide legacy "Dietary fit" when empty; prefer preferenceFit label when present.
    if (section.key === "preferenceFit" && !preferenceValue) return false;
    return Boolean(section.value.trim());
  });

  // Prefer preferenceFit over duplicate dietaryFit content.
  const visibleSections = sections.filter((section, index, all) => {
    if (section.key !== "preferenceFit") return true;
    return !all.some(
      (other) =>
        other.key !== section.key &&
        isSemanticallyDuplicate(other.value, section.value)
    );
  });

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={[styles.headerBar, { backgroundColor: archieBrandColor }]}>
        <AppText style={[styles.headerTitle, { color: "#FFFFFF" }]}>{props.title}</AppText>
      </View>

      <View style={styles.cardBody}>
        <AppText
          style={[
            styles.summary,
            { color: colors.text, marginBottom: visibleSections.length === 0 ? 0 : 18 }
          ]}
        >
          {props.summary}
        </AppText>

        {visibleSections.map((section) => (
          <ResponseSection key={section.key} label={section.label} value={section.value} />
        ))}
      </View>
    </View>
  );
}

function ResponseSection({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  const paragraphs = value.split(/\n\n+/);

  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeadingRow, { borderBottomColor: colors.border }]}>
        <AppText style={[styles.sectionLabel, { color: colors.text }]}>{label.toUpperCase()}</AppText>
      </View>
      <View style={styles.sectionBody}>
        {paragraphs.map((paragraph, index) => (
          <AppText
            key={`${label}-${index}`}
            style={[styles.sectionValue, { color: colors.muted }, index > 0 ? styles.sectionParagraphGap : null]}
          >
            {paragraph.trim()}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden"
  },
  headerBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12
  },
  headerTitle: {
    fontFamily,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.1
  },
  cardBody: {
    padding: spacing.md
  },
  summary: {
    fontFamily,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24
  },
  section: {
    marginTop: 24
  },
  sectionHeadingRow: {
    borderBottomWidth: 1,
    paddingBottom: 10
  },
  sectionLabel: {
    fontFamily,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8
  },
  sectionBody: {
    marginTop: 12
  },
  sectionValue: {
    fontFamily,
    fontSize: 15,
    lineHeight: 22
  },
  sectionParagraphGap: {
    marginTop: 10
  }
});
