import { describe, expect, it } from "vitest";
import {
  buildChatPrompt,
  withExplicitRecipeOnly
} from "../backend/src/services/chatService";
import type { ChatRequest } from "../backend/src/types/ai";

const baseRequest: ChatRequest = {
  message: "Cottage cheese is very bad",
  history: [],
  dietaryGoals: ["Low-fat"],
  allergies: [],
  cookingFor: "myself"
};

describe("buildChatPrompt", () => {
  it("omits recipe context when no recipe is attached", () => {
    const prompt = buildChatPrompt(baseRequest);
    expect(prompt).not.toMatch(/Recipe context:/);
    expect(prompt).toMatch(/Latest user message:/);
    expect(prompt).not.toMatch(/Latest user question:/);
    expect(prompt).toContain("Cottage cheese is very bad");
  });

  it("does not dump cookingFor into every prompt", () => {
    const prompt = buildChatPrompt({
      ...baseRequest,
      cookingFor: "Family dinner",
      message: "Is tofu high in protein?"
    });
    expect(prompt).not.toMatch(/Family dinner/);
    expect(prompt).not.toMatch(/Cooking for:/);
  });

  it("includes recipe context when explicitly attached", () => {
    const prompt = buildChatPrompt({
      ...baseRequest,
      message: "Can I replace coconut milk?",
      recipeExplicitlyAttached: true,
      recipe: {
        id: "chicken-curry",
        title: "Chicken Curry",
        ingredients: [{ label: "light coconut milk", amount: "1 cup" }],
        steps: ["Simmer."]
      }
    });
    expect(prompt).toMatch(/Recipe context: Chicken Curry/);
    expect(prompt).toMatch(/light coconut milk/);
  });
});

describe("withExplicitRecipeOnly", () => {
  it("strips recipe unless recipeExplicitlyAttached is true", () => {
    const stripped = withExplicitRecipeOnly({
      ...baseRequest,
      recipe: {
        id: "chicken-curry",
        title: "Chicken Curry",
        ingredients: [],
        steps: []
      }
    });
    expect(stripped.recipe).toBeUndefined();

    const kept = withExplicitRecipeOnly({
      ...baseRequest,
      recipeExplicitlyAttached: true,
      recipe: {
        id: "chicken-curry",
        title: "Chicken Curry",
        ingredients: [],
        steps: []
      }
    });
    expect(kept.recipe?.id).toBe("chicken-curry");
  });
});
