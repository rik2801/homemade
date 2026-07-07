import Groq from "groq-sdk";

export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
export const DEFAULT_GROQ_VISION_MODEL = "llama-3.2-11b-vision-preview";

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

export function getGroqModel() {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

export function getGroqVisionModel() {
  return process.env.GROQ_VISION_MODEL?.trim() || DEFAULT_GROQ_VISION_MODEL;
}

export const CULINARY_SYSTEM_PROMPT =
  "You are Archie, a culinary assistant for a home cooking app. Provide practical dietary and cooking guidance only — never medical diagnosis or clinical safety claims. Be concise and conversational.";
