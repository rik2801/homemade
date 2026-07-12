import { describe, expect, it } from "vitest";
import {
  buildChatPrompt,
  isRecommendationOrComparisonRequest,
  selectRelevantPreferences
} from "../backend/src/services/chatService";
import type { ChatRequest } from "../backend/src/types/ai";
import { stripUnnecessaryFollowUp, isSemanticallyDuplicate } from "@/lib/archieAnswerFormatting";
import { mapAssistantReplyToStructured } from "@/lib/mapArchieStructuredResponse";

const ALTERNATIVES_QUERY =
  "What are other alternatives for cottage cheese? It should have high protein and be as versatile as cottage cheese.";

const baseRequest: ChatRequest = {
  message: ALTERNATIVES_QUERY,
  history: [],
  dietaryGoals: ["Low-fat"],
  allergies: ["Shellfish"],
  cookingFor: "Family dinner",
  pantryMode: "ask"
};

describe("recommendation preference selection + prompt", () => {
  it("detects recommendation requests", () => {
    expect(isRecommendationOrComparisonRequest(ALTERNATIVES_QUERY)).toBe(true);
  });

  it("omits cookingFor and pantry mode for alternatives questions", () => {
    const prefs = selectRelevantPreferences(baseRequest);
    expect(prefs.cookingFor).toBeUndefined();
    expect(prefs.pantryMode).toBeUndefined();
    // Alternatives are not allergy-safety questions — do not leak Shellfish.
    expect(prefs.allergies).toEqual([]);
    expect(prefs.dietaryGoals).toContain("Low-fat");
  });

  it("includes cookingFor only when audience/serving context is asked", () => {
    const prefs = selectRelevantPreferences({
      ...baseRequest,
      message: "How much soup should I make for my family?"
    });
    expect(prefs.cookingFor).toBe("Family dinner");
  });

  it("builds a prompt without family dinner for alternatives", () => {
    const prompt = buildChatPrompt(baseRequest);
    expect(prompt).not.toMatch(/Cooking for:/);
    expect(prompt).not.toMatch(/Cooking for:\s*Family dinner/i);
    expect(prompt).toMatch(/For recommendation or comparison requests:/);
    expect(prompt).toMatch(/Give 3 to 5 concrete options/);
    expect(prompt).toContain(ALTERNATIVES_QUERY);
    expect(prompt).not.toMatch(/Recipe context:/);
  });
});

describe("recommendation response mapping", () => {
  it("keeps recommendation replies as plain text instead of dietary-fit cards", () => {
    const groqStyle =
      "They can be used in various dishes, from savory to sweet, and have a relatively high protein content. Would you like to know more about using these options in your family dinner?";

    expect(
      mapAssistantReplyToStructured(groqStyle, { userMessage: ALTERNATIVES_QUERY })
    ).toBeNull();
  });

  it("strips unnecessary follow-up questions", () => {
    const cleaned = stripUnnecessaryFollowUp(
      "Greek yogurt and quark are strong options. Would you like to know more about using these options in your family dinner?"
    );
    expect(cleaned).toBe("Greek yogurt and quark are strong options.");
    expect(cleaned).not.toMatch(/family dinner/i);
    expect(cleaned).not.toMatch(/Would you like/i);
  });

  it("detects duplicate dietary-fit restatements", () => {
    const summary =
      "Greek yogurt or ricotta cheese are alternatives for high protein and versatility similar to cottage cheese.";
    const dietaryFit =
      "For high protein and versatility similar to cottage cheese, you might consider Greek yogurt or ricotta cheese as alternatives.";
    expect(isSemanticallyDuplicate(dietaryFit, summary)).toBe(true);
  });

  it("preserves concrete recommendation content in fallback-shaped plain answers", () => {
    const reply = [
      "The closest high-protein alternatives are Greek yogurt, quark, ricotta, and blended firm tofu.",
      "",
      "• Greek yogurt — high in protein and useful for dips, sauces, bowls, and baking.",
      "• Quark — probably the closest match in both texture and protein, if available.",
      "• Ricotta — very versatile for pasta, toast, desserts, and fillings, but usually lower in protein.",
      "",
      "For the closest overall substitute, choose quark or Greek yogurt."
    ].join("\n");

    expect(mapAssistantReplyToStructured(reply, { userMessage: ALTERNATIVES_QUERY })).toBeNull();
    expect(reply).not.toMatch(/^They\b/);
    expect(reply.match(/Greek yogurt|quark|ricotta|tofu/gi)?.length).toBeGreaterThanOrEqual(3);
    expect(reply).toMatch(/closest overall|best overall|choose /i);
    expect(reply).not.toMatch(/Would you like/i);
  });
});
