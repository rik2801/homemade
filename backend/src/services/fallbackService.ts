import type { SubstituteRequest, SubstituteResponse } from "../types/ai";

function normalizeUserHas(value: string) {
  return value.trim().toLowerCase();
}

function matchesUserHas(userHas: string, ...options: string[]) {
  const normalized = normalizeUserHas(userHas);
  return options.some((option) => normalized.includes(option));
}

function buildHeavyCreamFallback(request: SubstituteRequest): SubstituteResponse["recommendation"] {
  const { userHas, ingredientToReplace } = request;
  const benefits = ["Lower fat", "Low sodium", "Creamy texture"];

  if (matchesUserHas(userHas, "yogurt", "greek")) {
    return {
      name: "Greek yogurt + milk",
      amount: "1/2 cup Greek yogurt + 2 tbsp milk",
      whyThisWorks: "Keeps the soup creamy while reducing saturated fat.",
      dietaryFit: "Fits low-fat and low-sodium goals.",
      recipeImpact: "Lower heat before stirring it in to prevent curdling.",
      confidence: "High",
      updatedStep: "Reduce heat to low. Stir in Greek yogurt and milk until creamy; do not boil.",
      benefits
    };
  }

  if (matchesUserHas(userHas, "milk")) {
    return {
      name: "Milk + cornstarch slurry",
      amount: "1/2 cup milk + 1 tbsp cornstarch slurry",
      whyThisWorks: "Adds body without heavy cream while keeping the swap pantry-simple.",
      dietaryFit: "Lower fat than heavy cream; choose unsalted milk if sodium is a concern.",
      recipeImpact: "Whisk the slurry in off heat, then warm gently to thicken.",
      confidence: "Medium",
      benefits
    };
  }

  if (matchesUserHas(userHas, "coconut")) {
    return {
      name: "Coconut milk",
      amount: "1/2 cup light coconut milk",
      whyThisWorks: "Adds richness and a smooth texture without dairy.",
      dietaryFit: "Can fit low-sodium goals if you choose an unsweetened can.",
      recipeImpact: "Works for texture, but changes flavor.",
      confidence: "Medium",
      benefits
    };
  }

  return {
    name: `${userHas.trim()} (adapted)`,
    amount: `Use ${userHas.trim()} in the same amount as ${ingredientToReplace.name}, adjusted to taste`,
    whyThisWorks: "Uses what you have on hand while keeping the recipe structure intact.",
    dietaryFit: "Review sodium and fat content of your substitute against the recipe goals.",
    recipeImpact: "Taste and texture may shift — adjust seasoning after swapping.",
    confidence: "Medium",
    benefits
  };
}

function buildGenericFallback(request: SubstituteRequest): SubstituteResponse["recommendation"] {
  const { userHas, ingredientToReplace } = request;

  return {
    name: userHas.trim(),
    amount: `Use ${userHas.trim()} in place of ${ingredientToReplace.name}`,
    whyThisWorks: "Uses the ingredient you said you have while keeping the recipe workable.",
    dietaryFit: "Check that your substitute fits the recipe's dietary goals.",
    recipeImpact: "Flavor and texture may change slightly.",
    confidence: "Medium",
    benefits: ["Lower fat", "Low sodium"]
  };
}

export function buildFallbackResponse(request: SubstituteRequest): SubstituteResponse {
  const recommendation =
    request.ingredientToReplace.name.toLowerCase() === "heavy cream"
      ? buildHeavyCreamFallback(request)
      : buildGenericFallback(request);

  return {
    source: "fallback",
    original: request.ingredientToReplace,
    userHas: request.userHas.trim(),
    recommendation
  };
}
