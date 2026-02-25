// Local match store for tracking match metadata (IDs, dates, etc.)
// since the backend doesn't have a getAllMatches() method

const MATCH_STORE_KEY = 'cricket_match_store';

export interface MatchMeta {
  matchId: string;
  teamAName: string;
  teamBName: string;
  teamAId: string;
  teamBId: string;
  createdAt: string;
  isFinished: boolean;
}

export function getStoredMatches(): MatchMeta[] {
  try {
    const raw = localStorage.getItem(MATCH_STORE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MatchMeta[];
  } catch {
    return [];
  }
}

export function storeMatch(meta: MatchMeta): void {
  const matches = getStoredMatches();
  const idx = matches.findIndex(m => m.matchId === meta.matchId);
  if (idx >= 0) {
    matches[idx] = meta;
  } else {
    matches.unshift(meta);
  }
  localStorage.setItem(MATCH_STORE_KEY, JSON.stringify(matches));
}

export function updateMatchFinished(matchId: string, isFinished: boolean): void {
  const matches = getStoredMatches();
  const idx = matches.findIndex(m => m.matchId === matchId);
  if (idx >= 0) {
    matches[idx].isFinished = isFinished;
    localStorage.setItem(MATCH_STORE_KEY, JSON.stringify(matches));
  }
}

export function deleteStoredMatch(matchId: string): void {
  const matches = getStoredMatches().filter(m => m.matchId !== matchId);
  localStorage.setItem(MATCH_STORE_KEY, JSON.stringify(matches));
}

// Track current match state locally (striker, non-striker, bowler)
const MATCH_STATE_KEY = 'cricket_match_state';

export interface LocalMatchState {
  matchId: string;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  currentInnings: number;
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

export function saveLocalMatchState(state: LocalMatchState): void {
  localStorage.setItem(`${MATCH_STATE_KEY}_${state.matchId}`, JSON.stringify(state));
}
