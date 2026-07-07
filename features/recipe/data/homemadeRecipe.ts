import type { Recipe } from "@/types/recipe";

export const RECIPE_CATALOG = [
  {
    id: "creamy-tomato-soup",
    title: "Creamy Tomato Soup",
    servings: 4,
    guidelines: ["Low-fat", "Low-sodium"],
    available: true
  },
  {
    id: "chicken-curry",
    title: "Chicken Curry",
    servings: 6,
    guidelines: ["High protein"],
    available: true
  },
  {
    id: "mushroom-pasta",
    title: "Mushroom Pasta",
    servings: 4,
    guidelines: [],
    available: true
  }
] as const;

export type RecipeId = (typeof RECIPE_CATALOG)[number]["id"];

export const COOKBOOK_ITEMS = [
  {
    id: "creamy-tomato-soup" as const,
    title: "Creamy Tomato Soup",
    timeLabel: "25 mins",
    dietType: "vegetarian" as const,
    badges: ["Low-fat", "Low-sodium"],
    featured: true
  },
  {
    id: "chicken-curry" as const,
    title: "Chicken Curry",
    timeLabel: "40 mins",
    dietType: "non-vegetarian" as const,
    badges: ["High Protein"],
    featured: false
  },
  {
    id: "mushroom-pasta" as const,
    title: "Mushroom Pasta",
    timeLabel: "30 mins",
    dietType: "vegetarian" as const,
    badges: [] as const,
    featured: false
  }
] as const;

export const homemadeRecipe: Recipe = {
  id: "creamy-tomato-soup",
  title: "Creamy Tomato Soup",
  subtitle: "A hospital-approved comfort soup for a family night in.",
  prepTime: "15 min",
  cookTime: "35 min",
  servings: 4,
  dietaryBadges: ["Low-fat", "Low-sodium"],
  safetyNotes: [
    "Dietary rules are preferences, not medical prescriptions.",
    "Partner-approved swaps stay within low-fat and low-sodium guidance.",
    "No PHI is stored in this local demo."
  ],
  ingredients: [
    { id: "tomatoes", amount: "28 oz", label: "canned crushed tomatoes", icon: "tomato" },
    {
      id: "heavy-cream",
      amount: "1/2 cup",
      label: "heavy cream",
      originalLabel: "heavy cream",
      icon: "milk",
      swappable: true
    },
    { id: "onion", amount: "1 medium, diced", label: "onion", icon: "onion" },
    { id: "garlic", amount: "3 cloves, minced", label: "garlic", icon: "garlic" },
    { id: "broth", amount: "2 cups", label: "vegetable broth", icon: "broth" },
    { id: "oil", amount: "1 tbsp", label: "olive oil", icon: "oil" },
    { id: "salt", amount: "1/2 tsp", label: "salt", icon: "salt" },
    { id: "pepper", amount: "1/4 tsp", label: "black pepper", icon: "pepper" }
  ],
  steps: [
    "Heat olive oil in a large pot over medium heat.",
    "Add onion and garlic; sauté until softened, about 5 minutes.",
    "Add crushed tomatoes and vegetable broth; bring to a simmer.",
    "Stir in heavy cream; simmer 10 minutes.",
    "Season with salt and pepper. Blend until smooth and serve."
  ],
  nutrition: {
    perServing: true,
    macros: [
      { label: "kcal", value: "182" },
      { label: "Protein", value: "6g" },
      { label: "Fibre", value: "4g" },
      { label: "Sugar", value: "9g" }
    ]
  }
};

