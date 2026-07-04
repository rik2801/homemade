import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { getProgressLabels } from "@/lib/swapFlow";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

export function ArchieProgressCard() {
  const { colors } = useAppTheme();
  const progressStep = useAppStore((state) => state.progressStep);
  const assistantContext = useAppStore((state) => state.assistantContext);
  const targetRecipeId = useAppStore((state) => state.targetRecipeId);
  const recipe = useAppStore((state) => state.recipe);

  const targetTitle = targetRecipeId === recipe.id ? recipe.title : null;
  const labels = getProgressLabels(recipe.title, assistantContext, targetTitle);

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <AppText style={[styles.loadingMsg, { color: colors.muted }]}>Finding a guideline-safe substitute…</AppText>
      <View style={styles.list}>
        {labels.map((label, index) => {
          const done = index < progressStep;
          const active = index === progressStep;

          return (
            <View key={label} style={styles.item}>
              <View
                style={[
                  styles.check,
                  done
                    ? { borderColor: colors.brand, backgroundColor: colors.brand }
                    : active
                      ? { borderColor: colors.brand, borderTopColor: "transparent" }
                      : { borderColor: colors.border, backgroundColor: colors.surface }
                ]}
              >
                {done ? (
                  <AppText style={[styles.checkMark, { color: colors.brandOnBrand }]}>✓</AppText>
                ) : null}
              </View>
              <AppText
                style={[
                  styles.label,
                  {
                    color: done ? colors.muted : active ? colors.text : colors.faint,
                    fontWeight: active ? "500" : "400"
                  }
                ]}
              >
                {label}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    paddingHorizontal: 18,
    paddingVertical: 16
  },
  loadingMsg: {
    fontFamily,
    fontSize: 15,
    fontWeight: "500",
    paddingHorizontal: 12,
    paddingTop: 8,
    textAlign: "center"
  },
  list: {
    gap: 10
  },
  item: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 28
  },
  check: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1.5,
    height: 20,
    justifyContent: "center",
    width: 20
  },
  checkMark: {
    fontFamily,
    fontSize: 11,
    fontWeight: "700"
  },
  label: {
    flex: 1,
    fontFamily,
    fontSize: 14,
    lineHeight: 20
  }
});
