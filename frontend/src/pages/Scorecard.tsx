import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetDeliveriesByInnings, useGetMatch, useGetAllTeams } from '../hooks/useQueries';
import { getStoredMatches } from '../lib/matchStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, ArrowLeft } from 'lucide-react';
import QueryErrorState from '@/components/QueryErrorState';
import type { Delivery, Player } from '../backend';

function computeBattingStats(deliveries: Delivery[], players: Player[]) {
  const stats: Record<string, { runs: number; balls: number; fours: number; sixes: number; dismissed: boolean }> = {};

  for (const d of deliveries) {
    const id = d.batsmanId.toString();
    if (!stats[id]) stats[id] = { runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false };
    if (!d.isWide) {
      stats[id].balls++;
      stats[id].runs += Number(d.runs);
      if (Number(d.runs) === 4) stats[id].fours++;
      if (Number(d.runs) === 6) stats[id].sixes++;
    }
    if (d.wicket != null) stats[id].dismissed = true;
  }

  return players
    .filter(p => stats[p.id.toString()])
    .map(p => ({
      player: p,
      ...stats[p.id.toString()],
      strikeRate: stats[p.id.toString()].balls > 0
        ? ((stats[p.id.toString()].runs / stats[p.id.toString()].balls) * 100).toFixed(1)
        : '0.0',
    }));
}

function computeBowlingStats(deliveries: Delivery[], players: Player[]) {
  const stats: Record<string, { runs: number; balls: number; wickets: number; wides: number; noBalls: number }> = {};

  for (const d of deliveries) {
    const id = d.bowlerId.toString();
    if (!stats[id]) stats[id] = { runs: 0, balls: 0, wickets: 0, wides: 0, noBalls: 0 };
    stats[id].runs += Number(d.runs) + (d.isWide ? 1 : 0) + (d.isNoBall ? 1 : 0);
    if (!d.isWide && !d.isNoBall) stats[id].balls++;
    if (d.isWide) stats[id].wides++;
    if (d.isNoBall) stats[id].noBalls++;
    if (d.wicket != null) stats[id].wickets++;
  }

  return players
    .filter(p => stats[p.id.toString()])
    .map(p => {
      const s = stats[p.id.toString()];
      const overs = Math.floor(s.balls / 6) + (s.balls % 6) / 10;
      const economy = s.balls > 0 ? ((s.runs / s.balls) * 6).toFixed(2) : '0.00';
      return { player: p, ...s, overs: overs.toFixed(1), economy };
    });
}

