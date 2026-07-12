import { describe, expect, it } from "vitest";
import {
  resolveExplicitArchieRecipeId,
  serializeArchieChatRecipe
} from "@/lib/archieChatContext";
import { chickenCurryRecipe } from "@/features/recipe/data/homemadeRecipe";

/** Mirrors sendArchieChat payload construction for attach / clear behavior. */
function buildChatPayload(options: {
  message: string;
  composerActiveRecipeId: string | null;
  activeSessionId: string | null;
  archieSessions: Parameters<typeof resolveExplicitArchieRecipeId>[0]["archieSessions"];
  getRecipeById: (id: string) => typeof chickenCurryRecipe | null;
}) {
  const explicitRecipeId = resolveExplicitArchieRecipeId({
    composerActiveRecipeId: options.composerActiveRecipeId,
    activeSessionId: options.activeSessionId,
    archieSessions: options.archieSessions
  });
  const attachedRecipe = explicitRecipeId ? options.getRecipeById(explicitRecipeId) : null;

  return {
    message: options.message,
    ...(attachedRecipe
      ? {
          recipe: serializeArchieChatRecipe(attachedRecipe),
          recipeExplicitlyAttached: true as const
        }
      : {})
  };
}

describe("Archie chat payload attach + clear", () => {
  it("omits recipe when nothing is explicitly attached", () => {
    const payload = buildChatPayload({
      message: "Can I replace coconut milk?",
      composerActiveRecipeId: null,
      activeSessionId: "s1",
      archieSessions: [{ id: "s1", kind: "general" }],
      getRecipeById: (id) => (id === "chicken-curry" ? chickenCurryRecipe : null)
    });

    expect(payload.recipe).toBeUndefined();
    expect(payload.recipeExplicitlyAttached).toBeUndefined();
  });

  it("includes Chicken Curry when explicitly attached", () => {
    const payload = buildChatPayload({
      message: "Can I replace coconut milk?",
      composerActiveRecipeId: "chicken-curry",
      activeSessionId: "s1",
      archieSessions: [
        {
          id: "s1",
          kind: "general",
          recipeId: "chicken-curry",
          recipeContextSource: "explicit_attach"
        }
      ],
      getRecipeById: (id) => (id === "chicken-curry" ? chickenCurryRecipe : null)
    });

    expect(payload.recipeExplicitlyAttached).toBe(true);
    expect(payload.recipe?.id).toBe("chicken-curry");
    expect(payload.recipe?.title).toBe(chickenCurryRecipe.title);
  });

  it("omits recipe after clearArchieRecipeContext-equivalent state", () => {
    const payload = buildChatPayload({
      message: "Can I replace coconut milk?",
      composerActiveRecipeId: null,
      activeSessionId: "s1",
      archieSessions: [
        {
          id: "s1",
          kind: "general",
          recipeId: undefined,
          recipeContextSource: undefined
        }
      ],
      getRecipeById: (id) => (id === "chicken-curry" ? chickenCurryRecipe : null)
    });

    expect(payload.recipe).toBeUndefined();
  });
});
