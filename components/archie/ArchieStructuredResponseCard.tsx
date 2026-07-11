import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { ArchieStructuredResponse } from "@/types/recipe";
import { archieBrandColor, fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

export type ArchieStructuredResponseCardProps = ArchieStructuredResponse;

type SectionDef = {
  label: string;
  value?: string;
};

function normalizeSectionText(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function dedupeSections(sections: SectionDef[], summary: string): SectionDef[] {
  const seen = new Set<string>([normalizeSectionText(summary)]);
  const result: SectionDef[] = [];

  for (const section of sections) {
    const value = section.value?.trim();
    if (!value) continue;

    const normalized = normalizeSectionText(value);
    if (seen.has(normalized)) continue;

    seen.add(normalized);
    result.push({ label: section.label, value });
  }

  return result;
}

export function ArchieStructuredResponseCard(props: ArchieStructuredResponseCardProps) {
  const { colors } = useAppTheme();

  const sections = dedupeSections(
    [
      props.isImageResponse && props.identified
        ? { label: "Identified", value: props.identified }
        : { label: "Identified", value: undefined },
      { label: "How to use", value: props.howToUse },
      { label: "Dietary fit", value: props.dietaryFit },
      { label: "Watch out", value: props.watchOut },
      { label: "Recipe update", value: props.recipeUpdate },
      { label: "Why this works", value: props.whyThisWorks },
      { label: "Nutrition note", value: props.nutritionNote },
      { label: "Next step", value: props.nextStep }
    ],
    props.summary
  );

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={[styles.headerBar, { backgroundColor: archieBrandColor }]}>
        <AppText style={[styles.headerTitle, { color: "#FFFFFF" }]}>{props.title}</AppText>
      </View>

      <View style={styles.cardBody}>
        <AppText style={[styles.summary, { color: colors.text }]}>{props.summary}</AppText>

        {sections.map((section) => (
          <ResponseSection key={section.label} label={section.label} value={section.value!} />
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
    lineHeight: 24,
    marginBottom: 18
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
