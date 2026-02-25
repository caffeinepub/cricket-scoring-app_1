import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RotateCcw, Trophy, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { useMatchState } from '@/hooks/useMatchState';
import { useGetDeliveriesByInnings, useRecordDelivery, useGetAllTeams, useGetMatch } from '@/hooks/useQueries';
import { getMatchMeta } from '@/lib/matchStore';
import WicketModal from '@/components/WicketModal';
import EndOfOverModal from '@/components/EndOfOverModal';
import EndOfInningsModal from '@/components/EndOfInningsModal';
import ScoreDisplay from '@/components/ScoreDisplay';
import OverTimeline from '@/components/OverTimeline';
import BatsmanStatsPanel from '@/components/BatsmanStatsPanel';
import BowlerStatsPanel from '@/components/BowlerStatsPanel';
import QueryErrorState from '@/components/QueryErrorState';
import type { Delivery, WicketType, Player } from '@/backend';

type DeliveryExtra = 'none' | 'wide' | 'noBall' | 'bye' | 'legBye';

function isLegalDelivery(d: Delivery): boolean {
  return !d.isWide && !d.isNoBall;
}

function computeBatsmanStats(playerId: bigint, deliveries: Delivery[]) {
  const faced = deliveries.filter(d => d.batsmanId === playerId && !d.isWide);
  const runs = faced.reduce((s, d) => s + Number(d.runs), 0);
  const balls = faced.filter(d => !d.isWide && !d.isNoBall).length;
  const fours = faced.filter(d => Number(d.runs) === 4 && !d.isBye && !d.isLegBye).length;
  const sixes = faced.filter(d => Number(d.runs) === 6 && !d.isBye && !d.isLegBye).length;
  return { playerId, runs, balls, fours, sixes };
}

function computeBowlerStats(playerId: bigint, deliveries: Delivery[]) {
  const bowled = deliveries.filter(d => d.bowlerId === playerId);
  const legalBalls = bowled.filter(isLegalDelivery).length;
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  const runs = bowled.reduce((s, d) => {
    if (d.isBye || d.isLegBye) return s;
    return s + Number(d.runs) + (d.isWide ? 1 : 0) + (d.isNoBall ? 1 : 0);
  }, 0);
  const wickets = bowled.filter(d => d.wicket != null && d.wicket.__kind__ !== 'RunOut').length;
  const maidens = 0;
  return { playerId, overs, balls, maidens, runs, wickets };
}

