export type UserProfileContext = {
  cookingFor: string;
  dietaryGoals: string[];
  allergies: string[];
  recipeTitle: string;
};

export type ChatHistoryTurn = {
  role: "user" | "assistant";
  content: string;
};

const IN_SCOPE_PATTERNS = [
  /\b(recipe|ingredient|swap|substitut|replace|cook|cooking|bake|simmer|saut[eé]|boil|roast|grill|fry|stir|mix|whisk|blend|serve|serving|portion|meal|dish|food|pantry|kitchen)\b/i,
  /\b(nutrition|nutrient|protein|carb|sodium|salt|fat|dairy|gluten|calorie|fiber|fibre|vitamin|mineral|macro|healthy|heart.?healthy|low.?fat|low.?sodium|diabetes|vegetarian|vegan)\b/i,
  /\b(allerg|dietary|diet|intoleranc|restriction)\b/i,
  /\b(soup|sauce|broth|stock|cream|milk|yogurt|cheese|tomato|onion|garlic|spice|herb|oil|butter|flour|pasta|rice|chicken|fish|tofu|bean|lentil|curry)\b/i,
  /\b(what can i use|what do i have|what i have|lower|reduce|make this|help with|swap an?|lean protein|dairy.?free|use what)\b/i,
  /\b(avoid|why should|why avoid|should i avoid|bacon|sausage|pork|red meat|processed meat)\b/i,
  /\b(what are|tell me about|explain|help me understand|based on my)\b/i,
  /\b(can i eat|can i have|is it ok|is it okay|should i eat|what about|how about|is .+ safe|safe to eat|safe for me)\b/i,
  /\b(crab|shrimp|lobster|shellfish|prawn|scallop|mussel|clam|oyster|salmon|tuna|cod|tilapia|beef|turkey|ham|peanut|tree nut|almond|wheat|soy|sesame)\b/i
];

const OUT_OF_SCOPE_PATTERNS = [
  /\b(weather|forecast|temperature outside|rain today)\b/i,
  /\b(stock market|bitcoin|crypto|invest|politic|election|president|war)\b/i,
  /\b(write (me )?(a )?(code|essay|poem|story|email|letter|song))\b/i,
  /\b(javascript|python|typescript|programming|debug|sql|html|css)\b/i,
  /\b(joke|fun fact|trivia|who is|when was|capital of|math problem|solve for x|homework)\b/i,
  /\b(medical diagnosis|prescribe|dosage|symptom|diagnose|am i sick|should i see a doctor)\b/i,
  /\b(relationship advice|legal advice|financial advice|tax advice)\b/i
];

function threadWasRecipeNutrition(history: ChatHistoryTurn[]) {
  const recentContext = history
    .slice(-6)
    .map((turn) => turn.content)
    .join(" ");

  return IN_SCOPE_PATTERNS.some((pattern) => pattern.test(recentContext));
}

function isNutritionFollowUp(message: string, history: ChatHistoryTurn[]) {
  if (history.length === 0) return false;

  const normalized = message.trim();
  const shortFollowUp =
    normalized.length <= 140 &&
    /\b(can i|should i|what about|how about|is it|i like|i love|i eat|avoid|safe|ok|okay|allowed)\b/i.test(
      normalized
    );

  return threadWasRecipeNutrition(history) && shortFollowUp;
}

export function isRecipeNutritionInScope(message: string, history: ChatHistoryTurn[] = []) {
  const normalized = message.trim();
  if (normalized.length < 2) return false;

  const clearlyOutOfScope = OUT_OF_SCOPE_PATTERNS.some((pattern) => pattern.test(normalized));
  const clearlyInScope = IN_SCOPE_PATTERNS.some((pattern) => pattern.test(normalized));

  if (isNutritionFollowUp(normalized, history)) {
    return true;
  }

  if (clearlyOutOfScope && !clearlyInScope) {
    return false;
  }

  return clearlyInScope;
}

export function buildScopedDeclineReply(profile: UserProfileContext): string {
  const goals =
    profile.dietaryGoals.length > 0
      ? profile.dietaryGoals.join(" and ").toLowerCase()
      : "your dietary preferences";
  const allergyNote =
    profile.allergies.length > 0
      ? ` I'll keep ${profile.allergies.join(", ").toLowerCase()} in mind for anything we discuss.`
      : "";

  return `I'm Archie — I can only help with recipes and nutrition, like ingredient swaps, ${goals}, and meals for ${profile.cookingFor.toLowerCase()}.${allergyNote} I can't help with that request, but ask me about ${profile.recipeTitle} or what you're cooking and I'll gladly assist.`;
}
