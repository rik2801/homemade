import type { PantryMode } from "@/features/preferences/data/preferenceOptions";

export function pantryModeLabel(mode: PantryMode) {
  if (mode === "remember") return "Remember common pantry items";
  return "Always ask what I have";
}

export function formatDietaryFit(dietaryGoals: string[], allergies: string[]) {
  const goals =
    dietaryGoals.length > 0
      ? `Fits your ${formatList(dietaryGoals)} goals.`
      : "Fits your dietary preferences.";

  const avoid =
    allergies.length > 0 ? ` Avoids ${formatList(allergies)}.` : "";

  return `${goals}${avoid}`.trim();
}

export function formatList(items: string[]) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
