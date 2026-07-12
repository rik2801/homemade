import { describe, expect, it } from "vitest";
import { canBeginArchieSend, shouldAppendAssistantForRequest } from "@/lib/archieSendGuard";

describe("archieSendGuard", () => {
  it("blocks a second send while chatLoading or lock is set", () => {
    expect(canBeginArchieSend({ chatLoading: false, archieSendLockId: null })).toBe(true);
    expect(canBeginArchieSend({ chatLoading: true, archieSendLockId: null })).toBe(false);
    expect(canBeginArchieSend({ chatLoading: false, archieSendLockId: "send-1" })).toBe(false);
  });

  it("simulates double-tap: only the first acquire wins", () => {
    let chatLoading = false;
    let archieSendLockId: string | null = null;
    let userAppends = 0;
    let apiCalls = 0;

    function trySend() {
      if (!canBeginArchieSend({ chatLoading, archieSendLockId })) return;
      chatLoading = true;
      archieSendLockId = "send-1";
      userAppends += 1;
      apiCalls += 1;
    }

    trySend();
    trySend();

    expect(userAppends).toBe(1);
    expect(apiCalls).toBe(1);
  });

  it("dedupes assistant appends for the same requestId", () => {
    const messages = [
      { role: "user", requestId: 7 },
      { role: "assistant", requestId: 7 }
    ];

    expect(shouldAppendAssistantForRequest(messages, 7)).toBe(false);
    expect(shouldAppendAssistantForRequest(messages, 8)).toBe(true);
    expect(shouldAppendAssistantForRequest([{ role: "user", requestId: 7 }], 7)).toBe(true);
  });
});
