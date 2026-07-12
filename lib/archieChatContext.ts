import type { ArchieChatSession, Recipe } from "@/types/recipe";

export type ArchieRecipeContextSource = "explicit_attach" | "recipe_entry";

export type ArchieRecipeResolveState = {
  composerActiveRecipeId: string | null;
  activeSessionId: string | null;
  archieSessions: Array<
    Pick<ArchieChatSession, "id" | "kind" | "recipeId"> & {
      recipeContextSource?: ArchieRecipeContextSource;
    }
  >;
};

/**
 * Recipe is included only when attachment provenance is explicit and visible
 * in the current Archie conversation — never from global browse state.
 */
export function resolveExplicitArchieRecipeId(
  state: ArchieRecipeResolveState
): string | undefined {
  if (state.composerActiveRecipeId) {
    return state.composerActiveRecipeId;
  }

  const session = state.archieSessions.find((item) => item.id === state.activeSessionId);
  if (!session?.recipeId) return undefined;

  if (session.kind === "recipe_swap") {
    return session.recipeId;
  }

  if (
    session.recipeContextSource === "explicit_attach" ||
    session.recipeContextSource === "recipe_entry"
  ) {
    return session.recipeId;
  }

  return undefined;
}

export function serializeArchieChatRecipe(recipe: Recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    ingredients: recipe.ingredients.map((item) => ({
      id: item.id,
      amount: item.amount,
      label: item.label
    })),
    steps: recipe.steps
  };
}
