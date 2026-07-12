import { describe, expect, it } from "vitest";
import { inferArchieIntentResult, messageNeedsRecipeContext } from "@/lib/inferArchieIntent";

const ALTERNATIVES_QUERY =
  "What are other alternatives for cottage cheese? Like it should have high protein and be as versatile as cottage cheese itself.";

describe("ingredient_recommendation intent", () => {
  it("classifies cottage cheese alternatives as ingredient_recommendation", () => {
    const result = inferArchieIntentResult({ text: ALTERNATIVES_QUERY });
    expect(result.type).toBe("ingredient_recommendation");
    if (result.type === "ingredient_recommendation") {
      expect(result.subject).toBe("cottage cheese");
      expect(result.constraints).toEqual(expect.arrayContaining(["high protein", "versatile"]));
    }
  });

  it.each([
    "What is the best high-protein substitute for ricotta?",
    "Compare Greek yogurt and cottage cheese for baking.",
    "What can replace cottage cheese in savory dishes?"
  ])("classifies %j as ingredient_recommendation", (text) => {
    expect(inferArchieIntentResult({ text }).type).toBe("ingredient_recommendation");
  });

  it("does not send alternatives into clarification or recipe-required paths", () => {
    expect(inferArchieIntentResult({ text: ALTERNATIVES_QUERY }).type).not.toBe("unclear");
    expect(messageNeedsRecipeContext(ALTERNATIVES_QUERY)).toBe(false);
  });
});
