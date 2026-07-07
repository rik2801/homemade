import type { ChatRequest, ChatResponse } from "../types/ai";
import { processImageMessage } from "./imagePipeline";
import { CULINARY_SYSTEM_PROMPT, getGroqClient, getGroqModel } from "./groqClient";
import { buildScopedDeclineReply, isRecipeNutritionInScope } from "./scopeService";

function buildChatPrompt(request: ChatRequest): string {
  const ingredients = request.recipe.ingredients
    .map((item) => `- ${item.label}: ${item.amount}`)
    .join("\n");

  const dietaryGoals =
    request.dietaryGoals.length > 0 ? request.dietaryGoals.join(", ") : "None specified";
  const allergies = request.allergies.length > 0 ? request.allergies.join(", ") : "None specified";

  const history =
    request.history.length > 0
      ? request.history
          .map((turn) => `${turn.role === "user" ? "User" : "Archie"}: ${turn.content}`)
          .join("\n")
      : "None";

  return `Recipe context: ${request.recipe.title}
Cooking for: ${request.cookingFor}

Dietary goals: ${dietaryGoals}
Allergies to avoid: ${allergies}

Ingredients in recipe:
${ingredients}

Conversation so far:
${history}

Latest user question: ${request.message}

Rules:
- Only answer recipe, cooking, ingredient, and nutrition questions.
- Short follow-ups about specific foods, allergies, or dietary restrictions are in scope — especially when continuing the conversation above.
- If the user asks whether they can eat a food given their allergies or goals, answer directly as dietary guidance (not medical advice).
- Only respond with exactly {"decline": true} for clearly unrelated topics like weather, politics, coding, or homework — never for food or nutrition follow-ups.
- Respect allergies and dietary goals.
- Keep in-scope replies to 2-4 short sentences.
- Never provide medical diagnosis or clinical safety claims.`;
}

function buildFallbackChatReply(request: ChatRequest): string {
  const recipeTitle = request.recipe.title;

  if (/protein|lean|high protein/i.test(request.message)) {
    return `For ${recipeTitle}, focus on protein-rich add-ins that fit your goals — like beans, lentils, tofu, or lean poultry depending on the dish. I can also walk you through a specific ingredient swap if you tell me what you're making.`;
  }

  if (/sodium|salt|lower sodium/i.test(request.message)) {
    return `For ${recipeTitle}, try reducing added salt, using low-sodium broth, and boosting flavor with herbs, garlic, and acid instead. Tell me which ingredient you'd like to adjust and I can suggest a swap.`;
  }

  if (/dairy|dairy-free|lactose/i.test(request.message)) {
    return `For ${recipeTitle}, dairy-free swaps depend on the ingredient — coconut milk, plant yogurt, or olive oil can work in different steps. Say "swap an ingredient" and I'll guide you through options.`;
  }

  if (/\b(crab|shrimp|lobster|shellfish|prawn)\b/i.test(request.message)) {
    const hasShellfishAllergy = request.allergies.some((item) => /shellfish/i.test(item));
    if (hasShellfishAllergy) {
      return `Because you avoid shellfish, crab isn't a good fit for your meals — including in ${recipeTitle}. Stick with shellfish-free proteins like chicken, tofu, beans, or lentils instead.`;
    }
    return `Crab and other shellfish can work in some dishes, but check that they fit your low-fat and low-sodium goals and how they're prepared.`;
  }

  return `I can help with ${recipeTitle} — ingredient swaps, dietary adjustments, and what to use from your pantry. Try "Swap an ingredient" or ask about a specific ingredient in the recipe.`;
}

function profileFromRequest(request: ChatRequest) {
  return {
    cookingFor: request.cookingFor,
    dietaryGoals: request.dietaryGoals,
    allergies: request.allergies,
    recipeTitle: request.recipe.title
  };
}

export async function generateChatReply(request: ChatRequest): Promise<ChatResponse> {
  const profile = profileFromRequest(request);
  const hasImage = Boolean(request.imageDataUrl);

  if (!isRecipeNutritionInScope(request.message, request.history, hasImage)) {
    console.info("[ai] chat declined — out of scope", {
      recipeId: request.recipe.id,
      messageLength: request.message.length
    });
    return {
      source: "declined",
      reply: buildScopedDeclineReply(profile),
      inScope: false
    };
  }

  if (hasImage) {
    const pipelineResponse = await processImageMessage(request);
    console.info("[ai] image pipeline reply", {
      recipeId: request.recipe.id,
      source: pipelineResponse?.source
    });
    return pipelineResponse!;
  }

  const client = getGroqClient();

  if (!client) {
    console.warn("[ai] GROQ_API_KEY missing — using chat fallback", {
      recipeId: request.recipe.id
    });
    return {
      source: "fallback",
      reply: buildFallbackChatReply(request),
      inScope: true
    };
  }

  try {
    const prompt = buildChatPrompt(request);
    const completion = await client.chat.completions.create({
      model: getGroqModel(),
      max_tokens: 512,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `${CULINARY_SYSTEM_PROMPT} You only discuss recipes, ingredients, cooking techniques, and general nutrition guidance including allergy-aware food questions. Never decline a follow-up about whether a specific food fits the user's diet or allergies. Politely decline only unrelated topics like weather, politics, or coding.`
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
      recipeId: request.recipe.id,
      source: "ai"
    });

    return {
      source: "ai",
      reply,
      inScope: true
    };
  } catch (error) {
    console.warn("[ai] chat generation failed — using fallback", {
      recipeId: request.recipe.id,
      error: error instanceof Error ? error.message : "unknown"
    });
    return {
      source: "fallback",
      reply: buildFallbackChatReply(request),
      inScope: true
    };
  }
}
