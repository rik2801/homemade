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
    stepUpdates: z
      .array(
        z.object({
          stepNumber: z.number().int(),
          text: z.string().min(1),
          reason: z.string().optional()
        })
      )
      .optional(),
    benefits: z.array(z.string()).min(1)
  })
});

/**
 * Converts 1-based model stepNumbers to validated 0-based stepIndexes,
 * silently dropping anything out of bounds.
 */
function normalizeStepUpdates(
  updates: Array<{ stepNumber: number; text: string; reason?: string }> | undefined,
  stepCount: number
) {
  if (!updates?.length) return undefined;

  const normalized = updates
    .map((update) => ({
      stepIndex: update.stepNumber - 1,
      text: update.text.trim(),
      ...(update.reason ? { reason: update.reason } : {})
    }))
    .filter((update) => update.stepIndex >= 0 && update.stepIndex < stepCount && update.text);

  return normalized.length > 0 ? normalized : undefined;
}

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
    const { stepUpdates, ...recommendation } = parsed.recommendation;

    console.info("[ai] substitution generated", {
      recipeId: request.recipe.id,
      ingredient: request.ingredientToReplace.name,
      source: "ai"
    });

    return {
      source: "ai",
      original: request.ingredientToReplace,
      userHas: request.userHas.trim(),
      recommendation: {
        ...recommendation,
        stepUpdates: normalizeStepUpdates(stepUpdates, request.recipe.steps.length)
      }
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
