import { describe, expect, it } from "vitest";
import { inferArchieIntentResult } from "@/lib/inferArchieIntent";

describe("inferArchieIntentResult", () => {
  it("clarifies bare opinion statements without a recipe", () => {
    const result = inferArchieIntentResult({
      text: "Cottage cheese is very bad",
      hasAttachedRecipe: false
    });
    expect(result.type).toBe("unclear");
    if (result.type === "unclear") {
      expect(result.clarification.toLowerCase()).toContain("cottage cheese");
      expect(result.clarification).not.toMatch(/chicken curry/i);
      expect(result.clarification).not.toMatch(/^you think/i);
      expect(result.clarification).toMatch(/\?$/);
    }
  });

  it("clarifies bare ingredient names", () => {
    const result = inferArchieIntentResult({
      text: "Cottage cheese",
      hasAttachedRecipe: false
    });
    expect(result.type).toBe("unclear");
    if (result.type === "unclear") {
      expect(result.clarification).not.toMatch(/^you think/i);
      expect(result.clarification).toMatch(/\?$/);
    }
  });

  it.each([
    "Cottage cheese good?",
    "Is cottage cheese good?",
    "Cottage cheese healthy?",
    "Is this healthy?",
    "Eggs bad?",
    "Is tofu good for protein?",
    "Can I eat cottage cheese?",
    "Is cottage cheese high in sodium?"
  ])("treats nutrition question %j as general", (text) => {
    expect(inferArchieIntentResult({ text, hasAttachedRecipe: false }).type).toBe("general");
  });

  it("treats clear substitution questions as substitution", () => {
    expect(
      inferArchieIntentResult({
        text: "Can I replace coconut milk?",
        hasAttachedRecipe: true
      }).type
    ).toBe("substitution");
  });

  it("treats dairy-free requests as dietary_adjustment", () => {
    expect(
      inferArchieIntentResult({
        text: "Make this dairy-free",
        hasAttachedRecipe: true
      }).type
    ).toBe("dietary_adjustment");
  });

  it("grounds vague pronouns with recent same-session history", () => {
    const result = inferArchieIntentResult({
      text: "Can I use this?",
      hasAttachedRecipe: false,
      previousUserMessage: "What about cottage cheese?",
      previousAssistantMessage: "Cottage cheese can work in some dishes."
    });
    expect(result.type).toBe("substitution");
  });

  it("asks for clarification on ungrounded pronouns", () => {
    const result = inferArchieIntentResult({
      text: "Can I use this?",
      hasAttachedRecipe: false
    });
    expect(result.type).toBe("unclear");
    if (result.type === "unclear") {
      expect(result.clarification).toBe("What ingredient or recipe are you referring to?");
    }
  });
});
