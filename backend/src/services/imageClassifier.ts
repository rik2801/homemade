import { getGroqClient, getGroqVisionModel } from "./groqClient";

export type ImageCategory =
  | "ingredient"
  | "prepared_food"
  | "packaged_food"
  | "nutrition_label"
  | "recipe"
  | "kitchen_tool"
  | "cooking_process"
  | "person"
  | "animal"
  | "document"
  | "electronics"
  | "vehicle"
  | "landscape"
  | "unknown";

export type ImageClassificationResult = {
  category: ImageCategory;
  confidence: number;
};

export type ImageInput = {
  dataUrl: string;
  filename?: string;
};

type MockRule = {
  pattern: RegExp;
  category: ImageCategory;
  confidence: number;
};

const IMAGE_CATEGORIES: ImageCategory[] = [
  "ingredient",
  "prepared_food",
  "packaged_food",
  "nutrition_label",
  "recipe",
  "kitchen_tool",
  "cooking_process",
  "person",
  "animal",
  "document",
  "electronics",
  "vehicle",
  "landscape",
  "unknown"
];

const MOCK_CLASSIFICATION_RULES: MockRule[] = [
  { pattern: /cottage[\s_-]?cheese|curd/i, category: "ingredient", confidence: 0.92 },
  { pattern: /greek[\s_-]?yogurt|yogurt/i, category: "ingredient", confidence: 0.9 },
  { pattern: /heavy[\s_-]?cream/i, category: "ingredient", confidence: 0.88 },
  { pattern: /olive[\s_-]?oil/i, category: "packaged_food", confidence: 0.9 },
  { pattern: /salt|pepper|garlic|onion|herb|spice/i, category: "ingredient", confidence: 0.85 },
  { pattern: /tomato[\s_-]?soup|\bsoup\b/i, category: "prepared_food", confidence: 0.88 },
  { pattern: /nutrition|label|facts|calories/i, category: "nutrition_label", confidence: 0.91 },
  { pattern: /packaged|bottle|carton|grocery|product/i, category: "packaged_food", confidence: 0.86 },
  { pattern: /knife|kitchen[\s_-]?tool|utensil|spatula|whisk/i, category: "kitchen_tool", confidence: 0.87 },
  { pattern: /recipe|cookbook|instructions/i, category: "recipe", confidence: 0.86 },
  { pattern: /cooking|simmer|stir|chop|saute|bake/i, category: "cooking_process", confidence: 0.84 },
  { pattern: /person|portrait|selfie|face|human|people/i, category: "person", confidence: 0.95 },
  { pattern: /dog|puppy|cat|pet|\banimal\b/i, category: "animal", confidence: 0.93 },
  { pattern: /laptop|computer|phone|electronics|macbook|tablet/i, category: "electronics", confidence: 0.91 },
  { pattern: /car|vehicle|truck|auto|automobile/i, category: "vehicle", confidence: 0.9 },
  { pattern: /landscape|mountain|beach|nature|sky|scenery/i, category: "landscape", confidence: 0.88 },
  { pattern: /document|receipt|invoice|paper|form/i, category: "document", confidence: 0.82 }
];

function parseCategory(value: unknown): ImageCategory {
  if (typeof value === "string" && IMAGE_CATEGORIES.includes(value as ImageCategory)) {
    return value as ImageCategory;
  }
  return "unknown";
}

function mockClassifyImage(input: ImageInput): ImageClassificationResult {
  const filename = input.filename ?? "";

  if (filename) {
    for (const rule of MOCK_CLASSIFICATION_RULES) {
      if (rule.pattern.test(filename)) {
        return { category: rule.category, confidence: rule.confidence };
      }
    }
  }

  return { category: "unknown", confidence: 0.25 };
}

async function classifyWithVisionProvider(input: ImageInput): Promise<ImageClassificationResult | null> {
  const client = getGroqClient();
  if (!client) return null;

  try {
    const completion = await client.chat.completions.create({
      model: getGroqVisionModel(),
      max_tokens: 128,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Classify this image for a home cooking assistant. Reply with JSON only: {"category":"...", "confidence":0.0-1.0}. Use one category: ingredient, prepared_food, packaged_food, nutrition_label, recipe, kitchen_tool, cooking_process, person, animal, document, electronics, vehicle, landscape, unknown. Do not describe the image.`
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

    const parsed = JSON.parse(jsonMatch[0]) as { category?: unknown; confidence?: unknown };
    const confidence =
      typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.7;

    return {
      category: parseCategory(parsed.category),
      confidence
    };
  } catch {
    return null;
  }
}

/**
 * Classifies an uploaded image. Vision providers (Claude, GPT-4.1, Gemini, Groq, etc.)
 * should be swapped in via classifyWithVisionProvider without changing downstream stages.
 */
export async function classifyImage(input: ImageInput): Promise<ImageClassificationResult> {
  const visionResult = await classifyWithVisionProvider(input);
  if (visionResult) {
    return visionResult;
  }

  return mockClassifyImage(input);
}
