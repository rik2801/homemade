import { StyleSheet } from "react-native";
import { fontFamily, fontFamilyBold } from "@/theme/typography";
import { RECIPE_DETAILS_COLORS as c } from "./recipeDetailsColors";

export const recipeDetailsStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.background
  },
  scrollContent: {
    paddingBottom: 32
  },
  hero: {
    flexDirection: "row",
    alignItems: "flex-start",
    overflow: "visible",
    paddingLeft: 20,
    paddingRight: 0,
    paddingTop: 10,
    paddingBottom: 20,
    minHeight: 250,
    gap: 4
  },
  heroTextColumn: {
    flex: 1.05,
    paddingRight: 8,
    zIndex: 1
  },
  heroImageColumn: {
    flex: 0.95,
    alignItems: "flex-end",
    justifyContent: "flex-start",
    overflow: "visible"
  },
  title: {
    fontFamily: fontFamilyBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: c.textPrimary,
    fontWeight: "700"
  },
  titleCompact: {
    fontSize: 22,
    lineHeight: 26
  },
  subtitle: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: c.textSecondary,
    marginTop: 10,
    maxWidth: 168
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 12
  },
  badge: {
    backgroundColor: c.accentSoft,
    borderColor: c.accentBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  badgeText: {
    fontFamily,
    fontSize: 10,
    fontWeight: "600",
    color: c.textPrimary
  },
  imageGlow: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.imageGlow,
    alignSelf: "flex-end"
  },
  imageShadow: {
    shadowColor: c.shadowWarm,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 4
  },
  nutritionCard: {
    marginHorizontal: 20,
    marginTop: -12,
    backgroundColor: c.surface,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: c.shadowCard,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    zIndex: 2
  },
  nutritionItem: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
    paddingHorizontal: 2
  },
  nutritionValue: {
    fontFamily: fontFamilyBold,
    fontSize: 15,
    lineHeight: 18,
    color: c.textPrimary,
    fontWeight: "700"
  },
  nutritionLabel: {
    fontFamily,
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: c.textSecondary,
    marginTop: 3,
    fontWeight: "500"
  },
  nutritionSeparator: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: c.nutritionDivider
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 28
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 40
  },
  sectionTitle: {
    fontFamily: fontFamilyBold,
    fontSize: 18,
    lineHeight: 22,
    color: c.textPrimary,
    fontWeight: "700",
    flexShrink: 1
  },
  outlineButton: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: c.accentBorder,
    backgroundColor: c.background,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  outlineButtonLabel: {
    fontFamily,
    fontSize: 13,
    fontWeight: "600",
    color: c.textPrimary
  },
  ingredientsGrid: {
    marginTop: 20,
    gap: 16
  },
  ingredientsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12
  },
  ingredientCell: {
    flex: 1,
    minWidth: 0
  },
  ingredientCellEmpty: {
    flex: 1
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 12,
    padding: 4
  },
  ingredientItemHighlighted: {
    backgroundColor: c.accentSoft,
    borderColor: c.accentBorder
  },
  ingredientText: {
    flex: 1,
    minWidth: 0
  },
  ingredientTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 4
  },
  ingredientName: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: c.textIngredient,
    flexShrink: 1
  },
  ingredientAmount: {
    fontFamily,
    fontSize: 11,
    lineHeight: 15,
    color: c.textMuted,
    marginTop: 2
  },
  updatedBadge: {
    backgroundColor: c.accent,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1
  },
  updatedBadgeText: {
    fontFamily,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: c.textPrimary
  },
  prepDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.divider,
    marginTop: 26,
    marginHorizontal: 20
  },
  prepSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8
  },
  preparationStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12
  },
  preparationStepBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.divider
  },
  preparationStepChanged: {
    backgroundColor: c.accentSoft,
    borderRadius: 12,
    marginHorizontal: -6,
    paddingHorizontal: 6
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: c.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  stepNumberText: {
    fontFamily: fontFamilyBold,
    fontSize: 12,
    fontWeight: "700",
    color: c.textPrimary
  },
  stepText: {
    flex: 1,
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: c.textBody
  }
});
