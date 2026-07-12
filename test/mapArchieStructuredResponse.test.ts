import { describe, expect, it } from "vitest";
import {
  mapAssistantReplyToStructured,
  structuredResponseToHistoryText
} from "@/lib/mapArchieStructuredResponse";

describe("mapArchieStructuredResponse", () => {
  it("does not fabricate cottage cheese sections from thin replies", () => {
    const structured = mapAssistantReplyToStructured(
      "Cottage cheese is higher in protein than heavy cream.",
      {
        userMessage: "Cottage cheese is very bad",
        recipeTitle: "Chicken Curry"
      }
    );

    expect(structured).not.toBeNull();
    expect(structured?.summary).toContain("Cottage cheese");
    expect(structured?.howToUse).toBeUndefined();
    expect(structured?.dietaryFit).toBeUndefined();
    expect(structured?.watchOut).toBeUndefined();
    expect(JSON.stringify(structured)).not.toMatch(/Chicken Curry/i);
  });

  it("does not map clarification-style replies into structured cards", () => {
    expect(
      mapAssistantReplyToStructured(
        "You think cottage cheese is a good option. What are you planning to use it for in your family dinner?",
        { userMessage: "Cottage cheese good?" }
      )
    ).toBeNull();

    expect(
      mapAssistantReplyToStructured(
        "Are you asking whether cottage cheese is healthy, or how to use it in a recipe?",
        { userMessage: "Cottage cheese" }
      )
    ).toBeNull();
  });

  it("keeps sections only when present in the model reply", () => {
    const structured = mapAssistantReplyToStructured(
      "Cottage cheese works as a lighter swap. Blend it smooth before stirring in. It supports low-fat goals. Watch the sodium, though.",
      { userMessage: "Can I use cottage cheese instead of cream?" }
    );

    expect(structured?.howToUse).toBeTruthy();
    expect(structured?.dietaryFit).toBeTruthy();
    expect(structured?.watchOut).toBeTruthy();
  });

  it("joins present sections into history text", () => {
    const text = structuredResponseToHistoryText({
      title: "Archie's answer",
      summary: "Summary line.",
      howToUse: "How to use line.",
      watchOut: "Watch out line."
    });
    expect(text).toBe("Summary line.\n\nHow to use line.\n\nWatch out line.");
  });
});
