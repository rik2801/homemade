import { describe, expect, it } from "vitest";
import {
  resolveExplicitArchieRecipeId,
  serializeArchieChatRecipe
} from "@/lib/archieChatContext";
import { chickenCurryRecipe } from "@/features/recipe/data/homemadeRecipe";

describe("resolveExplicitArchieRecipeId", () => {
  it("does not use the globally viewed recipe as Archie context", () => {
    expect(
      resolveExplicitArchieRecipeId({
        composerActiveRecipeId: null,
        activeSessionId: "s1",
        archieSessions: [{ id: "s1", kind: "general", recipeId: undefined }]
      })
    ).toBeUndefined();
  });

  it("does not trust recipeId on an unscoped general session", () => {
    expect(
      resolveExplicitArchieRecipeId({
        composerActiveRecipeId: null,
        activeSessionId: "s1",
        archieSessions: [
          {
            id: "s1",
            kind: "general",
            recipeId: "chicken-curry",
            recipeContextSource: undefined
          }
        ]
      })
    ).toBeUndefined();
  });

  it("uses composerActiveRecipeId when set", () => {
    expect(
      resolveExplicitArchieRecipeId({
        composerActiveRecipeId: "chicken-curry",
        activeSessionId: "s1",
        archieSessions: [{ id: "s1", kind: "general" }]
      })
    ).toBe("chicken-curry");
  });

  it("uses recipe_swap session recipeId", () => {
    expect(
      resolveExplicitArchieRecipeId({
        composerActiveRecipeId: null,
        activeSessionId: "s1",
        archieSessions: [
          {
            id: "s1",
            kind: "recipe_swap",
            recipeId: "chicken-curry"
          }
        ]
      })
    ).toBe("chicken-curry");
  });

  it("uses explicit_attach provenance on a general session", () => {
    expect(
      resolveExplicitArchieRecipeId({
        composerActiveRecipeId: null,
        activeSessionId: "s1",
        archieSessions: [
          {
            id: "s1",
            kind: "general",
            recipeId: "chicken-curry",
            recipeContextSource: "explicit_attach"
          }
        ]
      })
    ).toBe("chicken-curry");
  });
});

describe("serializeArchieChatRecipe", () => {
  it("serializes only chat-relevant recipe fields", () => {
    const payload = serializeArchieChatRecipe(chickenCurryRecipe);
    expect(payload.id).toBe("chicken-curry");
    expect(payload.title).toBe(chickenCurryRecipe.title);
    expect(payload.ingredients.length).toBeGreaterThan(0);
    expect(payload.steps.length).toBeGreaterThan(0);
  });
});