export default function LiveScoring() {
  const navigate = useNavigate();

  const currentMatchId = localStorage.getItem('currentMatchId') ?? '';
  const meta = currentMatchId ? getMatchMeta(currentMatchId) : null;

  const {
    strikerId,
    nonStrikerId,
    bowlerId,
    currentInnings,
    isMatchOver,
    matchResult,
    setStrikerId,
    setNonStrikerId,
    setBowlerId,
    swapBatsmen,
    startNextInnings,
    endMatch,
  } = useMatchState();

  const {
    data: allTeams = [],
    isError: teamsError,
    error: teamsErrorObj,
    refetch: refetchTeams,
  } = useGetAllTeams();

  const {
    data: match,
    isError: matchError,
    error: matchErrorObj,
    refetch: refetchMatch,
  } = useGetMatch(currentMatchId ? BigInt(currentMatchId) : null);

  const {
    data: deliveries = [],
    isError: deliveriesError,
    error: deliveriesErrorObj,
    refetch: refetchDeliveries,
  } = useGetDeliveriesByInnings(
    currentMatchId ? BigInt(currentMatchId) : null,
    BigInt(currentInnings)
  );

  const recordDeliveryMutation = useRecordDelivery();

  const oversLimit = match ? Number(match.rules.oversLimit) : 20;

  // UI state
  const [runs, setRuns] = useState(0);
  const [extra, setExtra] = useState<DeliveryExtra>('none');
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showEndOfOverModal, setShowEndOfOverModal] = useState(false);
  const [showEndOfInningsModal, setShowEndOfInningsModal] = useState(false);
  const [showOpenerModal, setShowOpenerModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const lastDeliveryWasOddRunRef = useRef(false);

  const legalDeliveries = deliveries.filter(isLegalDelivery);
  const legalBallsInCurrentOver = legalDeliveries.length % 6;
  const completedOvers = Math.floor(legalDeliveries.length / 6);
  const totalRuns = deliveries.reduce((sum, d) => {
    return sum + Number(d.runs) + (d.isWide ? 1 : 0) + (d.isNoBall ? 1 : 0);
  }, 0);
  const wickets = deliveries.filter(d => d.wicket != null).length;
  const oversDisplay = `${completedOvers}.${legalBallsInCurrentOver}`;

  const isInningsComplete = wickets >= 10 || completedOvers >= oversLimit;

  const teamA = allTeams.find(t => match && t.id === match.teamAId);
  const teamB = allTeams.find(t => match && t.id === match.teamBId);
  const battingTeam = currentInnings === 1 ? teamA : teamB;
  const bowlingTeam = currentInnings === 1 ? teamB : teamA;

  const battingPlayingEleven: bigint[] = currentInnings === 1
    ? (meta?.teamAPlayingEleven ?? [])
    : (meta?.teamBPlayingEleven ?? []);
  const bowlingPlayingEleven: bigint[] = currentInnings === 1
    ? (meta?.teamBPlayingEleven ?? [])
    : (meta?.teamAPlayingEleven ?? []);

  const allBattingPlayers: Player[] = battingTeam?.players ?? [];
  const allBowlingPlayers: Player[] = bowlingTeam?.players ?? [];
  // Combined player list for modals that need all players
  const allPlayers: Player[] = [...(teamA?.players ?? []), ...(teamB?.players ?? [])];

  const teamAName = teamA?.name ?? 'Team A';
  const teamBName = teamB?.name ?? 'Team B';
  const battingTeamName = currentInnings === 1 ? teamAName : teamBName;
  const bowlingTeamName = currentInnings === 1 ? teamBName : teamAName;

  const strikerStats = strikerId != null ? computeBatsmanStats(strikerId, deliveries) : null;
  const nonStrikerStats = nonStrikerId != null ? computeBatsmanStats(nonStrikerId, deliveries) : null;
  const bowlerStats = bowlerId != null ? computeBowlerStats(bowlerId, deliveries) : null;

  // Innings 1 score for target calculation
  const innings1Runs = Number(match?.innings?.[0]?.totalRuns ?? 0);
  const target = currentInnings === 2 ? innings1Runs + 1 : undefined;
  const runsRequired = target != null ? target - totalRuns : undefined;

  useEffect(() => {
    if (!currentMatchId) return;
    if (isMatchOver) return;
    if (strikerId == null || nonStrikerId == null || bowlerId == null) {
      setShowOpenerModal(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMatchId, currentInnings]);

  const prevLegalCountRef = useRef(-1);
  useEffect(() => {
    const curr = legalDeliveries.length;
    if (prevLegalCountRef.current === -1) {
      prevLegalCountRef.current = curr;
      return;
    }
    if (curr === 0) {
      prevLegalCountRef.current = 0;
      return;
    }
    if (curr % 6 === 0 && curr !== prevLegalCountRef.current && !isMatchOver && !isInningsComplete) {
      setShowEndOfOverModal(true);
    }
    prevLegalCountRef.current = curr;
  }, [legalDeliveries.length, isMatchOver, isInningsComplete]);

  const prevInningsCompleteRef = useRef(false);
  useEffect(() => {
    if (prevInningsCompleteRef.current === isInningsComplete) return;
    prevInningsCompleteRef.current = isInningsComplete;
    if (!isInningsComplete || isMatchOver) return;

    if (currentInnings === 1) {
      setShowEndOfInningsModal(true);
    } else {
      const runsShort = (innings1Runs + 1) - totalRuns - 1;
      const result = runsShort > 0
        ? `${teamAName} wins by ${runsShort} run${runsShort !== 1 ? 's' : ''}`
        : `${teamBName} wins (scores level)`;
      endMatch(result);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInningsComplete]);

  const handleRecordDelivery = useCallback(async (wicketType?: WicketType) => {
    if (!currentMatchId || !strikerId || !bowlerId) return;
    if (isRecording) return;

    setIsRecording(true);
    try {
      const isWide = extra === 'wide';
      const isNoBall = extra === 'noBall';
      const isBye = extra === 'bye';
      const isLegBye = extra === 'legBye';
      const isLegal = !isWide && !isNoBall;

      const delivery: Delivery = {
        batsmanId: strikerId,
        bowlerId: bowlerId,
        runs: BigInt(runs),
        isWide,
        isNoBall,
        isBye,
        isLegBye,
        isFreeHit: false,
        wicket: wicketType,
      };

      await recordDeliveryMutation.mutateAsync({
        matchId: BigInt(currentMatchId),
        inningsId: BigInt(currentInnings),
        delivery,
      });

      if (isLegal && !wicketType && runs % 2 === 1) {
        swapBatsmen();
        lastDeliveryWasOddRunRef.current = true;
      } else {
        lastDeliveryWasOddRunRef.current = false;
      }

      setRuns(0);
      setExtra('none');

      await refetchDeliveries();
    } catch (err) {
      console.error('Failed to record delivery', err);
    } finally {
      setIsRecording(false);
    }
  }, [currentMatchId, strikerId, bowlerId, runs, extra, currentInnings, isRecording, recordDeliveryMutation, swapBatsmen, refetchDeliveries]);

  const handleWicketConfirm = useCallback(async (wicketType: WicketType, newBatsmanId: bigint) => {
    setShowWicketModal(false);
    await handleRecordDelivery(wicketType);
    setStrikerId(newBatsmanId);
  }, [handleRecordDelivery, setStrikerId]);

  const handleEndOfOverConfirm = useCallback((newBowlerId: bigint) => {
    setShowEndOfOverModal(false);
    setBowlerId(newBowlerId);
    if (!lastDeliveryWasOddRunRef.current) {
      swapBatsmen();
    }
    lastDeliveryWasOddRunRef.current = false;
  }, [setBowlerId, swapBatsmen]);

  const handleStartNextInnings = useCallback((
    newStrikerId: bigint,
    newNonStrikerId: bigint,
    newBowlerId: bigint
  ) => {
    setShowEndOfInningsModal(false);
    startNextInnings(newStrikerId, newNonStrikerId, newBowlerId);
    setTimeout(() => refetchDeliveries(), 100);
  }, [startNextInnings, refetchDeliveries]);

  const handleOpenerConfirm = useCallback((
    newStrikerId: bigint,
    newNonStrikerId: bigint,
    newBowlerId: bigint
  ) => {
    setShowOpenerModal(false);
    setStrikerId(newStrikerId);
    setNonStrikerId(newNonStrikerId);
    setBowlerId(newBowlerId);
  }, [setStrikerId, setNonStrikerId, setBowlerId]);

  if (!currentMatchId || !meta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No active match found. Please set up a match first.</AlertDescription>
        </Alert>
        <Button onClick={() => navigate({ to: '/setup' })}>Go to Setup</Button>
      </div>
    );
  }

  // Show backend error state if critical queries fail
  if (teamsError || matchError) {
    const err = teamsErrorObj ?? matchErrorObj;
    return (
      <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-foreground">Live Scoring</h2>
        <QueryErrorState
          error={err}
          title="Failed to load match data"
          onRetry={() => {
            refetchTeams();
            refetchMatch();
            refetchDeliveries();
          }}
        />
      </div>
    );
  }

  const dismissedBatsmanIds = deliveries
    .filter(d => d.wicket != null)
    .map(d => d.batsmanId);

  // Available next batsmen: in playing 11, not currently at crease, not dismissed
  const availableNextBatsmen = battingPlayingEleven.filter(
    pid => pid !== strikerId && pid !== nonStrikerId && !dismissedBatsmanIds.includes(pid)
  );

  const canRecord = strikerId != null && nonStrikerId != null && bowlerId != null && !isMatchOver;

  // Score string for innings summary display
  const innings1ScoreSummary = `${innings1Runs}/${Number(match?.innings?.[0]?.wicketsLost ?? 0)}`;

  return (
    <div className="flex flex-col gap-3 p-3 pb-24 max-w-lg mx-auto">
      {/* Match result banner */}
      {isMatchOver && matchResult && (
        <Card className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 justify-center">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <p className="font-bold text-yellow-800 dark:text-yellow-200">{matchResult}</p>
            </div>
            <div className="flex gap-2 mt-3 justify-center">
              <Button size="sm" onClick={() => navigate({ to: '/scorecard' })}>
                View Scorecard
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate({ to: '/history' })}>
                Match History
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score Display */}
      <ScoreDisplay
        battingTeamName={battingTeamName}
        bowlingTeamName={bowlingTeamName}
        runs={totalRuns}
        wickets={wickets}
        overs={oversDisplay}
        oversLimit={oversLimit}
        innings={currentInnings}
        target={target}
        runsRequired={runsRequired}
        innings1Summary={currentInnings === 2 ? `${teamAName}: ${innings1ScoreSummary}` : undefined}
      />

      {/* Over Timeline */}
      <OverTimeline deliveries={deliveries} currentOver={completedOvers} />

      {/* Batsman Stats */}
      {(strikerStats || nonStrikerStats) && (
        <BatsmanStatsPanel
          striker={strikerStats}
          nonStriker={nonStrikerStats}
          players={allBattingPlayers}
        />
      )}

      {/* Bowler Stats */}
      {bowlerStats && (
        <BowlerStatsPanel
          bowler={bowlerStats}
          players={allBowlingPlayers}
        />
      )}

      {/* Delivery error */}
      {deliveriesError && (
        <QueryErrorState
          error={deliveriesErrorObj}
          title="Failed to load deliveries"
          onRetry={() => refetchDeliveries()}
        />
      )}

      {/* Record delivery error */}
      {recordDeliveryMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to record delivery. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Scoring Controls */}
      {!isMatchOver && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            {/* Runs */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Runs</p>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                  <Button
                    key={r}
                    variant={runs === r ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRuns(r)}
                    className="h-10 text-base font-bold"
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>

            {/* Extras */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Extra</p>
              <div className="grid grid-cols-3 gap-2">
                {(['none', 'wide', 'noBall', 'bye', 'legBye'] as DeliveryExtra[]).map((e) => (
                  <Button
                    key={e}
                    variant={extra === e ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExtra(e)}
                    className="text-xs"
                  >
                    {e === 'none' ? 'None' : e === 'noBall' ? 'No Ball' : e === 'legBye' ? 'Leg Bye' : e.charAt(0).toUpperCase() + e.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={!canRecord || isRecording}
                onClick={() => handleRecordDelivery()}
              >
                {isRecording ? (
                  <Loader2 size={14} className="mr-1 animate-spin" />
                ) : null}
                Record
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={!canRecord || isRecording}
                onClick={() => setShowWicketModal(true)}
                title="Wicket"
              >
                <RotateCcw size={16} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={!canRecord || isRecording}
                onClick={() => swapBatsmen()}
                title="Swap batsmen"
              >
                <ArrowLeftRight size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wicket Modal */}
      <WicketModal
        open={showWicketModal}
        onClose={() => setShowWicketModal(false)}
        onConfirm={handleWicketConfirm}
        dismissedBatsmanId={strikerId ?? BigInt(0)}
        battingTeamPlayers={battingPlayingEleven}
        allPlayers={allPlayers}
      />

      {/* End of Over Modal */}
      <EndOfOverModal
        isOpen={showEndOfOverModal}
        onClose={() => setShowEndOfOverModal(false)}
        onConfirm={handleEndOfOverConfirm}
        currentBowlerId={bowlerId}
        bowlingTeamPlayers={bowlingPlayingEleven}
        allPlayers={allPlayers}
        overNumber={completedOvers}
      />

      {/* End of Innings / Opener Selection Modal */}
      <EndOfInningsModal
        isOpen={showEndOfInningsModal || showOpenerModal}
        onClose={() => {
          setShowEndOfInningsModal(false);
          setShowOpenerModal(false);
        }}
        onConfirm={showEndOfInningsModal ? handleStartNextInnings : handleOpenerConfirm}
        inningsNumber={currentInnings}
        battingTeamPlayers={battingPlayingEleven}
        bowlingTeamPlayers={bowlingPlayingEleven}
        allPlayers={allPlayers}
        score={`${totalRuns}/${wickets} (${oversDisplay})`}
        isOpenerSelection={showOpenerModal && !showEndOfInningsModal}
      />
    </div>
  );
}
