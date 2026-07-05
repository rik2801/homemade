import { z } from "zod";
import type { SubstituteRequest, SubstituteResponse } from "../types/ai";
import { buildFallbackResponse } from "./fallbackService";
import { buildSubstitutePrompt } from "./promptBuilder";
import { CULINARY_SYSTEM_PROMPT, getGroqClient, getGroqModel } from "./groqClient";

const recommendationSchema = z.object({
  recommendation: z.object({
    name: z.string().min(1),
    amount: z.string().min(1),
    whyThisWorks: z.string().min(1),
    dietaryFit: z.string().min(1),
    recipeImpact: z.string().min(1),
    confidence: z.enum(["High", "Medium", "Low"]),
    updatedStep: z.string().optional(),
    benefits: z.array(z.string()).min(1)
  })
});

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(candidate);
}

export async function generateSubstitution(request: SubstituteRequest): Promise<SubstituteResponse> {
  const client = getGroqClient();

  if (!client) {
    console.warn("[ai] GROQ_API_KEY missing — using fallback", {
      recipeId: request.recipe.id,
      ingredient: request.ingredientToReplace.name
    });
    return buildFallbackResponse(request);
  }

  const prompt = buildSubstitutePrompt(request);

  try {
    const completion = await client.chat.completions.create({
      model: getGroqModel(),
      max_tokens: 1024,
      temperature: 0.2,
      messages: [
        { role: "system", content: `${CULINARY_SYSTEM_PROMPT} Return strict JSON only.` },
        { role: "user", content: prompt }
      ]
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      throw new Error("No text response from model");
    }

    const parsed = recommendationSchema.parse(extractJson(text));

    console.info("[ai] substitution generated", {
      recipeId: request.recipe.id,
      ingredient: request.ingredientToReplace.name,
      source: "ai"
    });

    return {
      source: "ai",
      original: request.ingredientToReplace,
      userHas: request.userHas.trim(),
      recommendation: parsed.recommendation
    };
  } catch (error) {
    console.warn("[ai] generation failed — using fallback", {
      recipeId: request.recipe.id,
      ingredient: request.ingredientToReplace.name,
      error: error instanceof Error ? error.message : "unknown"
    });
    return buildFallbackResponse(request);
  }
}
