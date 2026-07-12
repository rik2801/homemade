import { describe, expect, it } from "vitest";
import { cleanSummary, finalizeStructuredResponse } from "@/lib/archieAnswerFormatting";

describe("archieAnswerFormatting", () => {
  it("does not force a Yes prefix onto summaries", () => {
    expect(cleanSummary("Cottage cheese can be high in sodium.")).toBe(
      "Cottage cheese can be high in sodium."
    );
    expect(cleanSummary("Cottage cheese can be high in sodium.")).not.toMatch(/^Yes\./);
  });

  it("preserves an existing Yes when already in the model text", () => {
    expect(cleanSummary("Yes. That swap works.")).toBe("Yes. That swap works.");
  });

  it("does not invent polarity in finalizeStructuredResponse", () => {
    const result = finalizeStructuredResponse(
      {
        title: "Archie's answer",
        summary: "Cottage cheese is often higher in protein than cream."
      },
      { userMessage: "Cottage cheese is very bad" }
    );
    expect(result.summary).toBe("Cottage cheese is often higher in protein than cream.");
    expect(result.summary).not.toMatch(/^Yes\./i);
  });
});
