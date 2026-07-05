import type { SubstituteRequest } from "../types/ai";

export function buildSubstitutePrompt(request: SubstituteRequest): string {
  const ingredientList = request.recipe.ingredients
    .map((item) => `- ${item.label}: ${item.amount}`)
    .join("\n");

  const steps = request.recipe.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");

  const dietaryGoals =
    request.dietaryGoals.length > 0 ? request.dietaryGoals.join(", ") : "None specified";
  const allergies = request.allergies.length > 0 ? request.allergies.join(", ") : "None specified";

  return `You are a culinary assistant for a home cooking app. Provide practical ingredient substitution guidance only — not medical advice, diagnosis, or clinical safety claims.

Recipe: ${request.recipe.title} (id: ${request.recipe.id})
Cooking for: ${request.cookingFor}
Pantry mode: ${request.pantryMode}

Dietary goals: ${dietaryGoals}
Allergies to avoid: ${allergies}

Ingredients:
${ingredientList}

Steps:
${steps}

Replace this ingredient:
- Name: ${request.ingredientToReplace.name}
- Amount: ${request.ingredientToReplace.amount}

User has on hand: ${request.userHas}

Rules:
- Phrase guidance as dietary/cooking advice, never medical advice.
- Respect allergies and dietary goals strictly.
- If the user's substitute conflicts with an allergy or goal, reject it and recommend a safer practical alternative instead.
- Recommend only realistic home-cooking substitutions.
- Include an updated recipe step when the cooking method should change.
- Do not include patient identifiers or personal health data.

Return strict JSON only with this shape:
{
  "recommendation": {
    "name": "string",
    "amount": "string",
    "whyThisWorks": "string",
    "dietaryFit": "string",
    "recipeImpact": "string",
    "confidence": "High" | "Medium" | "Low",
    "updatedStep": "string or omit if unchanged",
    "benefits": ["string"]
  }
}`;
}
