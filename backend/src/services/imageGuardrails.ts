import type { ImageCategory, ImageClassificationResult } from "./imageClassifier";

const ALLOWED_COOKING_CATEGORIES: ImageCategory[] = [
  "ingredient",
  "prepared_food",
  "packaged_food",
  "nutrition_label",
  "recipe",
  "kitchen_tool",
  "cooking_process"
];

export type CookingImageValidation =
  | { allowed: true }
  | { allowed: false; reason: "not_cooking_related"; category: ImageCategory };

export function validateCookingImage(classification: ImageClassificationResult): CookingImageValidation {
  if (ALLOWED_COOKING_CATEGORIES.includes(classification.category)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "not_cooking_related",
    category: classification.category
  };
}

export function getCookingImageGuardrailMessage() {
  return "I can only help with food, ingredients, recipes, nutrition labels, grocery products, and cooking-related images.\n\nI don't detect a cooking-related image here, so I can't recommend whether it belongs in a recipe.\n\nTry uploading an ingredient, packaged food, nutrition label, or a picture of the dish you're making.";
}
