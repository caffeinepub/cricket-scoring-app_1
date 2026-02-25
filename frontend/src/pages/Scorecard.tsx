import { useParams, useSearch, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, AlertCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMatch, useTeam } from "@/hooks/useQueries";
import { getMatchMeta } from "@/lib/matchStore";
import type { BallByBallRecord, Player } from "@/backend";

export default function Scorecard() {
  // Try path params first, then search params
  let matchIdStr: string | undefined;
  try {
    const params = useParams({ strict: false });
    matchIdStr = (params as Record<string, string>)?.matchId;
  } catch {
    matchIdStr = undefined;
  }

  let searchMatchId: string | undefined;
  try {
    const search = useSearch({ strict: false });
    searchMatchId = (search as Record<string, string>)?.matchId;
  } catch {
    searchMatchId = undefined;
  }

  const resolvedMatchId = matchIdStr || searchMatchId;
  const matchIdBigInt = resolvedMatchId ? BigInt(resolvedMatchId) : null;

  const navigate = useNavigate();
  const { data: match, isLoading: matchLoading, isError: matchError } = useMatch(matchIdBigInt);

  const teamAId = match?.teamAId ?? null;
  const teamBId = match?.teamBId ?? null;

  const { data: teamA, isLoading: teamALoading } = useTeam(teamAId);
  const { data: teamB, isLoading: teamBLoading } = useTeam(teamBId);

  const matchMeta = resolvedMatchId ? getMatchMeta(resolvedMatchId) : null;

  const isLoading = matchLoading || teamALoading || teamBLoading;

  if (!resolvedMatchId) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No match ID provided.</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          <ArrowLeft size={16} className="mr-1" />
          Go Home
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (matchError || !match) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {matchError ? "Failed to load match data." : "Match not found."}
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          <ArrowLeft size={16} className="mr-1" />
          Go Home
        </Button>
      </div>
    );
  }

  const allPlayers: Player[] = [
    ...(teamA?.players ?? []),
    ...(teamB?.players ?? []),
  ];

  const getPlayerName = (id: bigint) => {
    const p = allPlayers.find((pl) => pl.id === id);
    return p?.name ?? `Player ${id}`;
  };

  const getWicketLabel = (wicket: BallByBallRecord["wicket"]) => {
    if (!wicket) return "";
    switch (wicket.__kind__) {
      case "Bowled": return "b";
      case "Caught": return "c";
      case "LBW": return "lbw";
      case "RunOut": return "run out";
      case "Stumped": return "st";
      case "HitWicket": return "hit wicket";
      case "Other": return wicket.Other ?? "out";
      default: return "out";
    }
  };

  // Compute batting stats per innings
  const computeBattingStats = (inningsDeliveries: BallByBallRecord[], battingTeamId: bigint) => {
    const stats: Record<string, { runs: number; balls: number; fours: number; sixes: number; dismissed: boolean; wicketType?: string }> = {};

    for (const d of inningsDeliveries) {
      const key = d.batsmanId.toString();
      if (!stats[key]) {
        stats[key] = { runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false };
      }
      if (!d.isWide) stats[key].balls++;
      stats[key].runs += Number(d.runs);
      if (Number(d.runs) === 4) stats[key].fours++;
      if (Number(d.runs) === 6) stats[key].sixes++;
      if (d.wicket) {
        stats[key].dismissed = true;
        stats[key].wicketType = getWicketLabel(d.wicket);
      }
    }

    return stats;
  };

  // Compute bowling stats per innings
  const computeBowlingStats = (inningsDeliveries: BallByBallRecord[]) => {
    const stats: Record<string, { overs: number; balls: number; runs: number; wickets: number; wides: number; noBalls: number }> = {};

    for (const d of inningsDeliveries) {
      const key = d.bowlerId.toString();
      if (!stats[key]) {
        stats[key] = { overs: 0, balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0 };
      }
      if (!d.isWide && !d.isNoBall) stats[key].balls++;
      stats[key].runs += Number(d.runs);
      if (d.wicket) stats[key].wickets++;
      if (d.isWide) stats[key].wides++;
      if (d.isNoBall) stats[key].noBalls++;
    }

    // Convert balls to overs
    for (const key of Object.keys(stats)) {
      const s = stats[key];
      s.overs = Math.floor(s.balls / 6);
      s.balls = s.balls % 6;
    }

    return stats;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/" })}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Scorecard</h2>
          <p className="text-sm text-muted-foreground">
            {matchMeta?.teamAName ?? teamA?.name ?? "Team A"} vs{" "}
            {matchMeta?.teamBName ?? teamB?.name ?? "Team B"}
          </p>
        </div>
        {match.isFinished && (
          <Badge className="ml-auto bg-accent text-accent-foreground">
            <Trophy size={12} className="mr-1" />
            Finished
          </Badge>
        )}
      </div>

      {/* Innings scorecards */}
      {match.innings.map((innings, idx) => {
        const battingTeam = innings.battingTeamId === match.teamAId ? teamA : teamB;
        const bowlingTeam = innings.bowlingTeamId === match.teamAId ? teamA : teamB;

        // Filter deliveries for this innings
        const inningsDeliveries = match.deliveries.filter(
          (d) => Number(d.overNumber) >= 1
        );

        // For multi-innings, split by innings index
        const inningsStart = idx === 0 ? 0 : Math.floor(match.deliveries.length / 2);
        const inningsEnd = idx === 0 ? Math.floor(match.deliveries.length / 2) : match.deliveries.length;
        const thisInningsDeliveries = match.deliveries.slice(inningsStart, inningsEnd);

        const battingStats = computeBattingStats(thisInningsDeliveries, innings.battingTeamId);
        const bowlingStats = computeBowlingStats(thisInningsDeliveries);

        const totalRuns = Number(innings.totalRuns);
        const wickets = Number(innings.wicketsLost);
        const overs = Number(innings.overs);

        return (
          <div key={innings.id.toString()} className="space-y-3">
            {/* Innings header */}
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">
                      {battingTeam?.name ?? "Team"} — Innings {idx + 1}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      vs {bowlingTeam?.name ?? "Team"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {totalRuns}/{wickets}
                    </p>
                    <p className="text-xs text-muted-foreground">{overs} overs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Batting scorecard */}
            {Object.keys(battingStats).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Batting</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batsman</TableHead>
                        <TableHead className="text-right">R</TableHead>
                        <TableHead className="text-right">B</TableHead>
                        <TableHead className="text-right">4s</TableHead>
                        <TableHead className="text-right">6s</TableHead>
                        <TableHead className="text-right">SR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(battingStats).map(([playerId, stats]) => (
                        <TableRow key={playerId}>
                          <TableCell className="font-medium text-sm">
                            <div>
                              {getPlayerName(BigInt(playerId))}
                              {stats.dismissed && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({stats.wicketType})
                                </span>
                              )}
                              {!stats.dismissed && (
                                <span className="text-xs text-green-600 ml-1">*</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold">{stats.runs}</TableCell>
                          <TableCell className="text-right">{stats.balls}</TableCell>
                          <TableCell className="text-right">{stats.fours}</TableCell>
                          <TableCell className="text-right">{stats.sixes}</TableCell>
                          <TableCell className="text-right">
                            {stats.balls > 0
                              ? ((stats.runs / stats.balls) * 100).toFixed(1)
                              : "0.0"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Bowling scorecard */}
            {Object.keys(bowlingStats).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Bowling</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bowler</TableHead>
                        <TableHead className="text-right">O</TableHead>
                        <TableHead className="text-right">R</TableHead>
                        <TableHead className="text-right">W</TableHead>
                        <TableHead className="text-right">Eco</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(bowlingStats).map(([playerId, stats]) => (
                        <TableRow key={playerId}>
                          <TableCell className="font-medium text-sm">
                            {getPlayerName(BigInt(playerId))}
                          </TableCell>
                          <TableCell className="text-right">
                            {stats.overs}.{stats.balls}
                          </TableCell>
                          <TableCell className="text-right">{stats.runs}</TableCell>
                          <TableCell className="text-right font-bold">{stats.wickets}</TableCell>
                          <TableCell className="text-right">
                            {stats.overs > 0 || stats.balls > 0
                              ? (stats.runs / (stats.overs + stats.balls / 6)).toFixed(2)
                              : "0.00"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}
