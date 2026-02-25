import { useState, useCallback } from 'react';

export interface MatchState {
  strikerId: bigint | null;
  nonStrikerId: bigint | null;
  bowlerId: bigint | null;
  currentInnings: number;
  isMatchOver: boolean;
  matchResult: string | null;
}

const STORAGE_KEY = 'cricket_match_state';

function loadState(): MatchState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        strikerId: parsed.strikerId != null ? BigInt(parsed.strikerId) : null,
        nonStrikerId: parsed.nonStrikerId != null ? BigInt(parsed.nonStrikerId) : null,
        bowlerId: parsed.bowlerId != null ? BigInt(parsed.bowlerId) : null,
        currentInnings: parsed.currentInnings ?? 1,
        isMatchOver: parsed.isMatchOver ?? false,
        matchResult: parsed.matchResult ?? null,
      };
    }
  } catch {}
  return {
    strikerId: null,
    nonStrikerId: null,
    bowlerId: null,
    currentInnings: 1,
    isMatchOver: false,
    matchResult: null,
  };
}

function persistState(state: MatchState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      strikerId: state.strikerId != null ? state.strikerId.toString() : null,
      nonStrikerId: state.nonStrikerId != null ? state.nonStrikerId.toString() : null,
      bowlerId: state.bowlerId != null ? state.bowlerId.toString() : null,
      currentInnings: state.currentInnings,
      isMatchOver: state.isMatchOver,
      matchResult: state.matchResult,
    }));
  } catch {}
}

export function useMatchState() {
  const [state, setState] = useState<MatchState>(loadState);

  const updateState = useCallback((updater: (prev: MatchState) => MatchState) => {
    setState(prev => {
      const next = updater(prev);
      persistState(next);
      return next;
    });
  }, []);

  const setStrikerId = useCallback((id: bigint | null) => {
    updateState(prev => ({ ...prev, strikerId: id }));
  }, [updateState]);

  const setNonStrikerId = useCallback((id: bigint | null) => {
    updateState(prev => ({ ...prev, nonStrikerId: id }));
  }, [updateState]);

  const setBowlerId = useCallback((id: bigint | null) => {
    updateState(prev => ({ ...prev, bowlerId: id }));
  }, [updateState]);

  const setCurrentInnings = useCallback((innings: number) => {
    updateState(prev => ({ ...prev, currentInnings: innings }));
  }, [updateState]);

  const setIsMatchOver = useCallback((over: boolean) => {
    updateState(prev => ({ ...prev, isMatchOver: over }));
  }, [updateState]);

  const setMatchResult = useCallback((result: string | null) => {
    updateState(prev => ({ ...prev, matchResult: result }));
  }, [updateState]);

  // Swap striker and non-striker using functional update to avoid stale closures
  const swapBatsmen = useCallback(() => {
    updateState(prev => ({
      ...prev,
      strikerId: prev.nonStrikerId,
      nonStrikerId: prev.strikerId,
    }));
  }, [updateState]);

  const startNextInnings = useCallback((
    newStrikerId: bigint,
    newNonStrikerId: bigint,
    newBowlerId: bigint
  ) => {
    updateState(prev => ({
      ...prev,
      strikerId: newStrikerId,
      nonStrikerId: newNonStrikerId,
      bowlerId: newBowlerId,
      currentInnings: prev.currentInnings + 1,
    }));
  }, [updateState]);

  const endMatch = useCallback((result: string) => {
    updateState(prev => ({
      ...prev,
      isMatchOver: true,
      matchResult: result,
    }));
  }, [updateState]);

  const resetMatchState = useCallback(() => {
    const fresh: MatchState = {
      strikerId: null,
      nonStrikerId: null,
      bowlerId: null,
      currentInnings: 1,
      isMatchOver: false,
      matchResult: null,
    };
    persistState(fresh);
    setState(fresh);
  }, []);

  return {
    strikerId: state.strikerId,
    nonStrikerId: state.nonStrikerId,
    bowlerId: state.bowlerId,
    currentInnings: state.currentInnings,
    isMatchOver: state.isMatchOver,
    matchResult: state.matchResult,
    setStrikerId,
    setNonStrikerId,
    setBowlerId,
    setCurrentInnings,
    setIsMatchOver,
    setMatchResult,
    swapBatsmen,
    startNextInnings,
    endMatch,
    resetMatchState,
  };
}
