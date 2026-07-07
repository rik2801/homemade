import { z } from "zod";
import type { SuggestSubstitutesRequest, SuggestSubstitutesResponse } from "../types/ai";
import { buildSuggestSubstitutesPrompt } from "./promptBuilder";
import { CULINARY_SYSTEM_PROMPT, getGroqClient, getGroqModel } from "./groqClient";

const suggestionsSchema = z.object({
  suggestions: z
    .array(
      z.object({
        label: z.string().min(1),
        shortReason: z.string().min(1)
      })
    )
    .min(1)
});

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(candidate);
}

function buildFallbackSuggestions(
  request: SuggestSubstitutesRequest
): SuggestSubstitutesResponse {
  const name = request.ingredientToReplace.name.toLowerCase();

  let suggestions: Array<{ label: string; shortReason: string }>;
  if (name.includes("cream")) {
    suggestions = [
      { label: "Greek yogurt", shortReason: "creamy, lower fat" },
      { label: "Milk", shortReason: "lighter, pantry-simple" },
      { label: "Coconut milk", shortReason: "dairy-free richness" }
    ];
  } else if (name.includes("milk") || name.includes("yogurt") || name.includes("butter")) {
    suggestions = [
      { label: "Oat milk", shortReason: "neutral, dairy-free" },
      { label: "Coconut milk", shortReason: "rich, dairy-free" },
      { label: "Greek yogurt", shortReason: "adds body" }
    ];
  } else if (
    name.includes("onion") ||
    name.includes("garlic") ||
    name.includes("shallot") ||
    name.includes("leek")
  ) {
    suggestions = [
      { label: "Shallots", shortReason: "milder, similar role" },
      { label: "Spring onions", shortReason: "fresh, use as garnish" },
      { label: "Leeks", shortReason: "gentle allium flavor" }
    ];
  } else if (name.includes("cheese") || name.includes("parmesan")) {
    suggestions = [
      { label: "Nutritional yeast", shortReason: "savory, dairy-free" },
      { label: "Pecorino", shortReason: "similar salty bite" },
      { label: "Aged cheddar", shortReason: "melts, widely available" }
    ];
  } else if (name.includes("broth") || name.includes("stock")) {
    suggestions = [
      { label: "Bouillon + water", shortReason: "pantry equivalent" },
      { label: "Mushroom broth", shortReason: "deep savory flavor" },
      { label: "Water + soy sauce", shortReason: "quick umami fix" }
    ];
  } else if (name.includes("oil")) {
    suggestions = [
      { label: "Butter", shortReason: "similar fat role" },
      { label: "Avocado oil", shortReason: "neutral, high heat" },
      { label: "Coconut oil", shortReason: "plant-based option" }
    ];
  } else {
    suggestions = [
      { label: "A similar ingredient", shortReason: "matches the role" },
      { label: "A pantry staple", shortReason: "keeps it simple" },
      { label: "Skip it", shortReason: "often works fine" }
    ];
  }

  return { source: "fallback", suggestions };
}

export async function generateSubstituteSuggestions(
  request: SuggestSubstitutesRequest
): Promise<SuggestSubstitutesResponse> {
  const client = getGroqClient();

  if (!client) {
    console.warn("[ai] GROQ_API_KEY missing — using fallback suggestions", {
      recipeId: request.recipe.id,
      ingredient: request.ingredientToReplace.name
    });
    return buildFallbackSuggestions(request);
  }

  const prompt = buildSuggestSubstitutesPrompt(request);

  try {
    const completion = await client.chat.completions.create({
      model: getGroqModel(),
      max_tokens: 512,
      temperature: 0.3,
      messages: [
        { role: "system", content: `${CULINARY_SYSTEM_PROMPT} Return strict JSON only.` },
        { role: "user", content: prompt }
      ]
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      throw new Error("No text response from model");
    }

    const parsed = suggestionsSchema.parse(extractJson(text));

    console.info("[ai] substitute suggestions generated", {
      recipeId: request.recipe.id,
      ingredient: request.ingredientToReplace.name,
      count: parsed.suggestions.length
    });

    return { source: "ai", suggestions: parsed.suggestions.slice(0, 4) };
  } catch (error) {
    console.warn("[ai] suggestion generation failed — using fallback", {
      recipeId: request.recipe.id,
      ingredient: request.ingredientToReplace.name,
      error: error instanceof Error ? error.message : "unknown"
    });
    return buildFallbackSuggestions(request);
  }
}
