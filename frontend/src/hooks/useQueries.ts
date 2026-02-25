import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Team, Match, Delivery, MatchRules, TournamentRules, MatchId, InningsId, Toss } from '@/backend';

// ── Teams ─────────────────────────────────────────────────────────────────────

export function useGetAllTeams() {
  const { actor, isFetching } = useActor();

  return useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTeams();
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}

/** Alias kept for backward compatibility */
export const useTeams = useGetAllTeams;

export function useGetTeam(teamId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Team | null>({
    queryKey: ['team', teamId?.toString()],
    queryFn: async () => {
      if (!actor || teamId === null) return null;
      return actor.getTeam(teamId);
    },
    enabled: !!actor && !isFetching && teamId !== null,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}

// ── Matches ───────────────────────────────────────────────────────────────────

export function useGetMatch(matchId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Match | null>({
    queryKey: ['match', matchId?.toString()],
    queryFn: async () => {
      if (!actor || matchId === null) return null;
      return actor.getMatch(matchId);
    },
    enabled: !!actor && !isFetching && matchId !== null,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useGetDeliveriesByInnings(matchId: bigint | null, inningsId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Delivery[]>({
    queryKey: ['deliveries', matchId?.toString(), inningsId.toString()],
    queryFn: async () => {
      if (!actor || matchId === null) return [];
      return actor.getDeliveriesByInnings(matchId, inningsId);
    },
    enabled: !!actor && !isFetching && matchId !== null,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    staleTime: 2000,
  });
}

// ── Tournament Rules ──────────────────────────────────────────────────────────

export function useGetTournamentRules() {
  const { actor, isFetching } = useActor();

  return useQuery<TournamentRules>({
    queryKey: ['tournamentRules'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not ready');
      return actor.getTournamentRules();
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}

/** Alias kept for backward compatibility */
export const useTournamentRules = useGetTournamentRules;

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useAddTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      color,
      logo,
    }: {
      name: string;
      color: string;
      logo: string;
    }) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.addTeam(name, color, logo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useAddPlayer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      name,
      battingOrder,
      isBowler,
    }: {
      teamId: bigint;
      name: string;
      battingOrder: bigint;
      isBowler: boolean;
    }) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.addPlayer(teamId, name, battingOrder, isBowler);
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', teamId.toString()] });
    },
  });
}

export function useSelectSquad() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      squad,
    }: {
      teamId: bigint;
      squad: bigint[];
    }) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.selectSquad(teamId, squad);
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', teamId.toString()] });
    },
  });
}

export function useCreateMatch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamAId,
      teamBId,
      rules,
      toss,
    }: {
      teamAId: bigint;
      teamBId: bigint;
      rules: MatchRules;
      toss: Toss;
    }) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.createMatch(teamAId, teamBId, rules, toss);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useRecordDelivery() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      inningsId,
      delivery,
    }: {
      matchId: MatchId;
      inningsId: InningsId;
      delivery: Delivery;
    }) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.recordDelivery(matchId, inningsId, delivery);
    },
    onSuccess: (_, { matchId, inningsId }) => {
      queryClient.invalidateQueries({
        queryKey: ['deliveries', matchId.toString(), inningsId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ['match', matchId.toString()] });
    },
  });
}

export function useUpdateTournamentRules() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rules: TournamentRules) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.updateTournamentRules(rules);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournamentRules'] });
    },
  });
}

export function useResetAllData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not ready');
      return actor.resetAllData();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
