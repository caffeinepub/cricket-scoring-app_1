import { useState } from 'react';
import { useParams, useRouter } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useGetMatch, useGetAllTeams } from '../hooks/useQueries';
import { calcBatsmanStats, calcBowlerStats, formatOvers, getWicketLabel } from '../lib/matchUtils';
import type { BallByBallRecord, Team } from '../backend';

function BattingScorecardTable({
  deliveries,
  battingTeam,
}: {
  deliveries: BallByBallRecord[];
  battingTeam: Team | null;
}) {
  if (!battingTeam) return <p className="text-sm text-muted-foreground p-4">No data available.</p>;

  const playerStats = battingTeam.players.map(p =>
    calcBatsmanStats(deliveries, p.id, p.name)
  ).filter(s => s.balls > 0 || s.isOut);

  if (playerStats.length === 0) {
    return <p className="text-sm text-muted-foreground p-4 text-center">No batting data yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-cricket-green/10">
            <TableHead className="font-semibold text-xs">Batsman</TableHead>
            <TableHead className="text-right text-xs font-semibold">R</TableHead>
            <TableHead className="text-right text-xs font-semibold">B</TableHead>
            <TableHead className="text-right text-xs font-semibold">4s</TableHead>
            <TableHead className="text-right text-xs font-semibold">6s</TableHead>
            <TableHead className="text-right text-xs font-semibold">SR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {playerStats.map((s, idx) => (
            <TableRow key={s.playerId.toString()} className={idx % 2 === 0 ? '' : 'bg-muted/30'}>
              <TableCell className="py-2">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  {s.isOut && (
                    <p className="text-xs text-muted-foreground">{s.dismissal}</p>
                  )}
                  {!s.isOut && s.balls > 0 && (
                    <Badge variant="outline" className="text-[10px] py-0 px-1 border-cricket-green text-cricket-green">
                      not out
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-display font-bold">{s.runs}</TableCell>
              <TableCell className="text-right text-sm">{s.balls}</TableCell>
              <TableCell className="text-right text-sm">{s.fours}</TableCell>
              <TableCell className="text-right text-sm">{s.sixes}</TableCell>
              <TableCell className="text-right text-sm">{s.strikeRate}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function BowlingScorecardTable({
  deliveries,
  bowlingTeam,
}: {
  deliveries: BallByBallRecord[];
  bowlingTeam: Team | null;
}) {
  if (!bowlingTeam) return <p className="text-sm text-muted-foreground p-4">No data available.</p>;

  const bowlerStats = bowlingTeam.players.map(p =>
    calcBowlerStats(deliveries, p.id, p.name)
  ).filter(s => s.runs > 0 || s.wickets > 0 || s.overs !== '0.0');

  if (bowlerStats.length === 0) {
    return <p className="text-sm text-muted-foreground p-4 text-center">No bowling data yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-cricket-green/10">
            <TableHead className="font-semibold text-xs">Bowler</TableHead>
            <TableHead className="text-right text-xs font-semibold">O</TableHead>
            <TableHead className="text-right text-xs font-semibold">M</TableHead>
            <TableHead className="text-right text-xs font-semibold">R</TableHead>
            <TableHead className="text-right text-xs font-semibold">W</TableHead>
            <TableHead className="text-right text-xs font-semibold">Eco</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bowlerStats.map((s, idx) => (
            <TableRow key={s.playerId.toString()} className={idx % 2 === 0 ? '' : 'bg-muted/30'}>
              <TableCell className="py-2 text-sm font-medium">{s.name}</TableCell>
              <TableCell className="text-right text-sm">{s.overs}</TableCell>
              <TableCell className="text-right text-sm">{s.maidens}</TableCell>
              <TableCell className="text-right text-sm">{s.runs}</TableCell>
              <TableCell className="text-right font-display font-bold">{s.wickets}</TableCell>
              <TableCell className="text-right text-sm">{s.economy}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ExtrasRow({ deliveries }: { deliveries: BallByBallRecord[] }) {
  const wides = deliveries.filter(d => d.isWide).length;
  const noBalls = deliveries.filter(d => d.isNoBall).length;
  const total = wides + noBalls;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-muted/30 rounded-lg text-sm">
      <span className="font-medium">Extras</span>
      <div className="flex gap-3 text-muted-foreground text-xs">
        <span>Wd: {wides}</span>
        <span>Nb: {noBalls}</span>
        <span className="font-semibold text-foreground">Total: {total}</span>
      </div>
    </div>
  );
}

export default function Scorecard() {
  const { matchId } = useParams({ from: '/scorecard/$matchId' });
  const router = useRouter();
  const { data: match, isLoading } = useGetMatch(matchId ? BigInt(matchId) : null);
  const { data: teams = [] } = useGetAllTeams();

  const teamA = match ? teams.find(t => t.id === match.teamAId) ?? null : null;
  const teamB = match ? teams.find(t => t.id === match.teamBId) ?? null : null;

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <div className="h-12 bg-muted rounded-lg animate-pulse" />
        <div className="h-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-48 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-4 text-center py-16">
        <p className="text-muted-foreground">Match not found.</p>
        <Button
          onClick={() => router.navigate({ to: '/history' })}
          className="mt-4 bg-cricket-green text-cricket-cream"
        >
          Back to History
        </Button>
      </div>
    );
  }

  const totalRuns = match.deliveries.reduce((s, d) => s + Number(d.runs), 0);
  const wickets = match.deliveries.filter(d => d.wicket !== undefined && d.wicket !== null).length;
  const legalBalls = match.deliveries.filter(d => !d.isWide && !d.isNoBall).length;

  // For a 2-innings match, all deliveries are in one flat array
  // We use the innings array to determine split point
  const innings1Overs = match.innings[0] ? Number(match.innings[0].overs) : 0;
  const innings1Balls = innings1Overs * 6;

  // Split deliveries by innings based on overNumber
  const maxOverInnings1 = match.innings[0] ? Number(match.innings[0].overs) : 999;
  const innings1Deliveries = match.deliveries.filter(d => Number(d.overNumber) <= maxOverInnings1);
  const innings2Deliveries = match.deliveries.filter(d => Number(d.overNumber) > maxOverInnings1);

  const innings1BattingTeam = teamA;
  const innings1BowlingTeam = teamB;
  const innings2BattingTeam = teamB;
  const innings2BowlingTeam = teamA;

  const innings1Runs = innings1Deliveries.reduce((s, d) => s + Number(d.runs), 0);
  const innings1Wickets = innings1Deliveries.filter(d => d.wicket).length;
  const innings1LegalBalls = innings1Deliveries.filter(d => !d.isWide && !d.isNoBall).length;

  const innings2Runs = innings2Deliveries.reduce((s, d) => s + Number(d.runs), 0);
  const innings2Wickets = innings2Deliveries.filter(d => d.wicket).length;
  const innings2LegalBalls = innings2Deliveries.filter(d => !d.isWide && !d.isNoBall).length;

  const hasSecondInnings = innings2Deliveries.length > 0;

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.navigate({ to: '/history' })}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h2 className="font-display text-xl font-bold">Scorecard</h2>
          <p className="text-xs text-muted-foreground">
            {teamA?.name ?? 'Team A'} vs {teamB?.name ?? 'Team B'}
          </p>
        </div>
      </div>

      {/* Match summary scoreboard */}
      <div className="bg-scoreboard-bg rounded-xl shadow-scoreboard p-4">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <p className="text-cricket-cream/60 text-xs mb-1">{teamA?.name ?? 'Team A'}</p>
            <p className="scoreboard-text text-3xl text-cricket-cream">
              {innings1Runs}/{innings1Wickets}
            </p>
            <p className="text-cricket-cream/60 text-xs">({formatOvers(innings1LegalBalls)})</p>
          </div>
          <div className="text-cricket-cream/40 text-lg font-bold px-4">vs</div>
          <div className="text-center flex-1">
            <p className="text-cricket-cream/60 text-xs mb-1">{teamB?.name ?? 'Team B'}</p>
            {hasSecondInnings ? (
              <>
                <p className="scoreboard-text text-3xl text-cricket-cream">
                  {innings2Runs}/{innings2Wickets}
                </p>
                <p className="text-cricket-cream/60 text-xs">({formatOvers(innings2LegalBalls)})</p>
              </>
            ) : (
              <p className="text-cricket-cream/40 text-sm">Yet to bat</p>
            )}
          </div>
        </div>
        {match.isFinished && match.winner !== undefined && match.winner !== null && (
          <div className="mt-3 text-center">
            <Badge className="bg-cricket-gold text-white text-xs">
              {match.winner === match.teamAId ? teamA?.name : teamB?.name} won
            </Badge>
          </div>
        )}
        {!match.isFinished && (
          <div className="mt-3 text-center">
            <Badge variant="outline" className="border-cricket-cream/30 text-cricket-cream/70 text-xs">
              In Progress
            </Badge>
          </div>
        )}
      </div>

      {/* Innings tabs */}
      <Tabs defaultValue="innings1">
        <TabsList className="w-full bg-muted">
          <TabsTrigger value="innings1" className="flex-1 data-[state=active]:bg-cricket-green data-[state=active]:text-cricket-cream">
            1st Innings – {teamA?.name ?? 'Team A'}
          </TabsTrigger>
          <TabsTrigger
            value="innings2"
            className="flex-1 data-[state=active]:bg-cricket-green data-[state=active]:text-cricket-cream"
            disabled={!hasSecondInnings}
          >
            2nd Innings – {teamB?.name ?? 'Team B'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="innings1" className="space-y-3 mt-3">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Batting – {innings1BattingTeam?.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <BattingScorecardTable
                deliveries={innings1Deliveries}
                battingTeam={innings1BattingTeam}
              />
              <div className="px-3 pb-1">
                <ExtrasRow deliveries={innings1Deliveries} />
              </div>
              <div className="flex items-center justify-between px-4 py-2 border-t">
                <span className="font-display font-bold">Total</span>
                <span className="font-display font-bold text-lg">
                  {innings1Runs}/{innings1Wickets} ({formatOvers(innings1LegalBalls)} ov)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Bowling – {innings1BowlingTeam?.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <BowlingScorecardTable
                deliveries={innings1Deliveries}
                bowlingTeam={innings1BowlingTeam}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="innings2" className="space-y-3 mt-3">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Batting – {innings2BattingTeam?.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <BattingScorecardTable
                deliveries={innings2Deliveries}
                battingTeam={innings2BattingTeam}
              />
              <div className="px-3 pb-1">
                <ExtrasRow deliveries={innings2Deliveries} />
              </div>
              <div className="flex items-center justify-between px-4 py-2 border-t">
                <span className="font-display font-bold">Total</span>
                <span className="font-display font-bold text-lg">
                  {innings2Runs}/{innings2Wickets} ({formatOvers(innings2LegalBalls)} ov)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Bowling – {innings2BowlingTeam?.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <BowlingScorecardTable
                deliveries={innings2Deliveries}
                bowlingTeam={innings2BowlingTeam}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resume button if in progress */}
      {!match.isFinished && (
        <Button
          onClick={() => router.navigate({ to: `/match/${matchId}` })}
          className="w-full bg-cricket-green text-cricket-cream hover:bg-cricket-green-dark"
        >
          Resume Match
        </Button>
      )}
    </div>
  );
}
