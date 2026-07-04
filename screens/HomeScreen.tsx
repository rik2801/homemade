import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { AppText } from "@/components/primitives/AppText";
import { CookbookRecipeCard } from "@/components/recipe/CookbookRecipeCard";
import { COOKBOOK_ITEMS } from "@/features/recipe/data/homemadeRecipe";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { layout, spacing } from "@/theme/spacing";

function audienceReason(cookingFor: string) {
  if (cookingFor === "Couple") return "Good for two";
  if (cookingFor === "Just me") return "Good for one";
  if (cookingFor === "Kids") return "Good for kids";
  if (cookingFor === "Family dinner") return "Good for family dinner";
  return "Good for your household";
}

export function HomeScreen() {
  const { colors } = useAppTheme();
  const openRecipe = useAppStore((state) => state.openRecipe);
  const cookingFor = useAppStore((state) => state.cookingFor);
  const [reasonSheetVisible, setReasonSheetVisible] = useState(false);

  const reasons = [
    "Fits your dietary goals",
    audienceReason(cookingFor),
    "Easy weeknight dinner"
  ];

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={{ backgroundColor: colors.background }}
      >
        <AppText variant="title" style={styles.pageTitle}>
          Cookbook
        </AppText>

        <View style={styles.cards}>
          {COOKBOOK_ITEMS.map((item) => (
            <CookbookRecipeCard
              key={item.id}
              recipeId={item.id}
              title={item.title}
              timeLabel={item.timeLabel}
              dietType={item.dietType}
              badges={item.badges}
              featured={item.featured}
              onOpenReasons={item.featured ? () => setReasonSheetVisible(true) : undefined}
              onStartCooking={() => openRecipe(item.id, { showDetail: true })}
            />
          ))}
        </View>
      </ScrollView>

      <BottomSheet
        visible={reasonSheetVisible}
        onClose={() => setReasonSheetVisible(false)}
        title="Recommended because"
      >
        <View style={styles.sheetReasons}>
          {reasons.map((reason) => (
            <ReasonRow key={reason} label={reason} colors={colors} />
          ))}
        </View>
      </BottomSheet>
    </>
  );
}

function ReasonRow({ label, colors }: { label: string; colors: { brand: string; text: string } }) {
  return (
    <View style={styles.reasonRow}>
      <View style={[styles.reasonDot, { backgroundColor: colors.brand }]} />
      <AppText style={[styles.reasonText, { color: colors.text }]}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md
  },
  pageTitle: {
    fontSize: 18,
    letterSpacing: -0.36,
    lineHeight: 22
  },
  cards: {
    gap: spacing.lg
  },
  sheetReasons: {
    gap: spacing.sm
  },
  reasonRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  reasonDot: {
    borderRadius: 3,
    height: 5,
    width: 5
  },
  reasonText: {
    flex: 1,
    fontFamily,
    fontSize: 15,
    lineHeight: 22
  }
});
