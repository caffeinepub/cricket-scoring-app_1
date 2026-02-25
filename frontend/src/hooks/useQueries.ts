import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "@/hooks/useActor";
import type {
  Team,
  TeamId,
  PlayerId,
  Match,
  MatchId,
  InningsId,
  MatchRules,
  Delivery,
  TournamentRules,
} from "@/backend";
import {
  clearAllMatches,
  clearAllMeta,
  clearAllLocalState,
  clearAllMatchState,
} from "@/lib/matchStore";

// ─── Teams ────────────────────────────────────────────────────────────────────

export function useGetAllTeams() {
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

// Alias for backward compat
export const useTeams = useGetAllTeams;

export function useGetTeam(teamId: TeamId | null) {
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

// Alias for backward compat
export const useTeam = useGetTeam;

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

export function useGetMatch(matchId: MatchId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Match | null>({
    queryKey: ["match", matchId?.toString()],
    queryFn: async () => {
      if (!actor || matchId === null) return null;
      return actor.getMatch(matchId);
    },
    enabled: !!actor && !isFetching && matchId !== null,
    staleTime: 0,
  });
}

// Alias for backward compat
export const useMatch = useGetMatch;

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

// ─── Deliveries ───────────────────────────────────────────────────────────────

export function useGetDeliveriesByInnings(
  matchId: MatchId | null,
  inningsId: InningsId | null
) {
  const { actor, isFetching } = useActor();
  return useQuery<Delivery[]>({
    queryKey: ["deliveries", matchId?.toString(), inningsId?.toString()],
    queryFn: async () => {
      if (!actor || matchId === null || inningsId === null) return [];
      return actor.getDeliveriesByInnings(matchId, inningsId);
    },
    enabled: !!actor && !isFetching && matchId !== null && inningsId !== null,
    staleTime: 0,
    refetchOnMount: true,
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
      if (!actor) throw new Error("Actor not initialized");
      return actor.recordDelivery(matchId, inningsId, delivery);
    },
    onSuccess: (_data, variables) => {
      // Invalidate the specific innings deliveries
      queryClient.invalidateQueries({
        queryKey: [
          "deliveries",
          variables.matchId.toString(),
          variables.inningsId.toString(),
        ],
      });
      // Invalidate all deliveries for this match
      queryClient.invalidateQueries({
        queryKey: ["deliveries", variables.matchId.toString()],
      });
      // Invalidate the match itself
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

export function useGetTournamentRules() {
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

// Alias for backward compat
export const useTournamentRules = useGetTournamentRules;

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
      clearAllMatches();
      clearAllMeta();
      clearAllLocalState();
      clearAllMatchState();
      queryClient.invalidateQueries();
    },
  });
}
