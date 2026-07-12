import type { ChatRequest, ChatResponse } from "../types/ai";
import { processImageMessage } from "./imagePipeline";
import { CULINARY_SYSTEM_PROMPT, getGroqClient, getGroqModel } from "./groqClient";
import { buildScopedDeclineReply, isRecipeNutritionInScope } from "./scopeService";

export const CHAT_SYSTEM_SUFFIX =
  " You only discuss recipes, ingredients, cooking techniques, and general nutrition guidance including allergy-aware food questions. Do not assume the user is asking about a recipe unless a recipe context is explicitly provided. Answer the user's explicit question first. When relevant dietary preferences are provided, personalize after the main answer using direct language (e.g. \"For your low-fat goal...\"). Do not use vague phrasing such as \"for some diets\" or \"depending on individual needs\" when the user's preferences are already known. Do not claim a food contains probiotics or live cultures unless that is generally reliable or the product label confirms it — for cultured dairy-style products, qualify as \"some varieties may contain live cultures.\" Stored allergies, cooking audience, and pantry settings are secondary — do not reinterpret the question as allergy safety unless asked. Do not mention shellfish, family dinner, pantry mode, or other profile details unless directly relevant. If the user makes an ambiguous statement, ask one brief clarification question. Do not invent ingredients, recipes, dietary goals, preferences, or prior context. Prefer decision-oriented answers and avoid unnecessary follow-up questions. Politely decline only unrelated topics like weather, politics, or coding.";

export type RelevantUserContext = {
  allergies?: string[];
  dietaryGoals?: string[];
  cookingFor?: string;
  pantryMode?: string;
};

/** @deprecated Prefer RelevantUserContext */
export type RelevantPreferenceContext = {
  dietaryGoals: string[];
  allergies: string[];
  cookingFor?: string;
  pantryMode?: string;
};

export type PreferenceIntentHint = {
  type: string;
};

const RECOMMENDATION_SIGNAL =
  /\b(alternatives?|substitute|substitutes|similar to|versatile|compare|versus|vs\.?|closest|best (replacement|substitute|alternative)|other (options|alternatives)|what can replace|high[\s-]?protein)\b/i;

const COOKING_FOR_RELEVANT =
  /\b(serving|servings|portion|family|guests|crowd|meal plan|meal-planning|how many|for (my )?(kids|family|partner|two|everyone)|audience|for four|for 4)\b/i;

/** Explicit allergy / ingredient-safety language only — never bare food nouns. */
const ALLERGY_SAFETY_RELEVANT =
  /\b(allerg(?:y|ies|ic)|contains|safe|safety|reaction|avoid|cross[\s-]?contamination|can i eat|can i have|intoleran)\b/i;

const DIETARY_GOAL_RELEVANT =
  /\b(good|bad|healthy|unhealthy|protein|fat|sodium|calorie|calories|diet|dietary|healthier|low[\s-]?fat|low[\s-]?sodium|high[\s-]?protein|nutrition|weight|macro|snack|fit my diet|good for me)\b/i;

const PANTRY_RELEVANT = /\b(pantry|what (do )?i have|already have|on hand|use what|leftovers?)\b/i;

