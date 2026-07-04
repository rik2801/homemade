export type PantryMode = "ask" | "remember";

export type UserPreferences = {
  cookingFor: string;
  dietaryGoals: string[];
  allergies: string[];
  pantryMode: PantryMode;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  cookingFor: "Family dinner",
  dietaryGoals: ["Low-fat", "Low-sodium"],
  allergies: ["Shellfish"],
  pantryMode: "ask"
};

export const COOKING_FOR_OPTIONS = ["Just me", "Couple", "Family dinner", "Kids"] as const;

export const DIETARY_GOAL_OPTIONS = [
  "Low-fat",
  "Low-sodium",
  "High protein",
  "Vegetarian",
  "Diabetes friendly",
  "Heart healthy",
  "Oncology nutrition"
] as const;

export const ALLERGY_OPTIONS = [
  "Shellfish",
  "Peanuts",
  "Tree nuts",
  "Dairy",
  "Eggs",
  "Soy",
  "Wheat",
  "Sesame"
] as const;

export const PANTRY_MODE_OPTIONS = [
  { value: "ask" as const, label: "Always ask what I have" },
  { value: "remember" as const, label: "Remember common pantry items" }
] as const;
