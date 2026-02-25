import { useState, useEffect, useMemo } from 'react';
import { useMatch } from './useQueries';
import { getLocalMatchState, saveLocalMatchState } from '../lib/matchStore';
import { calcBatsmanStats, calcBowlerStats } from '../lib/matchUtils';
import type { Match, Team, BallByBallRecord } from '../backend';

export interface MatchStateResult {
  match: Match | null | undefined;
  isLoading: boolean;
  strikerId: bigint | null;
  nonStrikerId: bigint | null;
  bowlerId: bigint | null;
  setStrikerId: (id: bigint) => void;
  setNonStrikerId: (id: bigint) => void;
  setBowlerId: (id: bigint) => void;
  swapBatsmen: () => void;
  totalRuns: number;
  wickets: number;
  legalBalls: number;
  currentOver: number;
  currentOverBalls: BallByBallRecord[];
  strikerStats: ReturnType<typeof calcBatsmanStats> | null;
  nonStrikerStats: ReturnType<typeof calcBatsmanStats> | null;
  bowlerStats: ReturnType<typeof calcBowlerStats> | null;
  bowlerOverCounts: Map<string, number>;
  isOverComplete: boolean;
  isInningsComplete: boolean;
}

export function useMatchState(matchId: string, teamA: Team | null, teamB: Team | null): MatchStateResult {
  const { data: match, isLoading } = useMatch(matchId ? BigInt(matchId) : null);

  const [strikerId, setStrikerIdState] = useState<bigint | null>(null);
  const [nonStrikerId, setNonStrikerIdState] = useState<bigint | null>(null);
  const [bowlerId, setBowlerIdState] = useState<bigint | null>(null);

  // Load local state on mount
  useEffect(() => {
    if (!matchId) return;
    const local = getLocalMatchState(matchId);
    if (local) {
      setStrikerIdState(local.strikerId !== null ? BigInt(local.strikerId) : null);
      setNonStrikerIdState(local.nonStrikerId !== null ? BigInt(local.nonStrikerId) : null);
      setBowlerIdState(local.bowlerId !== null ? BigInt(local.bowlerId) : null);
    }
  }, [matchId]);

  const persistState = (
    newStrikerId: bigint | null,
    newNonStrikerId: bigint | null,
    newBowlerId: bigint | null
  ) => {
    if (!matchId) return;
    saveLocalMatchState(matchId, {
      strikerId: newStrikerId !== null ? newStrikerId.toString() : null,
      nonStrikerId: newNonStrikerId !== null ? newNonStrikerId.toString() : null,
      bowlerId: newBowlerId !== null ? newBowlerId.toString() : null,
    });
  };

  const setStrikerId = (id: bigint) => {
    setStrikerIdState(id);
    persistState(id, nonStrikerId, bowlerId);
  };

  const setNonStrikerId = (id: bigint) => {
    setNonStrikerIdState(id);
    persistState(strikerId, id, bowlerId);
  };

  const setBowlerId = (id: bigint) => {
    setBowlerIdState(id);
    persistState(strikerId, nonStrikerId, id);
  };

  const swapBatsmen = () => {
    const tmp = strikerId;
    setStrikerIdState(nonStrikerId);
    setNonStrikerIdState(tmp);
    persistState(nonStrikerId, strikerId, bowlerId);
  };

  const deliveries = match?.deliveries ?? [];

  const totalRuns = useMemo(
    () => deliveries.reduce((s, d) => s + Number(d.runs), 0),
    [deliveries]
  );

  const wickets = useMemo(
    () => deliveries.filter((d) => d.wicket !== undefined && d.wicket !== null).length,
    [deliveries]
  );

  const legalBalls = useMemo(
    () => deliveries.filter((d) => !d.isWide && !d.isNoBall).length,
    [deliveries]
  );

  const currentOver = useMemo(() => Math.floor(legalBalls / 6) + 1, [legalBalls]);

  const currentOverBalls = useMemo(
    () => deliveries.filter((d) => Number(d.overNumber) === currentOver),
    [deliveries, currentOver]
  );

  const legalBallsInCurrentOver = currentOverBalls.filter((d) => !d.isWide && !d.isNoBall).length;
  const isOverComplete = legalBallsInCurrentOver >= 6;

  const oversLimit = match ? Number(match.rules.oversLimit) : 20;
  const isInningsComplete = legalBalls >= oversLimit * 6 || wickets >= 10;

  // Bowler over counts
  const bowlerOverCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const bowlerBalls = new Map<string, Set<number>>();
    for (const d of deliveries) {
      const bid = d.bowlerId.toString();
      if (!bowlerBalls.has(bid)) bowlerBalls.set(bid, new Set());
      if (!d.isWide && !d.isNoBall) {
        bowlerBalls.get(bid)!.add(Number(d.overNumber));
      }
    }
    for (const [bid, overs] of bowlerBalls) {
      counts.set(bid, overs.size);
    }
    return counts;
  }, [deliveries]);

  // Get current batting/bowling team
  const currentInnings = match ? Number(match.currentInnings) : 1;
  const battingTeamId = currentInnings === 1 ? match?.teamAId : match?.teamBId;
  const bowlingTeamId = battingTeamId === match?.teamAId ? match?.teamBId : match?.teamAId;

  const battingTeam = battingTeamId === match?.teamAId ? teamA : teamB;
  const bowlingTeam = bowlingTeamId === match?.teamAId ? teamA : teamB;

  const strikerPlayer = battingTeam?.players.find((p) => p.id === strikerId) ?? null;
  const nonStrikerPlayer = battingTeam?.players.find((p) => p.id === nonStrikerId) ?? null;
  const bowlerPlayer = bowlingTeam?.players.find((p) => p.id === bowlerId) ?? null;

  const strikerStats = strikerPlayer
    ? calcBatsmanStats(deliveries, strikerId!, strikerPlayer.name)
    : null;

  const nonStrikerStats = nonStrikerPlayer
    ? calcBatsmanStats(deliveries, nonStrikerId!, nonStrikerPlayer.name)
    : null;

  const bowlerStats = bowlerPlayer
    ? calcBowlerStats(deliveries, bowlerId!, bowlerPlayer.name)
    : null;

  return {
    match,
    isLoading,
    strikerId,
    nonStrikerId,
    bowlerId,
    setStrikerId,
    setNonStrikerId,
    setBowlerId,
    swapBatsmen,
    totalRuns,
    wickets,
    legalBalls,
    currentOver,
    currentOverBalls,
    strikerStats,
    nonStrikerStats,
    bowlerStats,
    bowlerOverCounts,
    isOverComplete,
    isInningsComplete,
  };
}
