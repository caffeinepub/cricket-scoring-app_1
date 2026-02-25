import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type PlayerId = bigint;
export interface Player {
    id: PlayerId;
    battingOrder: bigint;
    name: string;
    isBowler: boolean;
}
export type WicketType = {
    __kind__: "LBW";
    LBW: null;
} | {
    __kind__: "HitWicket";
    HitWicket: null;
} | {
    __kind__: "RunOut";
    RunOut: null;
} | {
    __kind__: "Stumped";
    Stumped: null;
} | {
    __kind__: "Bowled";
    Bowled: null;
} | {
    __kind__: "Other";
    Other: string;
} | {
    __kind__: "Caught";
    Caught: null;
};
export interface BallByBallRecord {
    ballNumber: bigint;
    batsmanId: PlayerId;
    wicket?: WicketType;
    runs: bigint;
    isNoBall: boolean;
    isWide: boolean;
    overNumber: bigint;
    isFreeHit: boolean;
    bowlerId: PlayerId;
}
export interface Delivery {
    batsmanId: PlayerId;
    wicket?: WicketType;
    runs: bigint;
    isNoBall: boolean;
    isWide: boolean;
    isFreeHit: boolean;
    isBye: boolean;
    isLegBye: boolean;
    bowlerId: PlayerId;
}
export interface MatchRules {
    freeHitEnabled: boolean;
    duckworthLewisTarget?: bigint;
    maxOversPerBowler: bigint;
    oversLimit: bigint;
    powerplayOvers: Array<bigint>;
}
export interface Innings {
    id: bigint;
    bowlingTeamId: TeamId;
    deliveries: Array<Delivery>;
    overs: bigint;
    completed: boolean;
    totalRuns: bigint;
    wicketsLost: bigint;
    battingTeamId: TeamId;
}
export interface TournamentRules {
    teamReadinessPenaltyOvers: bigint;
    widesNoBallBowlerChangeThreshold: bigint;
    finalMatches: bigint;
    defaultPenaltyRuns: bigint;
    leaguePowerplayOvers: bigint;
    totalMatches: bigint;
    slowOverRatePenaltyRuns: bigint;
    maxOversBowlerShortFormat: bigint;
    leagueOvers: bigint;
    freeHitApplicable: boolean;
    lbwApplicable: boolean;
    finalOvers: bigint;
    inningsDurationMinutes: bigint;
    maxBallsPerBatsmanShortFormat: bigint;
    knockoutMatches: bigint;
    finalPowerplayOvers: bigint;
    maxFieldersOutside30Yards: bigint;
    maxOversBowlerLongFormat: bigint;
    bouncerLimitPerOver: bigint;
    teamReadinessPenaltyMinutes: bigint;
    numTeams: bigint;
    semifinalMatches: bigint;
    leagueMatches: bigint;
    timeoutDurationSeconds: bigint;
    maxBallsPerBatsmanLongFormat: bigint;
}
export interface Match {
    id: MatchId;
    isFinished: boolean;
    deliveries: Array<BallByBallRecord>;
    winner?: TeamId;
    teamAId: TeamId;
    teamBId: TeamId;
    innings: Array<Innings>;
    currentInnings: bigint;
    rules: MatchRules;
}
export type MatchId = bigint;
export type TeamId = bigint;
export interface Team {
    id: TeamId;
    logo: string;
    name: string;
    color: string;
    squad: Array<PlayerId>;
    players: Array<Player>;
}
export interface backendInterface {
    addPlayer(teamId: TeamId, name: string, battingOrder: bigint, isBowler: boolean): Promise<PlayerId>;
    addTeam(name: string, color: string, logo: string): Promise<TeamId>;
    createMatch(teamAId: TeamId, teamBId: TeamId, rules: MatchRules): Promise<MatchId>;
    getAllTeams(): Promise<Array<Team>>;
    getMatch(matchId: MatchId): Promise<Match | null>;
    getPlayerStats(teamId: TeamId, playerId: PlayerId): Promise<Player | null>;
    getTeam(teamId: TeamId): Promise<Team | null>;
    getTournamentRules(): Promise<TournamentRules>;
    recordDelivery(matchId: MatchId, delivery: Delivery): Promise<void>;
    resetAllData(): Promise<void>;
    selectSquad(teamId: TeamId, squad: Array<PlayerId>): Promise<void>;
    updateMatchRules(matchId: MatchId, newRules: MatchRules): Promise<void>;
    updateTournamentRules(rules: TournamentRules): Promise<void>;
}
