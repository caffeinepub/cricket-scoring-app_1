import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Team, TeamId, Match, MatchId, MatchRules, Delivery, TournamentRules } from '../backend';

// ─── Teams ───────────────────────────────────────────────────────────────────

export function useGetAllTeams() {
  const { actor, isFetching } = useActor();

  return useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTeams();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTeam(teamId: TeamId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Team | null>({
    queryKey: ['team', teamId?.toString()],
    queryFn: async () => {
      if (!actor || teamId === null) return null;
      return actor.getTeam(teamId);
    },
    enabled: !!actor && !isFetching && teamId !== null,
  });
}

export function useAddTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, color, logo }: { name: string; color: string; logo: string }) => {
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
      teamId: TeamId;
      name: string;
      battingOrder: bigint;
      isBowler: boolean;
    }) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.addPlayer(teamId, name, battingOrder, isBowler);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId.toString()] });
    },
  });
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export function useGetMatch(matchId: MatchId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Match | null>({
    queryKey: ['match', matchId?.toString()],
    queryFn: async () => {
      if (!actor || matchId === null) return null;
      return actor.getMatch(matchId);
    },
    enabled: !!actor && !isFetching && matchId !== null,
    refetchInterval: 0,
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
    }: {
      teamAId: TeamId;
      teamBId: TeamId;
      rules: MatchRules;
    }) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.createMatch(teamAId, teamBId, rules);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useRecordDelivery(matchId: MatchId | null) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (delivery: Delivery) => {
      if (!actor || matchId === null) throw new Error('Actor not ready');
      return actor.recordDelivery(matchId, delivery);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', matchId?.toString()] });
    },
  });
}

export function useUpdateMatchRules(matchId: MatchId | null) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRules: MatchRules) => {
      if (!actor || matchId === null) throw new Error('Actor not ready');
      return actor.updateMatchRules(matchId, newRules);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', matchId?.toString()] });
    },
  });
}

// ─── Tournament Rules ─────────────────────────────────────────────────────────

export function useTournamentRules() {
  const { actor, isFetching } = useActor();

  return useQuery<TournamentRules>({
    queryKey: ['tournamentRules'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not ready');
      return actor.getTournamentRules();
    },
    enabled: !!actor && !isFetching,
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
