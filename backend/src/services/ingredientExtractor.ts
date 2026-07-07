import { getGroqClient, getGroqVisionModel } from "./groqClient";
import type { ImageCategory, ImageClassificationResult, ImageInput } from "./imageClassifier";

export type ExtractedIngredient = {
  name: string;
  amountIfVisible?: string;
  brand?: string;
  confidence: number;
};

type ExtractionRule = {
  pattern: RegExp;
  name: string;
  amountIfVisible?: string;
  brand?: string;
  confidence: number;
};

const INGREDIENT_EXTRACTION_RULES: ExtractionRule[] = [
  { pattern: /cottage[\s_-]?cheese|curd/i, name: "Cottage Cheese", confidence: 0.92 },
  { pattern: /greek[\s_-]?yogurt|yogurt/i, name: "Greek Yogurt", confidence: 0.9 },
  { pattern: /heavy[\s_-]?cream/i, name: "Heavy Cream", confidence: 0.9 },
  { pattern: /olive[\s_-]?oil/i, name: "Olive Oil", brand: "Generic", confidence: 0.88 },
  { pattern: /\bsalt\b/i, name: "Salt", confidence: 0.85 },
  { pattern: /tomato[\s_-]?soup|\bsoup\b/i, name: "Tomato Soup", confidence: 0.86 },
  { pattern: /nutrition|label|facts/i, name: "Packaged Food", confidence: 0.8 },
  { pattern: /knife|kitchen[\s_-]?tool|utensil/i, name: "Kitchen Tool", confidence: 0.87 }
];

function matchExtractionRule(filename: string): ExtractionRule | null {
  for (const rule of INGREDIENT_EXTRACTION_RULES) {
    if (rule.pattern.test(filename)) {
      return rule;
    }
  }
  return null;
}

function extractByCategory(category: ImageCategory): ExtractedIngredient | null {
  switch (category) {
    case "ingredient":
      return { name: "Ingredient", confidence: 0.5 };
    case "prepared_food":
      return { name: "Prepared Dish", confidence: 0.55 };
    case "packaged_food":
      return { name: "Packaged Food Product", confidence: 0.55 };
    case "nutrition_label":
      return { name: "Labeled Food Product", confidence: 0.6 };
    case "recipe":
      return { name: "Recipe", confidence: 0.65 };
    case "kitchen_tool":
      return { name: "Kitchen Tool", confidence: 0.7 };
    case "cooking_process":
      return { name: "Cooking Step", confidence: 0.65 };
    default:
      return null;
  }
}

async function extractWithVisionProvider(
  input: ImageInput,
  classification: ImageClassificationResult
): Promise<ExtractedIngredient | null> {
  const client = getGroqClient();
  if (!client) return null;

  try {
    const completion = await client.chat.completions.create({
      model: getGroqVisionModel(),
      max_tokens: 160,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `This image was classified as "${classification.category}" for a cooking app. Extract the primary food item. Reply with JSON only: {"name":"...", "amountIfVisible":"optional", "brand":"optional", "confidence":0.0-1.0}. If no food item is visible, reply {"name":"","confidence":0}.`
            },
            { type: "image_url", image_url: { url: input.dataUrl } }
          ]
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return null;

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as {
      name?: unknown;
      amountIfVisible?: unknown;
      brand?: unknown;
      confidence?: unknown;
    };

    if (typeof parsed.name !== "string" || !parsed.name.trim()) {
      return null;
    }

    const confidence =
      typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.7;

    return {
      name: parsed.name.trim(),
      amountIfVisible:
        typeof parsed.amountIfVisible === "string" ? parsed.amountIfVisible : undefined,
      brand: typeof parsed.brand === "string" ? parsed.brand : undefined,
      confidence
    };
  } catch {
    return null;
  }
}

function mockExtractIngredient(
  input: ImageInput,
  classification: ImageClassificationResult
): ExtractedIngredient | null {
  const filename = input.filename ?? "";
  if (filename) {
    const matched = matchExtractionRule(filename);
    if (matched) {
      return {
        name: matched.name,
        amountIfVisible: matched.amountIfVisible,
        brand: matched.brand,
        confidence: matched.confidence
      };
    }
  }

  return extractByCategory(classification.category);
}

/**
 * Extracts food/ingredient details from a validated cooking image.
 * Vision providers should be swapped in here without changing downstream code.
 */
export async function extractIngredient(
  input: ImageInput,
  classification: ImageClassificationResult
): Promise<ExtractedIngredient | null> {
  const visionResult = await extractWithVisionProvider(input, classification);
  if (visionResult) {
    return visionResult;
  }

  return mockExtractIngredient(input, classification);
}
