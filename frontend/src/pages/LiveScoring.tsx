import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@tanstack/react-router';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetAllTeams, useRecordDelivery } from '../hooks/useQueries';
import { useMatchState } from '../hooks/useMatchState';
import ScoreDisplay from '../components/ScoreDisplay';
import BatsmanStatsPanel from '../components/BatsmanStatsPanel';
import BowlerStatsPanel from '../components/BowlerStatsPanel';
import OverTimeline from '../components/OverTimeline';
import WicketModal from '../components/WicketModal';
import EndOfOverModal from '../components/EndOfOverModal';
import EndOfInningsModal from '../components/EndOfInningsModal';
import { formatOvers } from '../lib/matchUtils';
import { saveLocalMatchState, updateMatchFinished } from '../lib/matchStore';
import type { WicketType, Delivery, Team } from '../backend';

const RUN_BUTTONS = [0, 1, 2, 3, 4, 6];

export default function LiveScoring() {
  const { matchId } = useParams({ from: '/match/$matchId' });
  const router = useRouter();
  const { data: teams = [] } = useGetAllTeams();

  const [matchTeamA, setMatchTeamA] = useState<Team | null>(null);
  const [matchTeamB, setMatchTeamB] = useState<Team | null>(null);

  const matchState = useMatchState(matchId, matchTeamA, matchTeamB);
  const {
    match,
    isLoading,
    strikerId,
    nonStrikerId,
    bowlerId,
    setStrikerId,
    setNonStrikerId,
    setBowlerId,
    swapBatsmen,
    totalRuns,
    wickets,
    legalBalls,
    currentOver,
    strikerStats,
    nonStrikerStats,
    bowlerStats,
    bowlerOverCounts,
    isOverComplete,
    isInningsComplete,
  } = matchState;

  const matchIdBigInt = matchId ? BigInt(matchId) : null;
  const recordDelivery = useRecordDelivery(matchIdBigInt);

  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showEndOfOver, setShowEndOfOver] = useState(false);
  const [showEndOfInnings, setShowEndOfInnings] = useState(false);
  const [pendingWicketRuns] = useState(0);
  const [isFreeHit, setIsFreeHit] = useState(false);

  // Set teams from match data
  useEffect(() => {
    if (match && teams.length > 0) {
      const tA = teams.find(t => t.id === match.teamAId) ?? null;
      const tB = teams.find(t => t.id === match.teamBId) ?? null;
      setMatchTeamA(tA);
      setMatchTeamB(tB);
    }
  }, [match, teams]);

  // Check for end of over / innings after each delivery
  useEffect(() => {
    if (!match || isLoading) return;
    if (isInningsComplete && !showEndOfInnings && !showEndOfOver) {
      setShowEndOfInnings(true);
    } else if (isOverComplete && !isInningsComplete && !showEndOfOver && !showEndOfInnings) {
      setShowEndOfOver(true);
    }
  }, [isOverComplete, isInningsComplete, match, isLoading, showEndOfInnings, showEndOfOver]);

  const currentInnings = match ? Number(match.currentInnings) : 1;
  const battingTeamId = currentInnings === 1 ? match?.teamAId : match?.teamBId;
  const battingTeam = battingTeamId === match?.teamAId ? matchTeamA : matchTeamB;
  const bowlingTeam = battingTeamId === match?.teamAId ? matchTeamB : matchTeamA;

  const strikerPlayer = battingTeam?.players.find(p => p.id === strikerId) ?? null;
  const nonStrikerPlayer = battingTeam?.players.find(p => p.id === nonStrikerId) ?? null;

  const handleDelivery = async (
    runs: number,
    extras: { isWide?: boolean; isNoBall?: boolean; isBye?: boolean; isLegBye?: boolean } = {}
  ) => {
    if (!match || !strikerId || !bowlerId) return;

    const delivery: Delivery = {
      batsmanId: strikerId,
      bowlerId: bowlerId,
      runs: BigInt(runs),
      isWide: extras.isWide ?? false,
      isNoBall: extras.isNoBall ?? false,
      isBye: extras.isBye ?? false,
      isLegBye: extras.isLegBye ?? false,
      isFreeHit: isFreeHit,
      wicket: undefined,
    };

    try {
      await recordDelivery.mutateAsync(delivery);
      setIsFreeHit(extras.isNoBall ?? false);
      // Swap batsmen on odd runs (legal delivery only)
      if (!extras.isWide && !extras.isNoBall && runs % 2 === 1) {
        swapBatsmen();
      }
    } catch (err) {
      console.error('Failed to record delivery:', err);
    }
  };

  const handleWicketConfirm = async (batsmanId: bigint, wicket: WicketType) => {
    if (!match || !strikerId || !bowlerId) return;

    const delivery: Delivery = {
      batsmanId: batsmanId,
      bowlerId: bowlerId,
      runs: BigInt(pendingWicketRuns),
      isWide: false,
      isNoBall: false,
      isBye: false,
      isLegBye: false,
      isFreeHit: isFreeHit,
      wicket,
    };

    try {
      await recordDelivery.mutateAsync(delivery);
      setIsFreeHit(false);

      // Find next batsman
      const battingPlayers = battingTeam?.players ?? [];
      const usedIds = new Set([strikerId?.toString(), nonStrikerId?.toString()]);
      const nextBatsman = battingPlayers.find(p => !usedIds.has(p.id.toString()));

      if (nextBatsman) {
        if (batsmanId === strikerId) {
          setStrikerId(nextBatsman.id);
        } else {
          setNonStrikerId(nextBatsman.id);
        }
      }
    } catch (err) {
      console.error('Failed to record wicket:', err);
    }
  };

  const handleSelectNextBowler = (newBowlerId: bigint) => {
    setBowlerId(newBowlerId);
    swapBatsmen();
    setShowEndOfOver(false);
  };

  const handleStartSecondInnings = (
    newStrikerId: bigint,
    newNonStrikerId: bigint,
    newBowlerId: bigint
  ) => {
    setStrikerId(newStrikerId);
    setNonStrikerId(newNonStrikerId);
    setBowlerId(newBowlerId);
    if (matchId) {
      saveLocalMatchState({
        matchId,
        strikerId: newStrikerId.toString(),
        nonStrikerId: newNonStrikerId.toString(),
        bowlerId: newBowlerId.toString(),
        currentInnings: 2,
      });
    }
    setShowEndOfInnings(false);
  };

  const handleEndMatch = () => {
    if (matchId) updateMatchFinished(matchId, true);
    setShowEndOfInnings(false);
    router.navigate({ to: `/scorecard/${matchId}` });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <div className="h-40 bg-muted rounded-xl animate-pulse" />
        <div className="h-24 bg-muted rounded-lg animate-pulse" />
        <div className="h-24 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-4 text-center py-16">
        <p className="text-muted-foreground">Match not found.</p>
        <Button
          onClick={() => router.navigate({ to: '/history' })}
          className="mt-4"
          style={{ background: 'oklch(0.65 0.18 45)', color: 'oklch(0.1 0.02 240)' }}
        >
          Back to History
        </Button>
      </div>
    );
  }

  const maxOversPerBowler = Number(match.rules.maxOversPerBowler);
  const nextBattingTeam = currentInnings === 1 ? matchTeamB : matchTeamA;
  const nextBowlingTeam = currentInnings === 1 ? matchTeamA : matchTeamB;

  return (
    <div className="p-3 space-y-3 pb-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.navigate({ to: '/history' })}
        >
          <ArrowLeft size={18} />
        </Button>
        <div className="flex items-center gap-1">
          {isFreeHit && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse"
              style={{ background: 'oklch(0.65 0.18 45)', color: 'oklch(0.1 0.02 240)' }}
            >
              FREE HIT
            </span>
          )}
          {match.isFinished && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'oklch(0.55 0.15 145)', color: 'oklch(0.97 0.005 240)' }}
            >
              COMPLETED
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.navigate({ to: `/scorecard/${matchId}` })}
          className="text-xs"
        >
          <FileText size={14} className="mr-1" />
          Scorecard
        </Button>
      </div>

      {/* Score Display */}
      <ScoreDisplay
        match={match}
        teamA={matchTeamA}
        teamB={matchTeamB}
        totalRuns={totalRuns}
        wickets={wickets}
        legalBalls={legalBalls}
      />

      {/* Batsmen Stats */}
      <BatsmanStatsPanel striker={strikerStats} nonStriker={nonStrikerStats} />

      {/* Bowler Stats */}
      <BowlerStatsPanel bowler={bowlerStats} />

      {/* Over Timeline */}
      <OverTimeline balls={match.deliveries} currentOver={currentOver} />

      {/* Delivery Buttons */}
      {!match.isFinished && (
        <div className="space-y-2">
          {/* Run buttons */}
          <div className="grid grid-cols-6 gap-1.5">
            {RUN_BUTTONS.map(runs => (
              <button
                key={runs}
                onClick={() => handleDelivery(runs)}
                disabled={recordDelivery.isPending}
                className="tap-target rounded-lg font-display font-bold text-lg flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: runs === 4
                    ? 'oklch(0.45 0.15 240)'
                    : runs === 6
                    ? 'oklch(0.22 0.07 240)'
                    : runs === 0
                    ? 'oklch(0.93 0.01 240)'
                    : 'oklch(0.65 0.18 45)',
                  color: runs === 0
                    ? 'oklch(0.35 0.05 240)'
                    : 'oklch(0.97 0.005 240)',
                  border: runs === 0 ? '1px solid oklch(0.88 0.015 240)' : 'none',
                  minHeight: '44px',
                }}
              >
                {runs === 0 ? '•' : runs}
              </button>
            ))}
          </div>

          {/* Extras row */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Wide', action: () => handleDelivery(1, { isWide: true }) },
              { label: 'No Ball', action: () => handleDelivery(1, { isNoBall: true }) },
              { label: 'Bye', action: () => handleDelivery(0, { isBye: true }) },
              { label: 'Leg Bye', action: () => handleDelivery(0, { isLegBye: true }) },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={action}
                disabled={recordDelivery.isPending}
                className="tap-target rounded-lg text-xs font-semibold flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: 'oklch(0.65 0.18 45 / 0.12)',
                  color: 'oklch(0.45 0.15 45)',
                  border: '1px solid oklch(0.65 0.18 45 / 0.3)',
                  minHeight: '44px',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Wicket button */}
          <button
            onClick={() => setShowWicketModal(true)}
            disabled={recordDelivery.isPending}
            className="w-full tap-target rounded-lg font-display font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: 'oklch(0.45 0.18 25)',
              color: 'oklch(0.97 0.005 240)',
              minHeight: '44px',
            }}
          >
            🚨 WICKET
          </button>
        </div>
      )}

      {match.isFinished && (
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm mb-3">This match has been completed.</p>
          <Button
            onClick={() => router.navigate({ to: `/scorecard/${matchId}` })}
            style={{ background: 'oklch(0.65 0.18 45)', color: 'oklch(0.1 0.02 240)' }}
          >
            View Full Scorecard
          </Button>
        </div>
      )}

      {/* Modals */}
      <WicketModal
        open={showWicketModal}
        onClose={() => setShowWicketModal(false)}
        striker={strikerPlayer}
        nonStriker={nonStrikerPlayer}
        fieldingTeam={bowlingTeam?.players ?? []}
        onConfirm={handleWicketConfirm}
      />

      <EndOfOverModal
        open={showEndOfOver}
        overNumber={currentOver}
        bowlingTeamPlayers={bowlingTeam?.players ?? []}
        currentBowlerId={bowlerId ?? BigInt(0)}
        maxOversPerBowler={maxOversPerBowler}
        bowlerOverCounts={bowlerOverCounts}
        onSelectBowler={handleSelectNextBowler}
      />

      <EndOfInningsModal
        open={showEndOfInnings}
        inningsNumber={currentInnings}
        totalRuns={totalRuns}
        wickets={wickets}
        overs={formatOvers(legalBalls)}
        battingTeamName={battingTeam?.name ?? 'Batting Team'}
        nextBattingTeamPlayers={nextBattingTeam?.players ?? []}
        nextBowlingTeamPlayers={nextBowlingTeam?.players ?? []}
        onStartSecondInnings={handleStartSecondInnings}
        onEndMatch={handleEndMatch}
      />
    </div>
  );
}
