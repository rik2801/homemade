import { describe, expect, it } from "vitest";
import {
  buildChatPrompt,
  selectRelevantPreferences,
  selectRelevantUserContext
} from "../backend/src/services/chatService";
import type { ChatRequest } from "../backend/src/types/ai";

const preferences = {
  allergies: ["Shellfish"],
  dietaryGoals: ["Low-fat", "Low-sodium"],
  cookingFor: "Family dinner",
  pantryMode: "ask" as const
};

describe("selectRelevantUserContext", () => {
  it("omits allergies and cookingFor for Is cottage cheese good?", () => {
    const context = selectRelevantUserContext(
      "Is cottage cheese good?",
      { type: "nutrition_question" },
      preferences
    );

    expect(context.allergies).toBeUndefined();
    expect(context.cookingFor).toBeUndefined();
    expect(context.pantryMode).toBeUndefined();
    expect(context.dietaryGoals).toEqual(["Low-fat", "Low-sodium"]);
  });

  it("includes allergies for explicit shellfish safety questions", () => {
    const context = selectRelevantUserContext(
      "Is cottage cheese safe with my shellfish allergy?",
      { type: "allergy_question" },
      preferences
    );

    expect(context.allergies).toEqual(["Shellfish"]);
  });

  it("does not treat bare food nouns as allergy-relevant", () => {
    const prefs = selectRelevantPreferences({
      message: "What are alternatives to cottage cheese?",
      history: [],
      dietaryGoals: preferences.dietaryGoals,
      allergies: preferences.allergies,
      cookingFor: preferences.cookingFor,
      pantryMode: preferences.pantryMode
    });

    expect(prefs.allergies).toEqual([]);
    expect(prefs.cookingFor).toBeUndefined();
  });
});

describe("buildChatPrompt preference leakage", () => {
  const base: ChatRequest = {
    message: "Is cottage cheese good?",
    history: [],
    dietaryGoals: ["Low-fat", "Low-sodium"],
    allergies: ["Shellfish"],
    cookingFor: "Family dinner",
    pantryMode: "ask"
  };

  it("does not inject Shellfish or Family dinner for nutrition shorthand", () => {
    const prompt = buildChatPrompt(base);
    expect(prompt).not.toContain("Shellfish");
    expect(prompt).not.toContain("Family dinner");
    expect(prompt).not.toMatch(/Cooking for:/);
    expect(prompt).toContain("Is cottage cheese good?");
    expect(prompt).toMatch(/Answer the user's explicit question first/);
    expect(prompt).toMatch(/Relevant user preferences:/);
    expect(prompt).toContain("Low-fat");
    expect(prompt).toMatch(/For your low-fat goal/);
  });

  it("includes allergy context when the user asks about allergy safety", () => {
    const prompt = buildChatPrompt({
      ...base,
      message: "Is cottage cheese safe with my shellfish allergy?"
    });
    expect(prompt).toContain("Shellfish");
    expect(prompt).not.toContain("Family dinner");
  });

  it("omits dietary goals for unrelated cooking technique questions", () => {
    const context = selectRelevantUserContext(
      "How do I stop pasta from sticking?",
      { type: "cooking_question" },
      preferences
    );
    expect(context).toEqual({});
  });
});
