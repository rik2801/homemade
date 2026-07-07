import type { SubstituteRequest, SuggestSubstitutesRequest } from "../types/ai";

function formatRecipeContext(recipe: SubstituteRequest["recipe"]) {
  const ingredientList = recipe.ingredients
    .map((item) => `- ${item.label}: ${item.amount}`)
    .join("\n");

  const steps = recipe.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");

  return { ingredientList, steps };
}

export function buildSubstitutePrompt(request: SubstituteRequest): string {
  const { ingredientList, steps } = formatRecipeContext(request.recipe);

  const dietaryGoals =
    request.dietaryGoals.length > 0 ? request.dietaryGoals.join(", ") : "None specified";
  const allergies = request.allergies.length > 0 ? request.allergies.join(", ") : "None specified";
  const excluded =
    request.exclude && request.exclude.length > 0
      ? `\nDo NOT recommend any of these (already rejected by the user): ${request.exclude.join(", ")}.`
      : "";

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

User has on hand: ${request.userHas}${excluded}

Rules:
- Phrase guidance as dietary/cooking advice, never medical advice.
- Respect allergies and dietary goals strictly.
- If the user's substitute conflicts with an allergy or goal, reject it and recommend a safer practical alternative instead.
- Recommend only realistic home-cooking substitutions.
- Do not include patient identifiers or personal health data.

Rules for updating preparation steps (stepUpdates):
- Only include stepUpdates when the cooking method, timing, order, or technique must actually change. For a straight 1:1 replacement, return an empty stepUpdates array.
- The nature of the substitute may change WHERE it belongs in the recipe. Example: swapping onion for spring onions — spring onions are a garnish, so remove them from the sauté step and rewrite the final step to top the finished dish with them.
- When a delicate ingredient replaces a robust one (e.g. yogurt for cream), rewrite the step where it is added with heat warnings (lower heat, do not boil).
- When an aromatic is omitted or changed, rewrite every affected step, adjusting cook times where needed.
- Rewrite the FULL text of each changed step, not a diff. Include ALL affected steps, not just one.
- stepNumber refers to the numbered steps shown above (1-based).

Return strict JSON only with this shape:
{
  "recommendation": {
    "name": "string",
    "amount": "string",
    "whyThisWorks": "string",
    "dietaryFit": "string",
    "recipeImpact": "string",
    "confidence": "High" | "Medium" | "Low",
    "stepUpdates": [
      { "stepNumber": 4, "text": "full rewritten step text", "reason": "short reason" }
    ],
    "benefits": ["string"]
  }
}`;
}

export function buildSuggestSubstitutesPrompt(request: SuggestSubstitutesRequest): string {
  const { ingredientList, steps } = formatRecipeContext(request.recipe);

  const dietaryGoals =
    request.dietaryGoals.length > 0 ? request.dietaryGoals.join(", ") : "None specified";
  const allergies = request.allergies.length > 0 ? request.allergies.join(", ") : "None specified";

  return `You are a culinary assistant for a home cooking app. A home cook wants to replace an ingredient in a recipe and needs quick ideas for common substitutes they might already have.

Recipe: ${request.recipe.title}
Cooking for: ${request.cookingFor}
Dietary goals: ${dietaryGoals}
Allergies to avoid: ${allergies}

Ingredients:
${ingredientList}

Steps:
${steps}

Ingredient to replace: ${request.ingredientToReplace.name} (${request.ingredientToReplace.amount})

Rules:
- Suggest exactly 3 realistic substitutes a home cook plausibly has in their kitchen.
- Each must work for THIS ingredient's role in THIS recipe (texture, cooking stage, flavor).
- Respect allergies and dietary goals strictly.
- Keep each label to 1-3 words and each shortReason under 8 words.

Return strict JSON only with this shape:
{
  "suggestions": [
    { "label": "Greek yogurt", "shortReason": "creamy, lower fat" }
  ]
}`;
}
