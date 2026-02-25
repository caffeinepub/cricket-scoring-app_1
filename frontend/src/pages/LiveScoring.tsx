import { useState } from "react";
import { useParams, useSearch, useNavigate } from "@tanstack/react-router";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useMatch, useTeam, useRecordDelivery } from "@/hooks/useQueries";
import { useMatchState } from "@/hooks/useMatchState";
import EndOfOverModal from "@/components/EndOfOverModal";
import WicketModal from "@/components/WicketModal";
import EndOfInningsModal from "@/components/EndOfInningsModal";
import type { WicketType } from "@/backend";

export default function LiveScoring() {
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

  const recordDelivery = useRecordDelivery();

  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showEndOfOverModal, setShowEndOfOverModal] = useState(false);
  const [showEndOfInningsModal, setShowEndOfInningsModal] = useState(false);

  // useMatchState takes exactly 3 args: matchId, teamA, teamB
  const matchState = useMatchState(
    resolvedMatchId ?? "",
    teamA ?? null,
    teamB ?? null
  );

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
        <Skeleton className="h-48 w-full rounded-lg" />
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

  const currentInningsData = match.innings[Number(match.currentInnings) - 1];
  const battingTeamId = currentInningsData?.battingTeamId;
  const bowlingTeamId = currentInningsData?.bowlingTeamId;

  const battingTeam = battingTeamId === match.teamAId ? teamA : teamB;
  const bowlingTeam = bowlingTeamId === match.teamAId ? teamA : teamB;

  const battingTeamPlayers: bigint[] = battingTeamId === match.teamAId
    ? (teamA?.squad ?? [])
    : (teamB?.squad ?? []);
  const bowlingTeamPlayers: bigint[] = bowlingTeamId === match.teamAId
    ? (teamA?.squad ?? [])
    : (teamB?.squad ?? []);

  const allPlayers = [
    ...(teamA?.players ?? []),
    ...(teamB?.players ?? []),
  ];

  const getPlayerName = (id: bigint) => {
    const p = allPlayers.find((pl) => pl.id === id);
    return p?.name ?? `Player ${id}`;
  };

  const handleDelivery = async (
    runs: number,
    extras: { isWide?: boolean; isNoBall?: boolean; isBye?: boolean; isLegBye?: boolean },
    wicket?: WicketType
  ) => {
    if (!matchState.strikerId || !matchState.bowlerId || !matchIdBigInt) return;

    await recordDelivery.mutateAsync({
      matchId: matchIdBigInt,
      delivery: {
        batsmanId: matchState.strikerId,
        bowlerId: matchState.bowlerId,
        runs: BigInt(runs),
        isWide: extras.isWide ?? false,
        isNoBall: extras.isNoBall ?? false,
        isBye: extras.isBye ?? false,
        isLegBye: extras.isLegBye ?? false,
        isFreeHit: false,
        wicket,
      },
    });

    // Rotate strike on odd runs (not wide)
    if (runs % 2 !== 0 && !extras.isWide) {
      matchState.swapBatsmen();
    }
  };

  const totalRuns = Number(currentInningsData?.totalRuns ?? 0);
  const wickets = Number(currentInningsData?.wicketsLost ?? 0);
  const overs = Number(currentInningsData?.overs ?? 0);
  const legalBallsInOver = matchState.legalBalls % 6;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {battingTeam?.name ?? "Team A"} vs {bowlingTeam?.name ?? "Team B"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Innings {Number(match.currentInnings)} • Live
          </p>
        </div>
        <Badge variant="default" className="bg-accent text-accent-foreground animate-pulse">
          LIVE
        </Badge>
      </div>

      {/* Score card */}
      <Card>
        <CardContent className="pt-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-foreground">
              {totalRuns}/{wickets}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {overs}.{legalBallsInOver} overs
            </p>
          </div>
          <div className="flex justify-between mt-4 text-sm">
            <div>
              <p className="text-muted-foreground">Striker</p>
              <p className="font-medium">
                {matchState.strikerId ? getPlayerName(matchState.strikerId) : "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Bowler</p>
              <p className="font-medium">
                {matchState.bowlerId ? getPlayerName(matchState.bowlerId) : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring buttons */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Score Delivery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Run buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3, 4, 6].map((runs) => (
              <Button
                key={runs}
                variant={runs === 4 || runs === 6 ? "default" : "outline"}
                className={runs === 6 ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
                onClick={() => handleDelivery(runs, {})}
                disabled={recordDelivery.isPending}
              >
                {runs === 0 ? "Dot" : runs}
              </Button>
            ))}
          </div>

          {/* Extras */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelivery(1, { isWide: true })}
              disabled={recordDelivery.isPending}
            >
              Wide
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelivery(1, { isNoBall: true })}
              disabled={recordDelivery.isPending}
            >
              No Ball
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowWicketModal(true)}
              disabled={recordDelivery.isPending}
            >
              Wicket
            </Button>
          </div>

          {/* End of over / innings buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEndOfOverModal(true)}
              disabled={recordDelivery.isPending}
            >
              End of Over
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEndOfInningsModal(true)}
              disabled={recordDelivery.isPending}
            >
              End Innings
            </Button>
          </div>

          {recordDelivery.isPending && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              Recording...
            </div>
          )}

          {recordDelivery.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {recordDelivery.error instanceof Error
                  ? recordDelivery.error.message
                  : "Failed to record delivery"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Modals — use onClose prop (not onOpenChange) */}
      {showWicketModal && matchState.strikerId && (
        <WicketModal
          open={showWicketModal}
          onClose={() => setShowWicketModal(false)}
          battingTeamPlayers={battingTeamPlayers}
          allPlayers={allPlayers}
          dismissedBatsmanId={matchState.strikerId}
          onConfirm={(wicketType, nextBatsmanId) => {
            handleDelivery(0, {}, wicketType);
            matchState.setStrikerId(nextBatsmanId);
            setShowWicketModal(false);
          }}
        />
      )}

      {showEndOfOverModal && (
        <EndOfOverModal
          open={showEndOfOverModal}
          onClose={() => setShowEndOfOverModal(false)}
          bowlingTeamPlayers={bowlingTeamPlayers}
          allPlayers={allPlayers}
          currentBowlerId={matchState.bowlerId}
          onConfirm={(nextBowlerId) => {
            matchState.setBowlerId(nextBowlerId);
            matchState.swapBatsmen();
            setShowEndOfOverModal(false);
          }}
        />
      )}

      {showEndOfInningsModal && (
        <EndOfInningsModal
          open={showEndOfInningsModal}
          onClose={() => setShowEndOfInningsModal(false)}
          battingTeamPlayers={bowlingTeamPlayers}
          bowlingTeamPlayers={battingTeamPlayers}
          allPlayers={allPlayers}
          onConfirm={(openerId1, openerId2, newBowlerId) => {
            matchState.setStrikerId(openerId1);
            matchState.setNonStrikerId(openerId2);
            matchState.setBowlerId(newBowlerId);
            setShowEndOfInningsModal(false);
          }}
        />
      )}
    </div>
  );
}
