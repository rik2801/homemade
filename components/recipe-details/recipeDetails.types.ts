import type { DietaryBadge, IngredientIcon, SubstitutionRecord } from "@/types/recipe";

export type NutritionItem = {
  key: string;
  value: string;
  label: string;
};

export type IngredientDisplayItem = {
  id: string;
  label: string;
  amount: string;
  icon: IngredientIcon;
  isUpdated: boolean;
  isHighlighted: boolean;
  showSwapDot: boolean;
};

export type DietaryBadgesProps = {
  badges: DietaryBadge[];
};

export type NutritionSummaryProps = {
  items: NutritionItem[];
};

export type IngredientItemProps = IngredientDisplayItem;

export type IngredientsSectionProps = {
  ingredients: IngredientDisplayItem[];
  onSwapPress: () => void;
  swapDisabled?: boolean;
};

export type PreparationStepProps = {
  index: number;
  text: string;
  isChanged?: boolean;
  isLast?: boolean;
};

export type PreparationSectionProps = {
  steps: string[];
  originalSteps: string[];
  justAppliedId: string | null;
};

export type RecipeHeroProps = {
  title: string;
  subtitle: string;
  dietaryBadges: DietaryBadge[];
  recipeId: string;
  cookTime: string;
};

export type { SubstitutionRecord };
