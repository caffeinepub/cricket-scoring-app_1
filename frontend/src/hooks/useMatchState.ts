import { useState, useEffect, useCallback, useRef } from 'react';

const MATCH_STATE_KEY = 'cricket_match_state';

export interface MatchStateData {
  matchId: string;
  currentInnings: number;
  strikerId: bigint | null;
  nonStrikerId: bigint | null;
  bowlerId: bigint | null;
  legalBallsInOver: number;
  totalBallsInOver: number;
  currentOver: number;
  isMatchFinished: boolean;
  matchResult: string | null;
  freeHitNext: boolean;
}

const DEFAULT_STATE: Omit<MatchStateData, 'matchId'> = {
  currentInnings: 1,
  strikerId: null,
  nonStrikerId: null,
  bowlerId: null,
  legalBallsInOver: 0,
  totalBallsInOver: 0,
  currentOver: 0,
  isMatchFinished: false,
  matchResult: null,
  freeHitNext: false,
};

function serializeState(state: MatchStateData): string {
  return JSON.stringify(state, (_, value) =>
    typeof value === 'bigint' ? { __bigint__: value.toString() } : value
  );
}

function deserializeState(raw: string): MatchStateData | null {
  try {
    const parsed = JSON.parse(raw, (_, value) => {
      if (value && typeof value === 'object' && '__bigint__' in value) {
        return BigInt(value.__bigint__);
      }
      return value;
    });
    if (!parsed || typeof parsed.matchId === 'undefined') return null;
    return parsed as MatchStateData;
  } catch {
    return null;
  }
}

function loadStateFromStorage(matchId: string): MatchStateData | null {
  try {
    const raw = localStorage.getItem(`${MATCH_STATE_KEY}_${matchId}`);
    if (!raw) return null;
    const state = deserializeState(raw);
    if (!state || state.matchId !== matchId) return null;
    return state;
  } catch {
    return null;
  }
}

function saveStateToStorage(state: MatchStateData): void {
  try {
    localStorage.setItem(
      `${MATCH_STATE_KEY}_${state.matchId}`,
      serializeState(state)
    );
  } catch {
    // ignore storage errors
  }
}

export function clearMatchState(matchId: string): void {
  try {
    localStorage.removeItem(`${MATCH_STATE_KEY}_${matchId}`);
  } catch {
    // ignore
  }
}

export function isMatchStateValid(state: MatchStateData | null): boolean {
  if (!state) return false;
  return (
    state.strikerId !== null &&
    state.nonStrikerId !== null &&
    state.bowlerId !== null
  );
}

export function useMatchState(matchId: string | null) {
  const [matchState, setMatchStateRaw] = useState<MatchStateData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load state from localStorage on mount or matchId change
  useEffect(() => {
    if (!matchId) {
      setMatchStateRaw(null);
      setIsLoaded(true);
      return;
    }

    const stored = loadStateFromStorage(matchId);
    if (stored) {
      setMatchStateRaw(stored);
    } else {
      setMatchStateRaw({ matchId, ...DEFAULT_STATE });
    }
    setIsLoaded(true);
  }, [matchId]);

  // Debounced save to localStorage whenever state changes
  const setMatchState = useCallback(
    (updater: MatchStateData | ((prev: MatchStateData | null) => MatchStateData | null)) => {
      setMatchStateRaw((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (next) {
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
          saveTimerRef.current = setTimeout(() => {
            saveStateToStorage(next);
          }, 100);
        }
        return next;
      });
    },
    []
  );

  const initInnings = useCallback(
    (strikerId: bigint, nonStrikerId: bigint, bowlerId: bigint, inningsNumber: number) => {
      setMatchState((prev) => {
        if (!prev) return prev;
        const next: MatchStateData = {
          ...prev,
          currentInnings: inningsNumber,
          strikerId,
          nonStrikerId,
          bowlerId,
          legalBallsInOver: 0,
          totalBallsInOver: 0,
          currentOver: 0,
          freeHitNext: false,
        };
        saveStateToStorage(next);
        return next;
      });
    },
    [setMatchState]
  );

  const setStriker = useCallback(
    (id: bigint) => {
      setMatchState((prev) => {
        if (!prev) return prev;
        const next = { ...prev, strikerId: id };
        saveStateToStorage(next);
        return next;
      });
    },
    [setMatchState]
  );

  const setNonStriker = useCallback(
    (id: bigint) => {
      setMatchState((prev) => {
        if (!prev) return prev;
        const next = { ...prev, nonStrikerId: id };
        saveStateToStorage(next);
        return next;
      });
    },
    [setMatchState]
  );

  const setBowler = useCallback(
    (id: bigint) => {
      setMatchState((prev) => {
        if (!prev) return prev;
        const next = { ...prev, bowlerId: id };
        saveStateToStorage(next);
        return next;
      });
    },
    [setMatchState]
  );

  const swapBatsmen = useCallback(() => {
    setMatchState((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        strikerId: prev.nonStrikerId,
        nonStrikerId: prev.strikerId,
      };
      saveStateToStorage(next);
      return next;
    });
  }, [setMatchState]);

  const advanceBall = useCallback(
    (isLegal: boolean, isNoBall: boolean) => {
      setMatchState((prev) => {
        if (!prev) return prev;
        const newTotal = prev.totalBallsInOver + 1;
        const newLegal = isLegal ? prev.legalBallsInOver + 1 : prev.legalBallsInOver;
        const freeHitNext = isNoBall;
        const next = {
          ...prev,
          totalBallsInOver: newTotal,
          legalBallsInOver: newLegal,
          freeHitNext,
        };
        saveStateToStorage(next);
        return next;
      });
    },
    [setMatchState]
  );

  const resetOver = useCallback(
    (newBowlerId: bigint) => {
      setMatchState((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          bowlerId: newBowlerId,
          legalBallsInOver: 0,
          totalBallsInOver: 0,
          currentOver: prev.currentOver + 1,
          freeHitNext: false,
        };
        saveStateToStorage(next);
        return next;
      });
    },
    [setMatchState]
  );

  const startSecondInnings = useCallback(
    (strikerId: bigint, nonStrikerId: bigint, bowlerId: bigint) => {
      setMatchState((prev) => {
        if (!prev) return prev;
        const next: MatchStateData = {
          ...prev,
          currentInnings: 2,
          strikerId,
          nonStrikerId,
          bowlerId,
          legalBallsInOver: 0,
          totalBallsInOver: 0,
          currentOver: 0,
          freeHitNext: false,
        };
        saveStateToStorage(next);
        return next;
      });
    },
    [setMatchState]
  );

  const setMatchFinished = useCallback(
    (result: string) => {
      setMatchState((prev) => {
        if (!prev) return prev;
        const next = { ...prev, isMatchFinished: true, matchResult: result };
        saveStateToStorage(next);
        return next;
      });
    },
    [setMatchState]
  );

  const resetState = useCallback(() => {
    if (matchId) {
      clearMatchState(matchId);
      const fresh: MatchStateData = { matchId, ...DEFAULT_STATE };
      setMatchStateRaw(fresh);
    }
  }, [matchId]);

  return {
    matchState,
    isLoaded,
    isSetupComplete: isMatchStateValid(matchState),
    initInnings,
    setStriker,
    setNonStriker,
    setBowler,
    swapBatsmen,
    advanceBall,
    resetOver,
    startSecondInnings,
    setMatchFinished,
    resetState,
    setMatchState,
  };
}
