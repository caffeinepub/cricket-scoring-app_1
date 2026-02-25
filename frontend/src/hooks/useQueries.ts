import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "@/hooks/useActor";
import type {
  Team,
  TeamId,
  PlayerId,
  Match,
  MatchId,
  MatchRules,
  Delivery,
  TournamentRules,
} from "@/backend";
import {
  clearAllMatches,
  clearAllMatchMetadata,
  clearAllLiveMatchStates,
} from "@/lib/matchStore";

// ─── Teams ────────────────────────────────────────────────────────────────────

export function useTeams() {
  const { actor, isFetching } = useActor();

  return useQuery<Team[]>({
    queryKey: ["teams"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTeams();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTeam(teamId: TeamId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Team | null>({
    queryKey: ["team", teamId?.toString()],
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
    mutationFn: async ({
      name,
      color,
      logo,
    }: {
      name: string;
      color: string;
      logo: string;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.addTeam(name, color, logo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
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
      if (!actor) throw new Error("Actor not initialized");
      return actor.addPlayer(teamId, name, battingOrder, isBowler);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({
        queryKey: ["team", variables.teamId.toString()],
      });
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
      teamId: TeamId;
      squad: PlayerId[];
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.selectSquad(teamId, squad);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({
        queryKey: ["team", variables.teamId.toString()],
      });
    },
  });
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export function useMatch(matchId: MatchId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Match | null>({
    queryKey: ["match", matchId?.toString()],
    queryFn: async () => {
      if (!actor || matchId === null) return null;
      return actor.getMatch(matchId);
    },
    enabled: !!actor && !isFetching && matchId !== null,
    refetchInterval: 5000,
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
      if (!actor) throw new Error("Actor not initialized");
      return actor.createMatch(teamAId, teamBId, rules);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useRecordDelivery() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      delivery,
    }: {
      matchId: MatchId;
      delivery: Delivery;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.recordDelivery(matchId, delivery);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["match", variables.matchId.toString()],
      });
    },
  });
}

export function useUpdateMatchRules() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      rules,
    }: {
      matchId: MatchId;
      rules: MatchRules;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.updateMatchRules(matchId, rules);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["match", variables.matchId.toString()],
      });
    },
  });
}

// ─── Tournament Rules ─────────────────────────────────────────────────────────

export function useTournamentRules() {
  const { actor, isFetching } = useActor();

  return useQuery<TournamentRules | null>({
    queryKey: ["tournamentRules"],
    queryFn: async () => {
      if (!actor) return null;
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
      if (!actor) throw new Error("Actor not initialized");
      return actor.updateTournamentRules(rules);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentRules"] });
    },
  });
}

// ─── Reset All Data ───────────────────────────────────────────────────────────

export function useResetAllData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.resetAllData();
    },
    onSuccess: () => {
      // Clear all localStorage state
      clearAllMatches();
      clearAllMatchMetadata();
      clearAllLiveMatchStates();
      // Invalidate all queries
      queryClient.invalidateQueries();
    },
  });
}
