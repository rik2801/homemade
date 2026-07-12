/**
 * Synchronous single-flight guard for Archie network sends.
 * Call sites must set chatLoading / archieSendLockId immediately when acquire succeeds.
 */
export function canBeginArchieSend(options: {
  chatLoading: boolean;
  archieSendLockId: string | null;
}): boolean {
  return !options.chatLoading && options.archieSendLockId === null;
}

export function shouldAppendAssistantForRequest(
  messages: Array<{ role: string; requestId?: number }>,
  requestId: number
): boolean {
  return !messages.some(
    (message) => message.role === "assistant" && message.requestId === requestId
  );
}
