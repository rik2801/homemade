import type { ChatRequest, ChatResponse } from "../types/ai";
import { classifyImage, type ImageInput } from "./imageClassifier";
import { getCookingImageGuardrailMessage, validateCookingImage } from "./imageGuardrails";
import { extractIngredient } from "./ingredientExtractor";
import { reasonAboutRecipe } from "./recipeReasoner";

const IMAGE_ONLY_PROMPTS = ["what's in this photo?", "what is in this photo?"];

export function isImageOnlyRequest(message: string) {
  const normalized = message.trim().toLowerCase();
  return normalized.length === 0 || IMAGE_ONLY_PROMPTS.includes(normalized);
}

export function buildImageOnlyReply() {
  return "I can see you've shared a photo. What would you like to know about it?";
}

function toImageInput(request: ChatRequest): ImageInput {
  return {
    dataUrl: request.imageDataUrl!,
    filename: request.imageFilename
  };
}

function buildGuardrailResponse(): ChatResponse {
  return {
    source: "declined",
    reply: getCookingImageGuardrailMessage(),
    inScope: true
  };
}

function buildExtractionFailureResponse(): ChatResponse {
  return {
    source: "declined",
    reply:
      "I couldn't identify a food item in this image. Try uploading a clearer photo of the ingredient, packaged product, nutrition label, or dish you're working with.",
    inScope: true
  };
}

/**
 * Production-style image pipeline:
 * Classification → Guardrails → Extraction → Recipe Reasoning
 */
export async function processImageMessage(request: ChatRequest): Promise<ChatResponse | null> {
  if (!request.imageDataUrl) return null;

  const imageInput = toImageInput(request);

  const classification = await classifyImage(imageInput);
  const validation = validateCookingImage(classification);

  if (!validation.allowed) {
    return buildGuardrailResponse();
  }

  if (isImageOnlyRequest(request.message)) {
    return {
      source: "demo",
      reply: buildImageOnlyReply(),
      inScope: true
    };
  }

  const extracted = await extractIngredient(imageInput, classification);
  if (!extracted) {
    return buildExtractionFailureResponse();
  }

  return reasonAboutRecipe({
    request,
    classification,
    extracted
  });
}
