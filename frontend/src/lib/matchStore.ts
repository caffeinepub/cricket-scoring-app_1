// localStorage utilities for match state persistence

const STORED_MATCHES_KEY = 'cricket_stored_matches';
const MATCH_META_KEY = 'cricket_match_meta';
const MATCH_STATE_PREFIX = 'cricket_match_state';

export interface StoredMatch {
  matchId: string;
  teamAId?: string;
  teamBId?: string;
  teamAName: string;
  teamBName: string;
  oversLimit?: number;
  createdAt: number;
  isFinished: boolean;
  result?: string;
}

export interface MatchMeta {
  currentMatchId: string | null;
}

// ── BigInt-safe JSON helpers ──────────────────────────────────────────────────

function replacer(_: string, value: unknown): unknown {
  if (typeof value === 'bigint') return { __bigint__: value.toString() };
  return value;
}

function reviver(_: string, value: unknown): unknown {
  if (
    value !== null &&
    typeof value === 'object' &&
    '__bigint__' in (value as Record<string, unknown>)
  ) {
    return BigInt((value as Record<string, string>).__bigint__);
  }
  return value;
}

function safeStringify(data: unknown): string {
  return JSON.stringify(data, replacer);
}

function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw, reviver) as T;
  } catch {
    return null;
  }
}

// ── Stored Matches ────────────────────────────────────────────────────────────

export function getStoredMatches(): StoredMatch[] {
  try {
    const raw = localStorage.getItem(STORED_MATCHES_KEY);
    if (!raw) return [];
    return safeParse<StoredMatch[]>(raw) ?? [];
  } catch {
    return [];
  }
}

export function saveStoredMatch(match: StoredMatch): void {
  try {
    const matches = getStoredMatches();
    const idx = matches.findIndex((m) => m.matchId === match.matchId);
    if (idx >= 0) {
      matches[idx] = match;
    } else {
      matches.push(match);
    }
    localStorage.setItem(STORED_MATCHES_KEY, safeStringify(matches));
  } catch {
    // ignore
  }
}

/** Alias for backward compatibility */
export const storeMatch = saveStoredMatch;

export function updateStoredMatch(
  matchId: string,
  updates: Partial<StoredMatch>
): void {
  try {
    const matches = getStoredMatches();
    const idx = matches.findIndex((m) => m.matchId === matchId);
    if (idx >= 0) {
      matches[idx] = { ...matches[idx], ...updates };
      localStorage.setItem(STORED_MATCHES_KEY, safeStringify(matches));
    }
  } catch {
    // ignore
  }
}

export function removeStoredMatch(matchId: string): void {
  try {
    const matches = getStoredMatches().filter((m) => m.matchId !== matchId);
    localStorage.setItem(STORED_MATCHES_KEY, safeStringify(matches));
  } catch {
    // ignore
  }
}

// ── Match Meta (current match pointer) ───────────────────────────────────────

export function getMatchMeta(): MatchMeta {
  try {
    const raw = localStorage.getItem(MATCH_META_KEY);
    if (!raw) return { currentMatchId: null };
    return safeParse<MatchMeta>(raw) ?? { currentMatchId: null };
  } catch {
    return { currentMatchId: null };
  }
}

export function saveMatchMeta(meta: MatchMeta): void {
  try {
    localStorage.setItem(MATCH_META_KEY, safeStringify(meta));
  } catch {
    // ignore
  }
}

export function clearMatchMeta(): void {
  try {
    localStorage.removeItem(MATCH_META_KEY);
  } catch {
    // ignore
  }
}

// ── Match State Validation ────────────────────────────────────────────────────

export interface RawMatchState {
  matchId?: string;
  strikerId?: unknown;
  nonStrikerId?: unknown;
  bowlerId?: unknown;
  currentInnings?: number;
  [key: string]: unknown;
}

/**
 * Returns true if the stored match state for the given matchId has the minimum
 * required fields: strikerId, nonStrikerId, bowlerId, and currentInnings.
 */
export function isStoredMatchStateValid(matchId: string): boolean {
  try {
    const raw = localStorage.getItem(`${MATCH_STATE_PREFIX}_${matchId}`);
    if (!raw) return false;
    const state = safeParse<RawMatchState>(raw);
    if (!state) return false;
    return (
      state.strikerId !== null &&
      state.strikerId !== undefined &&
      state.nonStrikerId !== null &&
      state.nonStrikerId !== undefined &&
      state.bowlerId !== null &&
      state.bowlerId !== undefined &&
      typeof state.currentInnings === 'number'
    );
  } catch {
    return false;
  }
}

/**
 * Clears the match state for the given matchId from localStorage.
 */
export function clearStoredMatchState(matchId: string): void {
  try {
    localStorage.removeItem(`${MATCH_STATE_PREFIX}_${matchId}`);
  } catch {
    // ignore
  }
}

/**
 * Clears ALL cricket_match_state_* keys from localStorage.
 */
export function clearAllMatchState(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(MATCH_STATE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
