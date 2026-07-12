import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { floatingTabBarScrollInset } from "@/components/layout/BottomTabBar";
import { AppText } from "@/components/primitives/AppText";
import { CookbookRecipeCard } from "@/components/recipe/CookbookRecipeCard";
import { CookbookSearchBar, type CookbookSortMode } from "@/components/recipe/CookbookSearchBar";
import { COOKBOOK_ITEMS } from "@/features/recipe/data/homemadeRecipe";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { layout, spacing } from "@/theme/spacing";

const HOME_RECIPE_LIMIT = 3;
const CHEF_RECOMMENDED_ORDER = new Map(COOKBOOK_ITEMS.map((item, index) => [item.id, index]));

function sortCookbookItems<T extends (typeof COOKBOOK_ITEMS)[number]>(items: readonly T[], mode: CookbookSortMode) {
  const list = [...items];
  if (mode === "a-z") {
    return list.sort((a, b) => a.title.localeCompare(b.title));
  }
  if (mode === "z-a") {
    return list.sort((a, b) => b.title.localeCompare(a.title));
  }
  return list.sort(
    (a, b) => (CHEF_RECOMMENDED_ORDER.get(a.id) ?? 0) - (CHEF_RECOMMENDED_ORDER.get(b.id) ?? 0)
  );
}

function audienceReason(cookingFor: string) {
  if (cookingFor === "Couple") return "Good for two";
  if (cookingFor === "Just me") return "Good for one";
  if (cookingFor === "Kids") return "Good for kids";
  if (cookingFor === "Family dinner") return "Good for family dinner";
  return "Good for your household";
}

export function HomeScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const openRecipe = useAppStore((state) => state.openRecipe);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const cookingFor = useAppStore((state) => state.cookingFor);
  const [reasonSheetVisible, setReasonSheetVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<CookbookSortMode>("chef-recommended");

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? COOKBOOK_ITEMS.filter((item) => item.title.toLowerCase().includes(query))
      : COOKBOOK_ITEMS;
    return sortCookbookItems(filtered, sortMode).slice(0, HOME_RECIPE_LIMIT);
  }, [searchQuery, sortMode]);

  const reasons = [
    "Fits your dietary goals",
    audienceReason(cookingFor),
    "Easy weeknight dinner"
  ];

  async function handleSeeMore() {
    await Haptics.selectionAsync();
    setActiveTab("recipes");
  }

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: floatingTabBarScrollInset(insets.bottom) }]}
        style={{ backgroundColor: colors.background }}
      >
        <AppText variant="title" style={styles.pageTitle}>
          Cookbook
        </AppText>

        <CookbookSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          sortMode={sortMode}
          onSortChange={setSortMode}
        />

        <View style={styles.cards}>
          {visibleItems.map((item) => (
            <CookbookRecipeCard
              key={item.id}
              recipeId={item.id}
              title={item.title}
              timeLabel={item.timeLabel}
              dietType={item.dietType}
              badges={item.badges}
              featured={item.featured}
              onOpenReasons={item.featured ? () => setReasonSheetVisible(true) : undefined}
              onPress={() => openRecipe(item.id, { showDetail: true })}
            />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="See more recipes"
          accessibilityHint="Opens the Recipes tab"
          hitSlop={8}
          onPress={handleSeeMore}
          style={styles.seeMoreRow}
        >
          <AppText style={[styles.seeMoreLabel, { color: colors.text }]}>See more</AppText>
        </Pressable>
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
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xxl
  },
  pageTitle: {
    fontSize: 18,
    letterSpacing: -0.36,
    lineHeight: 22,
    marginBottom: -4
  },
  cards: {
    gap: spacing.lg
  },
  seeMoreRow: {
    alignItems: "flex-end",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: spacing.sm
  },
  seeMoreLabel: {
    fontFamily,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
    textDecorationLine: "underline"
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
