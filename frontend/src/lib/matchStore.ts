// Local match store for tracking match metadata (IDs, dates, etc.)
// since the backend doesn't have a getAllMatches() method

const MATCH_STORE_KEY = 'cricket_match_store';
const MATCH_META_KEY = 'cricket_match_meta';
const MATCH_STATE_KEY = 'cricket_match_state';

// ─── Stored Matches List (for history) ───────────────────────────────────────

export interface StoredMatch {
  matchId: string;
  teamAName: string;
  teamBName: string;
  teamAId: string;
  teamBId: string;
  /** ISO date string */
  date: string;
  /** Legacy alias kept for backward compat */
  createdAt?: string;
  isFinished: boolean;
}

export function getStoredMatches(): StoredMatch[] {
  try {
    const raw = localStorage.getItem(MATCH_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredMatch[];
    // Normalise legacy records that used createdAt instead of date
    return parsed.map((m) => ({
      ...m,
      date: m.date ?? m.createdAt ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export function storeMatch(meta: StoredMatch): void {
  const matches = getStoredMatches();
  const idx = matches.findIndex((m) => m.matchId === meta.matchId);
  if (idx >= 0) {
    matches[idx] = meta;
  } else {
    matches.unshift(meta);
  }
  localStorage.setItem(MATCH_STORE_KEY, JSON.stringify(matches));
}

export function updateMatchFinished(matchId: string, isFinished: boolean): void {
  const matches = getStoredMatches();
  const idx = matches.findIndex((m) => m.matchId === matchId);
  if (idx >= 0) {
    matches[idx].isFinished = isFinished;
    localStorage.setItem(MATCH_STORE_KEY, JSON.stringify(matches));
  }
}

export function deleteStoredMatch(matchId: string): void {
  const matches = getStoredMatches().filter((m) => m.matchId !== matchId);
  localStorage.setItem(MATCH_STORE_KEY, JSON.stringify(matches));
}

/** Clears the entire stored matches list from localStorage. */
export function clearAllMatches(): void {
  localStorage.removeItem(MATCH_STORE_KEY);
}

// ─── Match Meta (playing 11, openers, etc.) ──────────────────────────────────
// Stored as strings to avoid BigInt JSON serialisation issues.

export interface MatchMeta {
  matchId: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  /** All players for team A (serialised as plain objects) */
  teamAPlayers: Array<{ id: string; name: string; battingOrder: string; isBowler: boolean }>;
  /** All players for team B (serialised as plain objects) */
  teamBPlayers: Array<{ id: string; name: string; battingOrder: string; isBowler: boolean }>;
  /** Playing 11 player IDs as strings */
  teamAPlayingEleven: string[];
  teamBPlayingEleven: string[];
  /** Opening striker player ID */
  strikerId: string;
  /** Opening non-striker player ID */
  nonStrikerId: string;
  /** Opening bowler player ID */
  bowlerId: string;
  oversLimit?: number;
}

export function saveMatchMeta(matchId: string, meta: Omit<MatchMeta, 'matchId'>): void {
  const full: MatchMeta = { matchId, ...meta };
  localStorage.setItem(`${MATCH_META_KEY}_${matchId}`, JSON.stringify(full));
  // Also save as "current" for backward compat
  localStorage.setItem(MATCH_META_KEY, JSON.stringify(full));
}

export function getMatchMeta(matchId?: string): MatchMeta | null {
  try {
    const key = matchId
      ? `${MATCH_META_KEY}_${matchId}`
      : MATCH_META_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Fallback to legacy key
      if (matchId) {
        const legacy = localStorage.getItem(MATCH_META_KEY);
        if (!legacy) return null;
        const parsed = JSON.parse(legacy) as MatchMeta;
        if (parsed.matchId === matchId) return parsed;
        return null;
      }
      return null;
    }
    return JSON.parse(raw) as MatchMeta;
  } catch {
    return null;
  }
}

export function clearMatchMeta(matchId?: string): void {
  if (matchId) {
    localStorage.removeItem(`${MATCH_META_KEY}_${matchId}`);
  }
  localStorage.removeItem(MATCH_META_KEY);
}

/**
 * Clears all match metadata keys from localStorage.
 * Iterates over all keys to remove any `cricket_match_meta_*` entries.
 */
export function clearAllMatchMetadata(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(MATCH_META_KEY)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

// ─── Local Match State (striker/non-striker/bowler during live scoring) ───────

export interface LocalMatchState {
  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;
}

export function getLocalMatchState(matchId: string): LocalMatchState | null {
  try {
    const raw = localStorage.getItem(`${MATCH_STATE_KEY}_${matchId}`);
    if (!raw) return null;
    return JSON.parse(raw) as LocalMatchState;
  } catch {
    return null;
  }
}

export function saveLocalMatchState(matchId: string, state: LocalMatchState): void {
  localStorage.setItem(`${MATCH_STATE_KEY}_${matchId}`, JSON.stringify(state));
}

export function clearLocalMatchState(matchId: string): void {
  localStorage.removeItem(`${MATCH_STATE_KEY}_${matchId}`);
}

/**
 * Clears all live match state keys from localStorage.
 * Iterates over all keys to remove any `cricket_match_state_*` entries.
 */
export function clearAllLiveMatchStates(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(MATCH_STATE_KEY)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
