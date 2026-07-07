import { Router } from "express";
import { z } from "zod";
import { generateSubstitution } from "../services/aiService";
import { generateChatReply } from "../services/chatService";
import { generateSubstituteSuggestions } from "../services/substituteSuggestService";

const recipeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  ingredients: z.array(
    z.object({
      id: z.string().optional(),
      amount: z.string().min(1),
      label: z.string().min(1)
    })
  ),
  steps: z.array(z.string())
});

const substituteRequestSchema = z.object({
  recipe: recipeSchema,
  ingredientToReplace: z.object({
    name: z.string().min(1),
    amount: z.string().min(1)
  }),
  userHas: z.string().min(1),
  dietaryGoals: z.array(z.string()),
  allergies: z.array(z.string()),
  cookingFor: z.string().min(1),
  pantryMode: z.enum(["ask", "remember"]),
  exclude: z.array(z.string()).optional()
});

const suggestSubstitutesRequestSchema = z.object({
  recipe: recipeSchema,
  ingredientToReplace: z.object({
    name: z.string().min(1),
    amount: z.string().min(1)
  }),
  dietaryGoals: z.array(z.string()),
  allergies: z.array(z.string()),
  cookingFor: z.string().min(1)
});

const chatRequestSchema = z.object({
  message: z.string().min(1),
  imageDataUrl: z.string().startsWith("data:image/").optional(),
  imageFilename: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string()
      })
    )
    .default([]),
  recipe: recipeSchema,
  dietaryGoals: z.array(z.string()),
  allergies: z.array(z.string()),
  cookingFor: z.string().min(1),
  pantryMode: z.enum(["ask", "remember"]).optional()
});

export const aiRouter = Router();

aiRouter.post("/chat", async (req, res) => {
  const parsed = chatRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: parsed.error.flatten()
    });
  }

  const request = parsed.data;

  console.info("[api] chat request", {
    recipeId: request.recipe.id,
    messageLength: request.message.length
  });

  const response = await generateChatReply(request);
  return res.json(response);
});

aiRouter.post("/substitute", async (req, res) => {
  const parsed = substituteRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: parsed.error.flatten()
    });
  }

  const request = parsed.data;

  console.info("[api] substitute request", {
    recipeId: request.recipe.id,
    ingredient: request.ingredientToReplace.name,
    userHasLength: request.userHas.length,
    goalCount: request.dietaryGoals.length,
    allergyCount: request.allergies.length
  });

  const response = await generateSubstitution(request);
  return res.json(response);
});

aiRouter.post("/suggest-substitutes", async (req, res) => {
  const parsed = suggestSubstitutesRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: parsed.error.flatten()
    });
  }

  const request = parsed.data;

  console.info("[api] suggest-substitutes request", {
    recipeId: request.recipe.id,
    ingredient: request.ingredientToReplace.name
  });

  const response = await generateSubstituteSuggestions(request);
  return res.json(response);
});
