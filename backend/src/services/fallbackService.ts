import type { SubstituteRequest, SubstituteResponse } from "../types/ai";

function normalizeUserHas(value: string) {
  return value.trim().toLowerCase();
}

function matchesUserHas(userHas: string, ...options: string[]) {
  const normalized = normalizeUserHas(userHas);
  return options.some((option) => normalized.includes(option));
}

function findStepIndexFor(request: SubstituteRequest): number {
  const name = request.ingredientToReplace.name.toLowerCase();
  return request.recipe.steps.findIndex((step) => step.toLowerCase().includes(name));
}

function buildCreamFallback(request: SubstituteRequest): SubstituteResponse["recommendation"] {
  const { userHas } = request;
  const benefits = ["Lower fat", "Creamy texture"];
  const stepIndex = findStepIndexFor(request);

  if (matchesUserHas(userHas, "yogurt", "greek")) {
    return {
      name: "Greek yogurt + milk",
      amount: "1/2 cup Greek yogurt + 2 tbsp milk",
      whyThisWorks: "Keeps the dish creamy while reducing saturated fat.",
      dietaryFit: "Fits low-fat and low-sodium goals.",
      recipeImpact: "Lower heat before stirring it in to prevent curdling.",
      confidence: "High",
      stepUpdates:
        stepIndex >= 0
          ? [
              {
                stepIndex,
                text: "Reduce heat to low. Stir in Greek yogurt and milk until creamy; do not boil.",
                reason: "Yogurt curdles at a boil"
              }
            ]
          : undefined,
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

  return buildGenericFallback(request);
}

function buildAromaticFallback(request: SubstituteRequest): SubstituteResponse["recommendation"] {
  const { userHas, ingredientToReplace } = request;
  const trimmed = userHas.trim();
  const isGarnishStyle = matchesUserHas(userHas, "spring onion", "green onion", "scallion", "chive");
  const stepIndex = findStepIndexFor(request);
  const lastStepIndex = request.recipe.steps.length - 1;

  if (isGarnishStyle) {
    return {
      name: trimmed,
      amount: `Use ${trimmed} to taste, added at the end`,
      whyThisWorks: `${trimmed} are delicate — they shine as a fresh finish instead of being cooked down like ${ingredientToReplace.name}.`,
      dietaryFit: "Light, fresh, and fits most dietary goals.",
      recipeImpact: "Moves from the sauté stage to a garnish at the end of cooking.",
      confidence: "Medium",
      stepUpdates: [
        ...(stepIndex >= 0
          ? [
              {
                stepIndex,
                text: request.recipe.steps[stepIndex].replace(
                  new RegExp(ingredientToReplace.name, "i"),
                  ""
                )
                  .replace(/\s{2,}/g, " ")
                  .trim(),
                reason: `${trimmed} should not be sautéed like ${ingredientToReplace.name}`
              }
            ]
          : []),
        {
          stepIndex: lastStepIndex,
          text: `${request.recipe.steps[lastStepIndex].replace(/\.$/, "")}. Top with sliced ${trimmed.toLowerCase()} before serving.`,
          reason: "Added as a fresh garnish"
        }
      ],
      benefits: ["Fresh flavor", "No cooking change needed"]
    };
  }

  return {
    name: trimmed,
    amount: `Use ${trimmed} in a similar amount to ${ingredientToReplace.name}`,
    whyThisWorks: "Fills the same aromatic role in the base of the dish.",
    dietaryFit: "Check your substitute against the recipe's dietary goals.",
    recipeImpact: "Cook until softened, the same as the original aromatic.",
    confidence: "Medium",
    benefits: ["Similar role", "Pantry-friendly"]
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
    benefits: ["Pantry-friendly", "Keeps the dish on track"]
  };
}

export function buildFallbackResponse(request: SubstituteRequest): SubstituteResponse {
  const name = request.ingredientToReplace.name.toLowerCase();

  let recommendation: SubstituteResponse["recommendation"];
  if (name.includes("cream")) {
    recommendation = buildCreamFallback(request);
  } else if (
    name.includes("onion") ||
    name.includes("garlic") ||
    name.includes("shallot") ||
    name.includes("leek")
  ) {
    recommendation = buildAromaticFallback(request);
  } else {
    recommendation = buildGenericFallback(request);
  }

  return {
    source: "fallback",
    original: request.ingredientToReplace,
    userHas: request.userHas.trim(),
    recommendation
  };
}
