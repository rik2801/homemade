import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { floatingTabBarScrollInset } from "@/components/layout/BottomTabBar";
import { CookbookSearchBar, type CookbookSortMode } from "@/components/recipe/CookbookSearchBar";
import { DietMarker } from "@/components/recipe/DietMarker";
import { SoupHeroIllustration } from "@/components/recipe/SoupHeroIllustration";
import { COOKBOOK_ITEMS, type RecipeId } from "@/features/recipe/data/homemadeRecipe";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { layout, radius, spacing } from "@/theme/spacing";
import { RecipeScreen } from "@/screens/RecipeScreen";

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

export function RecipesScreen() {
  const recipesView = useAppStore((state) => state.recipesView);

  if (recipesView === "detail") {
    return <RecipeScreen showBack />;
  }

  return <RecipeListView />;
}

function RecipeListView() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const openRecipe = useAppStore((state) => state.openRecipe);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<CookbookSortMode>("chef-recommended");

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? COOKBOOK_ITEMS.filter((item) => item.title.toLowerCase().includes(query))
      : COOKBOOK_ITEMS;
    return sortCookbookItems(filtered, sortMode);
  }, [searchQuery, sortMode]);

  async function handleOpen(recipeId: RecipeId) {
    await Haptics.selectionAsync();
    openRecipe(recipeId, { showDetail: true });
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingBottom: floatingTabBarScrollInset(insets.bottom) }]}
      style={{ backgroundColor: colors.background }}
      keyboardShouldPersistTaps="handled"
    >
      <AppText variant="title" style={styles.pageTitle}>
        Recipes
      </AppText>

      <CookbookSearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        sortMode={sortMode}
        onSortChange={setSortMode}
      />

      <View style={styles.list}>
        {visibleItems.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => handleOpen(item.id)}
            style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <View style={[styles.thumb, { backgroundColor: colors.canvas }]}>
              <SoupHeroIllustration recipeId={item.id} height={72} />
            </View>
            <View style={styles.body}>
              <View style={styles.titleRow}>
                <AppText variant="heading" style={styles.title}>
                  {item.title}
                </AppText>
                <DietMarker dietType={item.dietType} />
              </View>
              <View style={styles.timeRow}>
                <ClockIcon color={colors.muted} />
                <AppText muted style={styles.timeText}>
                  {item.timeLabel}
                </AppText>
              </View>
              {item.badges.length > 0 ? (
                <View style={styles.badges}>
                  {item.badges.map((badge) => (
                    <View
                      key={badge}
                      style={[styles.badge, { borderColor: colors.borderLight, backgroundColor: colors.canvas }]}
                    >
                      <AppText style={[styles.badgeText, { color: colors.muted }]}>{badge}</AppText>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75}>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md
  },
  pageTitle: {
    fontSize: 18,
    letterSpacing: -0.36,
    lineHeight: 22,
    marginBottom: -4
  },
  list: {
    gap: spacing.md
  },
  row: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.sm
  },
  thumb: {
    borderRadius: radius.md,
    height: 72,
    overflow: "hidden",
    width: 96
  },
  body: {
    flex: 1,
    gap: 6,
    justifyContent: "center",
    paddingVertical: 4
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  title: {
    flexShrink: 1,
    fontSize: 18,
    lineHeight: 22
  },
  timeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  timeText: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16
  },
  badges: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  badge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  badgeText: {
    fontFamily,
    fontSize: 10,
    fontWeight: "500"
  }
});
