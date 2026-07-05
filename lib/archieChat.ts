import type { ArchieChatMessage } from "@/types/recipe";

export const ARCHIE_PROMPTS = {
  pickRecipe: "Which recipe should I use for this swap?",
  pickIngredient: "Which ingredient would you like to swap?",
  pickSubstitute: "What do you have available instead?"
} as const;

let chatMessageCounter = 0;

export function createChatMessage(role: ArchieChatMessage["role"], text: string): ArchieChatMessage {
  chatMessageCounter += 1;
  return {
    id: `chat-${chatMessageCounter}-${Date.now()}`,
    role,
    text
  };
}

export function appendChatMessages(
  messages: ArchieChatMessage[],
  ...items: Array<{ role: ArchieChatMessage["role"]; text: string }>
): ArchieChatMessage[] {
  return [...messages, ...items.map((item) => createChatMessage(item.role, item.text))];
}
