import { File, Paths } from "expo-file-system";
import type { ArchieChatSession } from "@/types/recipe";

export const MAX_SESSIONS = 5;
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const SCHEMA_VERSION = 1;
const STORAGE_FILENAME = "archie-sessions.json";
const SAVE_DEBOUNCE_MS = 300;

type PersistedPayload = {
  schemaVersion: number;
  sessions: ArchieChatSession[];
};

function getStorageFile(): File {
  return new File(Paths.document, STORAGE_FILENAME);
}

export function isSessionExpired(session: ArchieChatSession, now = Date.now()): boolean {
  return now - session.lastAccessedAt > SESSION_TTL_MS;
}

export function pruneExpiredSessions(
  sessions: ArchieChatSession[],
  now = Date.now()
): ArchieChatSession[] {
  return sessions.filter((session) => !isSessionExpired(session, now));
}

/**
 * Picks the session to evict when at capacity. Ordered by LRU, but:
 * - never evicts the active session,
 * - never evicts a session with a swap generation in flight,
 * - prefers evicting general chats over recipe-swap chats.
 */
export function pickEvictionCandidate(
  sessions: ArchieChatSession[],
  activeSessionId: string | null
): ArchieChatSession | null {
  const evictable = sessions.filter(
    (session) => session.id !== activeSessionId && session.swapState.assistantPhase !== "loading"
  );
  if (evictable.length === 0) return null;

  const byLru = [...evictable].sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);
  return byLru.find((session) => session.kind === "general") ?? byLru[0];
}

export async function loadPersistedSessions(): Promise<ArchieChatSession[]> {
  try {
    const file = getStorageFile();
    if (!file.exists) return [];

    const raw = await file.text();
    const parsed = JSON.parse(raw) as PersistedPayload;
    if (parsed.schemaVersion !== SCHEMA_VERSION || !Array.isArray(parsed.sessions)) {
      return [];
    }

    // A generation can't survive an app restart — resume at the input step.
    const normalized = parsed.sessions.map((session) =>
      session.swapState?.assistantPhase === "loading"
        ? {
            ...session,
            swapState: { ...session.swapState, assistantPhase: "awaiting_substitute" as const }
          }
        : session
    );

    return pruneExpiredSessions(normalized).slice(-MAX_SESSIONS);
  } catch {
    return [];
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function persistSessions(sessions: ArchieChatSession[]) {
  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      // Local image URIs are temp paths that don't survive restarts — drop them.
      const sanitized = sessions.map((session) => ({
        ...session,
        messages: session.messages.map(({ imageUri: _imageUri, ...message }) => message)
      }));
      const payload: PersistedPayload = { schemaVersion: SCHEMA_VERSION, sessions: sanitized };
      getStorageFile().write(JSON.stringify(payload));
    } catch {
      // Persistence is best-effort; never crash the app over it.
    }
  }, SAVE_DEBOUNCE_MS);
}

let sessionCounter = 0;

export function createSessionId(): string {
  sessionCounter += 1;
  return `session-${Date.now()}-${sessionCounter}`;
}