function InningsSummary({
  inningsNum,
  battingTeamName,
  bowlingTeamName,
  deliveries,
  battingPlayers,
  bowlingPlayers,
}: {
  inningsNum: number;
  battingTeamName: string;
  bowlingTeamName: string;
  deliveries: Delivery[];
  battingPlayers: Player[];
  bowlingPlayers: Player[];
}) {
  const battingStats = computeBattingStats(deliveries, battingPlayers);
  const bowlingStats = computeBowlingStats(deliveries, bowlingPlayers);

  const totalRuns = deliveries.reduce((sum, d) =>
    sum + Number(d.runs) + (d.isWide ? 1 : 0) + (d.isNoBall ? 1 : 0), 0);
  const totalWickets = deliveries.filter(d => d.wicket != null).length;
  const legalBalls = deliveries.filter(d => !d.isWide && !d.isNoBall).length;
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;

  if (deliveries.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Innings {inningsNum} — {battingTeamName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No deliveries recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Innings {inningsNum} — {battingTeamName}</CardTitle>
          <Badge variant="secondary" className="text-sm font-bold">
            {totalRuns}/{totalWickets} ({overs}.{balls})
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Batting */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Batting</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left py-1 font-medium">Batsman</th>
                  <th className="text-right py-1 font-medium">R</th>
                  <th className="text-right py-1 font-medium">B</th>
                  <th className="text-right py-1 font-medium">4s</th>
                  <th className="text-right py-1 font-medium">6s</th>
                  <th className="text-right py-1 font-medium">SR</th>
                </tr>
              </thead>
              <tbody>
                {battingStats.map(({ player, runs, balls, fours, sixes, strikeRate, dismissed }) => (
                  <tr key={player.id.toString()} className="border-b border-muted/30">
                    <td className="py-1.5">
                      <span className="font-medium">{player.name}</span>
                      {dismissed && <span className="text-xs text-muted-foreground ml-1">(out)</span>}
                    </td>
                    <td className="text-right py-1.5 font-semibold">{runs}</td>
                    <td className="text-right py-1.5 text-muted-foreground">{balls}</td>
                    <td className="text-right py-1.5">{fours}</td>
                    <td className="text-right py-1.5">{sixes}</td>
                    <td className="text-right py-1.5 text-muted-foreground">{strikeRate}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-1.5 font-semibold text-sm" colSpan={6}>
                    Total: {totalRuns}/{totalWickets} in {overs}.{balls} overs
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <Separator />

        {/* Bowling */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Bowling</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left py-1 font-medium">Bowler</th>
                  <th className="text-right py-1 font-medium">O</th>
                  <th className="text-right py-1 font-medium">R</th>
                  <th className="text-right py-1 font-medium">W</th>
                  <th className="text-right py-1 font-medium">Eco</th>
                </tr>
              </thead>
              <tbody>
                {bowlingStats.map(({ player, overs, runs, wickets, economy }) => (
                  <tr key={player.id.toString()} className="border-b border-muted/30">
                    <td className="py-1.5 font-medium">{player.name}</td>
                    <td className="text-right py-1.5 text-muted-foreground">{overs}</td>
                    <td className="text-right py-1.5">{runs}</td>
                    <td className="text-right py-1.5 font-semibold">{wickets}</td>
                    <td className="text-right py-1.5 text-muted-foreground">{economy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Scorecard() {
  const params = useParams({ strict: false }) as { matchId?: string };
  const navigate = useNavigate();

  const resolvedMatchId = params.matchId ?? localStorage.getItem('currentMatchId') ?? '';
  const matchIdBigInt = resolvedMatchId ? BigInt(resolvedMatchId) : BigInt(0);

  const {
    data: match,
    isLoading: matchLoading,
    isError: matchError,
    error: matchErrorObj,
    refetch: refetchMatch,
  } = useGetMatch(matchIdBigInt);

  const {
    data: allTeams = [],
    isError: teamsError,
    error: teamsErrorObj,
    refetch: refetchTeams,
  } = useGetAllTeams();

  const {
    data: innings1Deliveries = [],
    isError: innings1Error,
    error: innings1ErrorObj,
    refetch: refetchInnings1,
  } = useGetDeliveriesByInnings(matchIdBigInt, BigInt(1));

  const {
    data: innings2Deliveries = [],
    isError: innings2Error,
    error: innings2ErrorObj,
    refetch: refetchInnings2,
  } = useGetDeliveriesByInnings(matchIdBigInt, BigInt(2));

  // Get match result from localStorage
  const storedMatches = getStoredMatches();
  const storedMatch = storedMatches.find(m => m.matchId === resolvedMatchId);
  const matchResult = storedMatch?.result;

  // Also check cricket_match_state for result
  let liveResult: string | null = null;
  try {
    const raw = localStorage.getItem(`cricket_match_state_${resolvedMatchId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      liveResult = parsed.matchResult ?? null;
    }
  } catch {}

  const displayResult = matchResult ?? liveResult;

  // Aggregate error state
  const hasError = matchError || teamsError || innings1Error || innings2Error;
  const firstError = matchErrorObj ?? teamsErrorObj ?? innings1ErrorObj ?? innings2ErrorObj;

  if (matchLoading) {
    return (
      <div className="pb-24 px-4 pt-4 max-w-lg mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="pb-24 px-4 pt-4 max-w-lg mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Scorecard</h1>
        </div>
        <QueryErrorState
          error={firstError}
          title="Failed to load scorecard"
          onRetry={() => {
            refetchMatch();
            refetchTeams();
            refetchInnings1();
            refetchInnings2();
          }}
        />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">No match data found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate({ to: '/' })}>
          Go Home
        </Button>
      </div>
    );
  }

  const teamA = allTeams.find(t => t.id === match.teamAId);
  const teamB = allTeams.find(t => t.id === match.teamBId);
  const teamAName = teamA?.name ?? 'Team A';
  const teamBName = teamB?.name ?? 'Team B';
  const teamAPlayers = teamA?.players ?? [];
  const teamBPlayers = teamB?.players ?? [];

  return (
    <div className="pb-24 px-4 pt-4 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Scorecard</h1>
          <p className="text-sm text-muted-foreground">{teamAName} vs {teamBName}</p>
        </div>
      </div>

      {/* Match Result */}
      {displayResult && (
        <Card className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 justify-center">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <p className="font-bold text-yellow-800 dark:text-yellow-200">{displayResult}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Innings 1 */}
      <InningsSummary
        inningsNum={1}
        battingTeamName={teamAName}
        bowlingTeamName={teamBName}
        deliveries={innings1Deliveries}
        battingPlayers={teamAPlayers}
        bowlingPlayers={teamBPlayers}
      />

      {/* Innings 2 */}
      <InningsSummary
        inningsNum={2}
        battingTeamName={teamBName}
        bowlingTeamName={teamAName}
        deliveries={innings2Deliveries}
        battingPlayers={teamBPlayers}
        bowlingPlayers={teamAPlayers}
      />

      {/* Navigation */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate({ to: '/live' })}
        >
          Back to Live Scoring
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate({ to: '/history' })}
        >
          Match History
        </Button>
      </div>
    </div>
  );
}
