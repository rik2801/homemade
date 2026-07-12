import { describe, expect, it } from "vitest";
import {
  buildChatPrompt,
  inferPromptIntent,
  selectRelevantUserContext
} from "../backend/src/services/chatService";
import { mapAssistantReplyToStructured } from "@/lib/mapArchieStructuredResponse";
import { removeOverlappingSections } from "@/lib/archieAnswerFormatting";

const preferences = {
  allergies: ["Shellfish"],
  dietaryGoals: ["Low-fat", "Low-sodium"],
  cookingFor: "Family dinner",
  pantryMode: "ask" as const
};

describe("dietary personalization", () => {
  it("selects dietary goals for nutrition questions without allergies", () => {
    const context = selectRelevantUserContext(
      "Is cottage cheese good?",
      { type: "nutrition_question" },
      preferences
    );

    expect(context.dietaryGoals).toEqual(["Low-fat", "Low-sodium"]);
    expect(context.allergies).toBeUndefined();
    expect(context.cookingFor).toBeUndefined();
    expect(context.pantryMode).toBeUndefined();
  });

  it("selects allergies for allergy safety questions", () => {
    const context = selectRelevantUserContext(
      "Is cottage cheese safe for my shellfish allergy?",
      { type: "allergy_question" },
      preferences
    );
    expect(context.allergies).toEqual(["Shellfish"]);
  });

  it("returns empty context for unrelated cooking questions", () => {
    expect(inferPromptIntent("How do I stop pasta from sticking?").type).toBe("cooking_question");
    expect(
      selectRelevantUserContext(
        "How do I stop pasta from sticking?",
        { type: "cooking_question" },
        preferences
      )
    ).toEqual({});
  });

  it("prompt personalizes nutrition answers without shellfish or vague-only framing", () => {
    const prompt = buildChatPrompt({
      message: "Cottage cheese good?",
      history: [],
      dietaryGoals: ["Low-fat", "Low-sodium"],
      allergies: ["Shellfish"],
      cookingFor: "Family dinner",
      pantryMode: "ask"
    });

    expect(prompt).toContain("Low-fat");
    expect(prompt).toContain("Low-sodium");
    expect(prompt).not.toContain("Shellfish");
    expect(prompt).not.toContain("Family dinner");
    expect(prompt).toMatch(/Relevant user preferences:/);
    expect(prompt).toMatch(/When relevant dietary preferences are provided/);
    expect(prompt).toMatch(/probiotics|live cultures/i);
  });

  it("maps personalized nutrition replies into preferenceFit without duplicating summary", () => {
    const reply =
      "Cottage cheese can be a good high-protein option and can fit your diet. For your low-fat goal, choose low-fat or fat-free cottage cheese. For your low-sodium preference, compare brands because sodium levels vary significantly.";

    const structured = mapAssistantReplyToStructured(reply, {
      userMessage: "Cottage cheese good?",
      dietaryGoals: ["Low-fat", "Low-sodium"]
    });

    expect(structured).not.toBeNull();
    expect(structured?.summary.toLowerCase()).toMatch(/good|fit|protein/);
    expect(structured?.preferenceFit?.toLowerCase()).toMatch(/low-fat|low-sodium|for your/);
    expect(structured?.howToUse).toBeUndefined();
    expect(JSON.stringify(structured)).not.toMatch(/shellfish/i);
    expect(JSON.stringify(structured)).not.toMatch(/some diets/i);
    expect(JSON.stringify(structured)).not.toMatch(/probiotics/i);

    if (structured?.preferenceFit) {
      expect(structured.preferenceFit).not.toBe(structured.summary);
    }
  });

  it("removes overlapping sections that restate the summary", () => {
    const summary = "Cottage cheese can be a good high-protein option for your diet.";
    const sections = removeOverlappingSections(summary, [
      {
        key: "preferenceFit",
        label: "For your goals",
        value: "Cottage cheese can be a good high-protein option for your diet."
      },
      {
        key: "watchOut",
        label: "Watch out",
        value: "Compare sodium between brands."
      }
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0].key).toBe("watchOut");
  });
});