const NUTRITION_SHORTHAND =
  /^(?:is\s+|are\s+)?[\w][\w\s'-]{0,40}?\s+(good|bad|healthy|unhealthy|ok|okay|fine)(?:\s+for\s+[\w\s-]{1,30})?\s*\??$/i;

export function isRecommendationOrComparisonRequest(message: string): boolean {
  const text = message.trim();
  if (!RECOMMENDATION_SIGNAL.test(text)) return false;
  return (
    /\b(alternatives?|compare|versus|vs\.?|closest|best (replacement|substitute|alternative)|similar to|versatile|other (options|alternatives)|what can replace)\b/i.test(
      text
    ) ||
    (/\bhigh[\s-]?protein\b/i.test(text) &&
      /\b(substitute|alternative|replace|instead)\b/i.test(text))
  );
}

export function isAllergySafetyQuestion(message: string): boolean {
  return ALLERGY_SAFETY_RELEVANT.test(message.trim());
}

export function isNutritionOrDietQuestion(message: string): boolean {
  const text = message.trim();
  return DIETARY_GOAL_RELEVANT.test(text) || NUTRITION_SHORTHAND.test(text);
}

export function inferPromptIntent(message: string): PreferenceIntentHint {
  const text = message.trim();
  if (isAllergySafetyQuestion(text)) return { type: "allergy_question" };
  if (isRecommendationOrComparisonRequest(text)) return { type: "ingredient_recommendation" };
  if (PANTRY_RELEVANT.test(text)) return { type: "pantry_request" };
  if (COOKING_FOR_RELEVANT.test(text) && /\b(how many|serving|portion|for four|for 4|meal plan)\b/i.test(text)) {
    return { type: "serving_question" };
  }
  if (isNutritionOrDietQuestion(text)) return { type: "nutrition_question" };
  if (/^how (do|can|should) i\b/i.test(text)) return { type: "cooking_question" };
  return { type: "general" };
}

/**
 * Deterministic relevance selector — only include prefs that materially affect the question.
 */
export function selectRelevantUserContext(
  message: string,
  intent: PreferenceIntentHint,
  preferences: {
    allergies: string[];
    dietaryGoals: string[];
    cookingFor?: string;
    pantryMode?: string;
  }
): RelevantUserContext {
  const text = message.trim();
  const selected: RelevantUserContext = {};

  switch (intent.type) {
    case "nutrition_question":
    case "dietary_fit": {
      if (preferences.dietaryGoals.length > 0) {
        selected.dietaryGoals = preferences.dietaryGoals;
      }
      if (isAllergySafetyQuestion(text) && preferences.allergies.length > 0) {
        selected.allergies = preferences.allergies;
      }
      return selected;
    }
    case "allergy_question": {
      if (preferences.allergies.length > 0) {
        selected.allergies = preferences.allergies;
      }
      return selected;
    }
    case "meal_planning":
    case "serving_question": {
      if (preferences.cookingFor) {
        selected.cookingFor = preferences.cookingFor;
      }
      return selected;
    }
    case "pantry_request": {
      if (preferences.pantryMode) {
        selected.pantryMode = preferences.pantryMode;
      }
      return selected;
    }
    case "ingredient_recommendation": {
      if (preferences.dietaryGoals.length > 0) {
        selected.dietaryGoals = preferences.dietaryGoals;
      }
      return selected;
    }
    case "cooking_question":
      return {};
    default: {
      if (isAllergySafetyQuestion(text) && preferences.allergies.length > 0) {
        selected.allergies = preferences.allergies;
      }
      if (isNutritionOrDietQuestion(text) && preferences.dietaryGoals.length > 0) {
        selected.dietaryGoals = preferences.dietaryGoals;
      }
      if (preferences.cookingFor && COOKING_FOR_RELEVANT.test(text)) {
        selected.cookingFor = preferences.cookingFor;
      }
      if (preferences.pantryMode && PANTRY_RELEVANT.test(text)) {
        selected.pantryMode = preferences.pantryMode;
      }
      return selected;
    }
  }
}

/** Back-compat wrapper used by older tests / call sites. */
export function selectRelevantPreferences(request: ChatRequest): RelevantPreferenceContext {
  const context = selectRelevantUserContext(
    request.message,
    inferPromptIntent(request.message),
    {
      allergies: request.allergies,
      dietaryGoals: request.dietaryGoals,
      cookingFor: request.cookingFor,
      pantryMode: request.pantryMode
    }
  );

  return {
    dietaryGoals: context.dietaryGoals ?? [],
    allergies: context.allergies ?? [],
    cookingFor: context.cookingFor,
    pantryMode: context.pantryMode
  };
}

function buildPreferenceSection(prefs: RelevantUserContext): string {
  const hasDietary = Boolean(prefs.dietaryGoals && prefs.dietaryGoals.length > 0);
  const hasAllergies = Boolean(prefs.allergies && prefs.allergies.length > 0);
  const hasCookingFor = Boolean(prefs.cookingFor);
  const hasPantry = Boolean(prefs.pantryMode);

  if (!hasDietary && !hasAllergies && !hasCookingFor && !hasPantry) {
    return "";
  }

  const lines: string[] = ["Relevant user preferences:"];

  if (hasDietary) {
    lines.push(...prefs.dietaryGoals!.map((goal) => `- ${goal}`));
  }

  if (hasAllergies) {
    lines.push(...prefs.allergies!.map((item) => `- Avoid ${item}`));
  }

  if (hasCookingFor) {
    lines.push(`- Cooking for: ${prefs.cookingFor}`);
  }

  if (hasPantry) {
    lines.push(`- Pantry mode: ${prefs.pantryMode}`);
  }

  lines.push(
    "Use these preferences to personalize the answer after addressing the user's main question."
  );
  lines.push(
    "Explain whether the food fits these preferences and mention any version, preparation, portion, or nutrition-label details the user should consider."
  );
  lines.push(
    "Do not force every preference into the answer if it is not materially relevant."
  );
  lines.push(
    'Do not use vague phrasing such as "for some diets", "depending on individual needs", or "may suit certain people" when the user\'s preferences are known.'
  );
  lines.push(
    'Prefer direct language: "For your low-fat goal...", "For your low-sodium preference...", "This can fit your diet if...".'
  );

  return lines.join("\n");
}

function buildPersonalizationRules(): string {
  return [
    "When relevant dietary preferences are provided:",
    "- Answer the general food or nutrition question first.",
    "- Then explicitly explain how the food fits the user’s preferences.",
    '- Use direct but qualified language such as "This can fit your low-fat goal..." or "For your low-sodium preference...".',
    "- Mention practical selection guidance, such as choosing low-fat, unsweetened, lower-sodium, or fortified versions when relevant.",
    "- Mention one meaningful trade-off or caution.",
    "- Do not make the answer sound universally positive or negative.",
    "- Do not mention unrelated allergies or profile information.",
    '- Do not say only "it depends on individual needs" when the user’s relevant needs are already known.',
    '- Do not claim probiotics or live cultures unless generally reliable; otherwise say "some varieties may contain live cultures."'
  ].join("\n");
}

function buildRecommendationRules(): string {
  return [
    "For recommendation or comparison requests:",
    "- Give 3 to 5 concrete options.",
    "- Compare them using the user’s stated criteria.",
    "- Explain important trade-offs briefly.",
    "- End with the best overall choice.",
    "- Do not ask a follow-up question unless essential information is missing.",
    "- Do not mention cookingFor, audience/serving context, pantry mode, or dietary goals unless directly relevant.",
    "- Do not begin with vague pronouns such as “they” or “these”.",
    "- Answer directly in the first sentence with named options.",
    "- Prefer a short intro sentence, then bullet points, then one best-choice line."
  ].join("\n");
}

export function buildChatPrompt(request: ChatRequest): string {
  const recipe = request.recipe;
  const ingredientLines = recipe
    ? recipe.ingredients.map((item) => `- ${item.label}: ${item.amount}`).join("\n")
    : "";

  const recipeSection = recipe
    ? [
        `Recipe context: ${recipe.title}`,
        "Ingredients in recipe:",
        ingredientLines || "- (none listed)"
      ].join("\n")
    : "";

  const intent = inferPromptIntent(request.message);
  const relevantPrefs = selectRelevantUserContext(request.message, intent, {
    allergies: request.allergies,
    dietaryGoals: request.dietaryGoals,
    cookingFor: request.cookingFor,
    pantryMode: request.pantryMode
  });
  const preferenceSection = buildPreferenceSection(relevantPrefs);
  const isRecommendation = intent.type === "ingredient_recommendation";
  const hasDietaryPersonalization = Boolean(
    relevantPrefs.dietaryGoals && relevantPrefs.dietaryGoals.length > 0
  );

  const history =
    request.history.length > 0
      ? request.history
          .map((turn) => `${turn.role === "user" ? "User" : "Archie"}: ${turn.content}`)
          .join("\n")
      : "None";

  const baseRules = [
    "Rules:",
    "- Answer the user's explicit question first.",
    "- Stored allergies, dietary preferences, cooking audience, and pantry settings are secondary context. Do not change the meaning of the user's question to match those preferences.",
    "- Do not answer an allergy-safety question unless the user asks about allergy safety or there is an immediate relevant safety concern.",
    "- For broad nutrition questions (e.g. whether a food is good/healthy), briefly explain main benefits and trade-offs, then personalize when preferences are provided.",
    "- Do not mention shellfish, family dinner, pantry mode, or other profile details unless directly relevant.",
    '- Do not claim a food contains probiotics or live cultures unless generally reliable; otherwise qualify as "some varieties may contain live cultures."',
    "- Use only explicitly provided context.",
    "- If the message is ambiguous, ask one concise clarification question.",
    "- Do not invent a recipe or ingredient relationship.",
    "- Keep the answer concise and practical.",
    "- Do not ask unnecessary follow-up questions when the request is already answerable.",
    "- Only respond with exactly {\"decline\": true} for clearly unrelated topics like weather, politics, coding, or homework — never for food or nutrition follow-ups.",
    "- Never provide medical diagnosis or clinical safety claims."
  ];

  const sections = [
    recipeSection,
    preferenceSection,
    `Conversation so far:\n${history}`,
    `Latest user message:\n${request.message}`,
    baseRules.join("\n"),
    hasDietaryPersonalization ? buildPersonalizationRules() : "",
    isRecommendation ? buildRecommendationRules() : ""
  ].filter(Boolean);

  return sections.join("\n\n");
}

function buildFallbackChatReply(request: ChatRequest): string {
  const recipeTitle = request.recipe?.title;

  if (isRecommendationOrComparisonRequest(request.message)) {
    if (/cottage\s*cheese/i.test(request.message)) {
      return [
        "The closest high-protein alternatives are Greek yogurt, quark, ricotta, and blended firm tofu.",
        "",
        "• Greek yogurt — high in protein and useful for dips, sauces, bowls, and baking.",
        "• Quark — probably the closest match in both texture and protein, if available.",
        "• Ricotta — very versatile for pasta, toast, desserts, and fillings, but usually lower in protein.",
        "• Blended firm tofu — a good dairy-free option for savory dishes and creamy fillings.",
        "",
        "For the closest overall substitute, choose quark or Greek yogurt."
      ].join("\n");
    }

    if (/ricotta/i.test(request.message)) {
      return [
        "Strong high-protein ricotta substitutes include cottage cheese, Greek yogurt, quark, and blended firm tofu.",
        "",
        "• Cottage cheese — closest savory dairy swap; blend for a smoother texture.",
        "• Greek yogurt — higher protein and good for baking, dips, and creamy sauces.",
        "• Quark — excellent texture match with solid protein, if you can find it.",
        "• Blended firm tofu — best dairy-free savory option.",
        "",
        "Best overall high-protein pick: Greek yogurt or cottage cheese."
      ].join("\n");
    }

    return [
      "Here are solid alternatives based on your criteria:",
      "",
      "• Greek yogurt — high protein and versatile for savory or sweet uses.",
      "• Quark — close texture and protein when available.",
      "• Ricotta — versatile for cooking, usually lower protein.",
      "• Blended firm tofu — dairy-free and useful in savory dishes.",
      "",
      "Best overall choice for high protein and versatility: Greek yogurt or quark."
    ].join("\n");
  }

  if (NUTRITION_SHORTHAND.test(request.message) || /\b(good|healthy)\b/i.test(request.message)) {
    const goals = request.dietaryGoals;
    const hasLowFat = goals.some((goal) => /low[\s-]?fat/i.test(goal));
    const hasLowSodium = goals.some((goal) => /low[\s-]?sodium/i.test(goal));

    if (hasLowFat || hasLowSodium) {
      const parts = [
        "It can be a good high-protein option and can fit your diet when you choose the right version."
      ];
      if (hasLowFat) {
        parts.push("For your low-fat goal, choose a low-fat or fat-free variety.");
      }
      if (hasLowSodium) {
        parts.push(
          "For your low-sodium preference, compare brands because sodium levels vary significantly."
        );
      }
      parts.push("Flavored or full-fat versions may fit less closely with those goals.");
      return parts.join(" ");
    }

    return `It can be a solid choice depending on your goals — many versions are high in protein and provide calcium, while fat and sodium vary by brand, so check the label if those matter to you.`;
  }

  if (/protein|lean|high protein/i.test(request.message)) {
    return recipeTitle
      ? `For ${recipeTitle}, focus on protein-rich add-ins that fit your goals — like beans, lentils, tofu, or lean poultry depending on the dish.`
      : `Focus on protein-rich add-ins — like beans, lentils, tofu, or lean poultry depending on the dish.`;
  }

  if (/sodium|salt|lower sodium/i.test(request.message)) {
    return recipeTitle
      ? `For ${recipeTitle}, try reducing added salt, using low-sodium broth, and boosting flavor with herbs, garlic, and acid instead.`
      : `Try reducing added salt, using low-sodium broth, and boosting flavor with herbs, garlic, and acid.`;
  }

  if (/dairy|dairy-free|lactose/i.test(request.message)) {
    return recipeTitle
      ? `For ${recipeTitle}, dairy-free swaps depend on the ingredient — coconut milk, plant yogurt, or olive oil can work in different steps.`
      : `Dairy-free swaps depend on the ingredient — coconut milk, plant yogurt, or olive oil can work in different dishes.`;
  }

  if (/\b(crab|shrimp|lobster|shellfish|prawn)\b/i.test(request.message)) {
    const hasShellfishAllergy = request.allergies.some((item) => /shellfish/i.test(item));
    if (hasShellfishAllergy) {
      return recipeTitle
        ? `Because you avoid shellfish, crab isn't a good fit for your meals — including in ${recipeTitle}. Stick with shellfish-free proteins like chicken, tofu, beans, or lentils instead.`
        : `Because you avoid shellfish, crab isn't a good fit for your meals. Stick with shellfish-free proteins like chicken, tofu, beans, or lentils instead.`;
    }
    return `Crab and other shellfish can work in some dishes, but check that they fit your dietary goals and how they're prepared.`;
  }

  return recipeTitle
    ? `I can help with ${recipeTitle} — ingredient swaps, dietary adjustments, and cooking questions.`
    : `I can help with ingredient swaps, dietary adjustments, and pantry ideas.`;
}

function profileFromRequest(request: ChatRequest) {
  return {
    cookingFor: request.cookingFor,
    dietaryGoals: request.dietaryGoals,
    allergies: request.allergies,
    recipeTitle: request.recipe?.title
  };
}

/** Normalize request so recipe is only used when explicitly attached. */
export function withExplicitRecipeOnly(request: ChatRequest): ChatRequest {
  if (request.recipe && request.recipeExplicitlyAttached) {
    return request;
  }
  return { ...request, recipe: undefined, recipeExplicitlyAttached: undefined };
}

export async function generateChatReply(request: ChatRequest): Promise<ChatResponse> {
  const safeRequest = withExplicitRecipeOnly(request);
  const profile = profileFromRequest(safeRequest);
  const hasImage = Boolean(safeRequest.imageDataUrl);

  if (!isRecipeNutritionInScope(safeRequest.message, safeRequest.history, hasImage)) {
    console.info("[ai] chat declined — out of scope", {
      recipeId: safeRequest.recipe?.id ?? null,
      messageLength: safeRequest.message.length
    });
    return {
      source: "declined",
      reply: buildScopedDeclineReply(profile),
      inScope: false
    };
  }

  if (hasImage) {
    const pipelineResponse = await processImageMessage(safeRequest);
    console.info("[ai] image pipeline reply", {
      recipeId: safeRequest.recipe?.id ?? null,
      source: pipelineResponse?.source
    });
    return pipelineResponse!;
  }

  const client = getGroqClient();

  if (!client) {
    console.warn("[ai] GROQ_API_KEY missing — using chat fallback", {
      recipeId: safeRequest.recipe?.id ?? null
    });
    return {
      source: "fallback",
      reply: buildFallbackChatReply(safeRequest),
      inScope: true
    };
  }

  try {
    const prompt = buildChatPrompt(safeRequest);
    const completion = await client.chat.completions.create({
      model: getGroqModel(),
      max_tokens: 700,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `${CULINARY_SYSTEM_PROMPT}${CHAT_SYSTEM_SUFFIX}`
        },
        { role: "user", content: prompt }
      ]
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error("No text response from model");
    }

    if (/{"decline"\s*:\s*true}/i.test(reply) || reply.toLowerCase().includes('"decline": true')) {
      return {
        source: "declined",
        reply: buildScopedDeclineReply(profile),
        inScope: false
      };
    }

    console.info("[ai] chat reply generated", {
      recipeId: safeRequest.recipe?.id ?? null,
      source: "ai",
      recommendation: isRecommendationOrComparisonRequest(safeRequest.message)
    });

    return {
      source: "ai",
      reply,
      inScope: true
    };
  } catch (error) {
    console.warn("[ai] chat generation failed — using fallback", {
      recipeId: safeRequest.recipe?.id ?? null,
      error: error instanceof Error ? error.message : "unknown"
    });
    return {
      source: "fallback",
      reply: buildFallbackChatReply(safeRequest),
      inScope: true
    };
  }
}