export const chickenCurryRecipe: Recipe = {
  id: "chicken-curry",
  title: "Chicken Curry",
  subtitle: "A mild, protein-forward curry for a relaxed weeknight.",
  prepTime: "15 min",
  cookTime: "25 min",
  servings: 6,
  dietaryBadges: ["High Protein"],
  safetyNotes: [
    "Dietary rules are preferences, not medical prescriptions.",
    "Adjust spice level to taste.",
    "No PHI is stored in this local demo."
  ],
  ingredients: [
    { id: "chicken", amount: "1.5 lbs", label: "boneless chicken thighs", icon: "broth" },
    { id: "onion", amount: "1 large, diced", label: "onion", icon: "onion" },
    { id: "garlic", amount: "4 cloves, minced", label: "garlic", icon: "garlic" },
    { id: "curry-paste", amount: "2 tbsp", label: "mild curry paste", icon: "herb" },
    { id: "coconut-milk", amount: "1 cup", label: "light coconut milk", icon: "milk" },
    { id: "tomatoes", amount: "14 oz", label: "diced tomatoes", icon: "tomato" },
    { id: "broth", amount: "1 cup", label: "chicken broth", icon: "broth" },
    { id: "oil", amount: "1 tbsp", label: "olive oil", icon: "oil" }
  ],
  steps: [
    "Warm olive oil in a large pan over medium heat.",
    "Add onion and garlic; cook until softened, about 4 minutes.",
    "Stir in curry paste and cook 1 minute until fragrant.",
    "Add chicken and cook until lightly browned on the edges.",
    "Stir in coconut milk and simmer 5 minutes.",
    "Add tomatoes and broth; simmer until chicken is cooked through. Serve with rice."
  ],
  nutrition: {
    perServing: true,
    macros: [
      { label: "kcal", value: "312" },
      { label: "Protein", value: "28g" },
      { label: "Fibre", value: "3g" },
      { label: "Sugar", value: "5g" }
    ]
  }
};

export const mushroomPastaRecipe: Recipe = {
  id: "mushroom-pasta",
  title: "Mushroom Pasta",
  subtitle: "Earthy mushrooms in a light garlic sauce over whole wheat pasta.",
  prepTime: "10 min",
  cookTime: "20 min",
  servings: 4,
  dietaryBadges: [],
  safetyNotes: [
    "Dietary rules are preferences, not medical prescriptions.",
    "Use vegetable broth to keep this fully vegetarian.",
    "No PHI is stored in this local demo."
  ],
  ingredients: [
    { id: "pasta", amount: "12 oz", label: "whole wheat penne", icon: "broth" },
    { id: "mushrooms", amount: "12 oz", label: "cremini mushrooms, sliced", icon: "onion" },
    { id: "garlic", amount: "3 cloves, minced", label: "garlic", icon: "garlic" },
    { id: "broth", amount: "1/2 cup", label: "vegetable broth", icon: "broth" },
    { id: "oil", amount: "2 tbsp", label: "olive oil", icon: "oil" },
    { id: "parmesan", amount: "1/4 cup", label: "grated parmesan", icon: "milk" },
    { id: "herbs", amount: "2 tbsp", label: "fresh parsley", icon: "herb" },
    { id: "pepper", amount: "1/4 tsp", label: "black pepper", icon: "pepper" }
  ],
  steps: [
    "Cook pasta in salted water until al dente; reserve 1/2 cup pasta water.",
    "Heat olive oil in a wide pan over medium-high heat.",
    "Add mushrooms and cook until browned, about 6 minutes.",
    "Add garlic and broth; simmer until slightly reduced.",
    "Toss with parmesan and fresh parsley.",
    "Combine pasta with sauce, adding pasta water as needed. Season with pepper."
  ],
  nutrition: {
    perServing: true,
    macros: [
      { label: "kcal", value: "398" },
      { label: "Protein", value: "14g" },
      { label: "Fibre", value: "7g" },
      { label: "Sugar", value: "4g" }
    ]
  }
};

export const RECIPES_BY_ID: Record<RecipeId, Recipe> = {
  "creamy-tomato-soup": homemadeRecipe,
  "chicken-curry": chickenCurryRecipe,
  "mushroom-pasta": mushroomPastaRecipe
};

export function getRecipeById(id: string): Recipe | null {
  return RECIPES_BY_ID[id as RecipeId] ?? null;
}

export const partnerMetrics = [
  { label: "Households cooking this week", value: "128" },
  { label: "Swap acceptance", value: "82%" },
  { label: "SMS nudge opens", value: "41%" },
  { label: "Avg. sodium delta", value: "-18%" }
] as const;

export const PROGRESS_STEPS = [
  "Reading recipe",
  "Checking low-fat guideline",
  "Checking low-sodium guideline"
] as const;

export const ARCH_PIPELINE = [
  "User selects ingredient",
  "User provides available substitute",
  "Backend API builds privacy-safe prompt",
  "LLM suggests substitution",
  "Validation/fallback checks dietary constraints",
  "User confirms",
  "Recipe updates"
] as const;
