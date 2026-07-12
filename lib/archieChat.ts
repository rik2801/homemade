import type {
  ArchieChatMessage,
  ArchieImageRecommendation,
  ArchieStructuredResponse
} from "@/types/recipe";

export const ARCHIE_PROMPTS = {
  pickRecipe: "Which recipe should I use for this swap?",
  pickRecipeToAttach: "Which recipe would you like to attach?",
  pickIngredient: "Which ingredient would you like to swap?",
  pickIngredientToAlter: "Which ingredient would you like to alter?",
  pickSubstitute: "What do you have available instead?",
  askAboutRecipe: (title: string) => `What would you like to know about ${title}?`
} as const;

let chatMessageCounter = 0;

export function createChatMessage(
  role: ArchieChatMessage["role"],
  text: string,
  options?: {
    imageUri?: string;
    recommendation?: ArchieImageRecommendation;
    structuredResponse?: ArchieStructuredResponse;
    plainBubble?: boolean;
    requestId?: number;
  }
): ArchieChatMessage {
  chatMessageCounter += 1;
  return {
    id: `chat-${chatMessageCounter}-${Date.now()}`,
    role,
    text,
    ...(options?.imageUri ? { imageUri: options.imageUri } : {}),
    ...(options?.recommendation ? { recommendation: options.recommendation } : {}),
    ...(options?.structuredResponse ? { structuredResponse: options.structuredResponse } : {}),
    ...(options?.plainBubble ? { plainBubble: true } : {}),
    ...(options?.requestId !== undefined ? { requestId: options.requestId } : {})
  };
}

export function appendChatMessages(
  messages: ArchieChatMessage[],
  ...items: Array<{
    role: ArchieChatMessage["role"];
    text: string;
    imageUri?: string;
    recommendation?: ArchieImageRecommendation;
    structuredResponse?: ArchieStructuredResponse;
    plainBubble?: boolean;
    requestId?: number;
  }>
): ArchieChatMessage[] {
  return [
    ...messages,
    ...items.map((item) =>
      createChatMessage(item.role, item.text, {
        imageUri: item.imageUri,
        recommendation: item.recommendation,
        structuredResponse: item.structuredResponse,
        plainBubble: item.plainBubble,
        requestId: item.requestId
      })
    )
  ];
}
