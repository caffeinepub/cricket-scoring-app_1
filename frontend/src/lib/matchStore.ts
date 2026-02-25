export interface StoredMatch {
  matchId: string;
  isFinished: boolean;
  createdAt: number;
  teamAId?: bigint;
  teamBId?: bigint;
  teamAName?: string;
  teamBName?: string;
  result?: string;
  winnerTeamId?: bigint | null;
}

export interface MatchMeta {
  matchId: string;
  teamAId: bigint;
  teamBId: bigint;
  strikerId: bigint | null;
  nonStrikerId: bigint | null;
  bowlerId: bigint | null;
  teamAPlayingEleven: bigint[];
  teamBPlayingEleven: bigint[];
}

export interface LocalMatchState {
  strikerId?: bigint | null;
  nonStrikerId?: bigint | null;
  bowlerId?: bigint | null;
}

const MATCHES_KEY = 'cricket_matches';
const MATCH_META_KEY = 'cricket_match_meta';
const LOCAL_STATE_KEY = 'cricket_local_state';

// ---- Stored Matches ----

export function getStoredMatches(): StoredMatch[] {
  try {
    const raw = localStorage.getItem(MATCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((m: StoredMatch & { teamAId?: string; teamBId?: string; winnerTeamId?: string | null }) => ({
      ...m,
      teamAId: m.teamAId != null ? BigInt(m.teamAId) : undefined,
      teamBId: m.teamBId != null ? BigInt(m.teamBId) : undefined,
      winnerTeamId: m.winnerTeamId != null ? BigInt(m.winnerTeamId) : null,
    }));
  } catch {
    return [];
  }
}

export function storeMatch(match: StoredMatch): void {
  const matches = getStoredMatches();
  const idx = matches.findIndex(m => m.matchId === match.matchId);
  const serializable = {
    ...match,
    teamAId: match.teamAId?.toString(),
    teamBId: match.teamBId?.toString(),
    winnerTeamId: match.winnerTeamId != null ? match.winnerTeamId.toString() : null,
  };
  if (idx >= 0) {
    const arr = getStoredMatchesRaw();
    arr[idx] = serializable;
    localStorage.setItem(MATCHES_KEY, JSON.stringify(arr));
  } else {
    const arr = getStoredMatchesRaw();
    arr.push(serializable);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(arr));
  }
}

function getStoredMatchesRaw(): Record<string, unknown>[] {
  try {
    const raw = localStorage.getItem(MATCHES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function updateStoredMatch(matchId: string, updates: Partial<StoredMatch>): void {
  const arr = getStoredMatchesRaw();
  const idx = arr.findIndex((m: Record<string, unknown>) => m.matchId === matchId);
  if (idx >= 0) {
    const serializable: Record<string, unknown> = { ...updates };
    if (updates.teamAId != null) serializable.teamAId = updates.teamAId.toString();
    if (updates.teamBId != null) serializable.teamBId = updates.teamBId.toString();
    if ('winnerTeamId' in updates) {
      serializable.winnerTeamId = updates.winnerTeamId != null ? updates.winnerTeamId.toString() : null;
    }
    arr[idx] = { ...arr[idx], ...serializable };
    localStorage.setItem(MATCHES_KEY, JSON.stringify(arr));
  }
}

// ---- Match Meta ----

export function saveMatchMeta(matchId: string, meta: MatchMeta): void {
  const serializable = {
    ...meta,
    teamAId: meta.teamAId.toString(),
    teamBId: meta.teamBId.toString(),
    strikerId: meta.strikerId?.toString() ?? null,
    nonStrikerId: meta.nonStrikerId?.toString() ?? null,
    bowlerId: meta.bowlerId?.toString() ?? null,
    teamAPlayingEleven: meta.teamAPlayingEleven.map(id => id.toString()),
    teamBPlayingEleven: meta.teamBPlayingEleven.map(id => id.toString()),
  };
  localStorage.setItem(`${MATCH_META_KEY}_${matchId}`, JSON.stringify(serializable));
}

export function getMatchMeta(matchId: string): MatchMeta | null {
  try {
    const raw = localStorage.getItem(`${MATCH_META_KEY}_${matchId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      teamAId: BigInt(parsed.teamAId),
      teamBId: BigInt(parsed.teamBId),
      strikerId: parsed.strikerId != null ? BigInt(parsed.strikerId) : null,
      nonStrikerId: parsed.nonStrikerId != null ? BigInt(parsed.nonStrikerId) : null,
      bowlerId: parsed.bowlerId != null ? BigInt(parsed.bowlerId) : null,
      teamAPlayingEleven: (parsed.teamAPlayingEleven ?? []).map((id: string) => BigInt(id)),
      teamBPlayingEleven: (parsed.teamBPlayingEleven ?? []).map((id: string) => BigInt(id)),
    };
  } catch {
    return null;
  }
}

// ---- Local Match State (live scoring state) ----

export function saveLocalMatchState(matchId: string, state: LocalMatchState): void {
  try {
    const existing = getLocalMatchState(matchId) ?? {};
    const merged = { ...existing, ...state };
    const serializable = {
      strikerId: merged.strikerId?.toString() ?? null,
      nonStrikerId: merged.nonStrikerId?.toString() ?? null,
      bowlerId: merged.bowlerId?.toString() ?? null,
    };
    localStorage.setItem(`${LOCAL_STATE_KEY}_${matchId}`, JSON.stringify(serializable));
  } catch {}
}

export function getLocalMatchState(matchId: string): LocalMatchState | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_STATE_KEY}_${matchId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      strikerId: parsed.strikerId != null ? BigInt(parsed.strikerId) : null,
      nonStrikerId: parsed.nonStrikerId != null ? BigInt(parsed.nonStrikerId) : null,
      bowlerId: parsed.bowlerId != null ? BigInt(parsed.bowlerId) : null,
    };
  } catch {
    return null;
  }
}

// ---- Clear utilities ----

export function clearAllMatches(): void {
  localStorage.removeItem(MATCHES_KEY);
}

export function clearAllMeta(): void {
  // Clear all match meta keys
  const keys = Object.keys(localStorage).filter(k => k.startsWith(MATCH_META_KEY));
  keys.forEach(k => localStorage.removeItem(k));
}

export function clearAllLocalState(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(LOCAL_STATE_KEY));
  keys.forEach(k => localStorage.removeItem(k));
}

export function clearAllMatchState(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('cricket_match_state'));
  keys.forEach(k => localStorage.removeItem(k));
}
