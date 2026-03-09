import type { Delivery } from "@/backend";
import { TossChoice } from "@/backend";
import BatsmanStatsPanel from "@/components/BatsmanStatsPanel";
import BowlerStatsPanel from "@/components/BowlerStatsPanel";
import EndOfInningsModal from "@/components/EndOfInningsModal";
import EndOfOverModal from "@/components/EndOfOverModal";
import OverTimeline from "@/components/OverTimeline";
import ScoreDisplay, {
  computeTotalRunsFromDeliveries,
} from "@/components/ScoreDisplay";
import WicketModal from "@/components/WicketModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMatchState } from "@/hooks/useMatchState";
import {
  useGetAllTeams,
  useGetDeliveriesByInnings,
  useGetMatch,
  useRecordDelivery,
} from "@/hooks/useQueries";
import { getMatchMeta } from "@/lib/matchStore";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Loader2, RefreshCw, Settings } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Delivery button config ────────────────────────────────────────────────────
const RUN_BUTTONS = [0, 1, 2, 3, 4, 6];

// ── Innings setup timeout (ms) ────────────────────────────────────────────────
const INNINGS_SETUP_TIMEOUT_MS = 6000;

// ── BatsmanStats / BowlerStats matching panel interfaces ─────────────────────
interface BatsmanStats {
  playerId: bigint;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
}

interface BowlerStats {
  playerId: bigint;
  runs: number;
  wickets: number;
  balls: number;
  maidens: number;
}

export default function LiveScoring() {
  const navigate = useNavigate();
  const meta = getMatchMeta();
  const matchId = meta.currentMatchId;

  // ── Backend queries ───────────────────────────────────────────────────────
  const {
    data: match,
    isLoading: matchLoading,
    error: matchError,
    refetch: refetchMatch,
  } = useGetMatch(matchId ? BigInt(matchId) : null);

  const { data: allTeams = [] } = useGetAllTeams();

  const currentInningsNum = match ? Number(match.currentInnings) : 1;
  const currentInningsId = BigInt(currentInningsNum);

  const { data: deliveries = [], refetch: refetchDeliveries } =
    useGetDeliveriesByInnings(
      matchId ? BigInt(matchId) : null,
      currentInningsId,
    );

  // Also fetch innings 1 deliveries for second innings target display
  const { data: innings1Deliveries = [] } = useGetDeliveriesByInnings(
    matchId ? BigInt(matchId) : null,
    BigInt(1),
  );

  const recordDeliveryMutation = useRecordDelivery();

  // ── Local match state ─────────────────────────────────────────────────────
  const {
    matchState,
    isLoaded: stateLoaded,
    isSetupComplete,
    initInnings,
    setStriker,
    swapBatsmen,
    advanceBall,
    resetOver,
    startSecondInnings,
    beginInnings2Setup,
    resetState,
    setMatchFinished,
  } = useMatchState(matchId);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [showInningsSetup, setShowInningsSetup] = useState(false);
  const [showEndOfOver, setShowEndOfOver] = useState(false);
  const [showWicket, setShowWicket] = useState(false);
  const [pendingWicketRuns] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  // ── Stuck detection ───────────────────────────────────────────────────────
  const [isStuck, setIsStuck] = useState(false);
  const stuckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived team/player data ──────────────────────────────────────────────
  const innings = match?.innings ?? [];
  const currentInningsData = innings.find(
    (i) => Number(i.id) === currentInningsNum,
  );
  const battingTeamId = currentInningsData?.battingTeamId;
  const bowlingTeamId = currentInningsData?.bowlingTeamId;

  const battingTeam = allTeams.find((t) => t.id === battingTeamId);
  const bowlingTeam = allTeams.find((t) => t.id === bowlingTeamId);

  const battingPlayers = battingTeam?.players ?? [];
  const bowlingPlayers = bowlingTeam?.players ?? [];
  const allPlayers = [...battingPlayers, ...bowlingPlayers];

  // ── Toss info ─────────────────────────────────────────────────────────────
  const tossInfo = (() => {
    if (!match?.toss) return null;
    const { winnerTeamId, choice } = match.toss;
    const winnerTeam = allTeams.find((t) => t.id === winnerTeamId);
    if (!winnerTeam) return null;
    const choiceLabel = choice === TossChoice.Bat ? "bat" : "bowl";
    return `${winnerTeam.name} won the toss & elected to ${choiceLabel}`;
  })();

  // ── Innings setup gate ────────────────────────────────────────────────────
  useEffect(() => {
    if (!stateLoaded || matchLoading) return;
    if (!matchId || !match) return;

    // Guard: if state says innings 2 but innings 1 has no deliveries yet,
    // the state is stale/corrupt — reset to fresh innings 1 setup.
    if (
      matchState &&
      matchState.currentInnings === 2 &&
      innings1Deliveries.length === 0 &&
      !matchState.isMatchFinished
    ) {
      resetState();
      setShowInningsSetup(true);
      return;
    }

    if (!isSetupComplete) {
      if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
      stuckTimerRef.current = setTimeout(() => {
        setIsStuck(true);
      }, INNINGS_SETUP_TIMEOUT_MS);
      setShowInningsSetup(true);
    } else {
      if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
      setIsStuck(false);
      setShowInningsSetup(false);
    }

    return () => {
      if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
    };
  }, [
    stateLoaded,
    matchLoading,
    matchId,
    match,
    isSetupComplete,
    matchState,
    innings1Deliveries,
    resetState,
  ]);

  // ── Score computation from deliveries (fixes total score bug) ────────────
  // Use deliveries array directly for accurate live totals
  const totalRuns = computeTotalRunsFromDeliveries(deliveries);
  const wicketsLost = deliveries.filter(
    (d) => d.wicket !== undefined && d.wicket !== null,
  ).length;

  // Count legal balls for overs display
  const legalBallsTotal = deliveries.filter(
    (d) => !d.isWide && !d.isNoBall,
  ).length;
  const oversCompleted = Math.floor(legalBallsTotal / 6);
  const oversLimit = match ? Number(match.rules.oversLimit) : 20;

  // Innings 1 totals (for target in innings 2)
  const innings1Runs = computeTotalRunsFromDeliveries(innings1Deliveries);
  const innings1Wickets = innings1Deliveries.filter(
    (d) => d.wicket !== undefined && d.wicket !== null,
  ).length;

  // ── Delivery stats computation ────────────────────────────────────────────
  const strikerStats: BatsmanStats | null = (() => {
    if (!matchState?.strikerId) return null;
    const sid = matchState.strikerId;
    const batDeliveries = deliveries.filter((d) => d.batsmanId === sid);
    const runs = batDeliveries.reduce((s, d) => s + Number(d.runs), 0);
    const balls = batDeliveries.filter((d) => !d.isWide).length;
    const fours = batDeliveries.filter(
      (d) => Number(d.runs) === 4 && !d.isWide && !d.isNoBall,
    ).length;
    const sixes = batDeliveries.filter(
      (d) => Number(d.runs) === 6 && !d.isWide && !d.isNoBall,
    ).length;
    return { playerId: sid, runs, balls, fours, sixes };
  })();

  const nonStrikerStats: BatsmanStats | null = (() => {
    if (!matchState?.nonStrikerId) return null;
    const nsid = matchState.nonStrikerId;
    const batDeliveries = deliveries.filter((d) => d.batsmanId === nsid);
    const runs = batDeliveries.reduce((s, d) => s + Number(d.runs), 0);
    const balls = batDeliveries.filter((d) => !d.isWide).length;
    const fours = batDeliveries.filter(
      (d) => Number(d.runs) === 4 && !d.isWide && !d.isNoBall,
    ).length;
    const sixes = batDeliveries.filter(
      (d) => Number(d.runs) === 6 && !d.isWide && !d.isNoBall,
    ).length;
    return { playerId: nsid, runs, balls, fours, sixes };
  })();

  const bowlerStats: BowlerStats | null = (() => {
    if (!matchState?.bowlerId) return null;
    const bid = matchState.bowlerId;
    const bowlDeliveries = deliveries.filter((d) => d.bowlerId === bid);
    const runs = bowlDeliveries.reduce((s, d) => s + Number(d.runs), 0);
    const wickets = bowlDeliveries.filter(
      (d) => d.wicket !== undefined && d.wicket !== null,
    ).length;
    const legalBalls = bowlDeliveries.filter(
      (d) => !d.isWide && !d.isNoBall,
    ).length;
    return { playerId: bid, runs, wickets, balls: legalBalls, maidens: 0 };
  })();

  // ── Innings-end helper ────────────────────────────────────────────────────
  // Called inline when an over completes to avoid stale delivery-derived state.
  const handleInningsEnd = useCallback(
    (inningsNum: number) => {
      if (inningsNum === 1) {
        beginInnings2Setup();
        setShowInningsSetup(true);
      } else {
        // Match is over — compute result from current deliveries and navigate
        const innings2Runs = computeTotalRunsFromDeliveries(deliveries);
        const target = innings1Runs + 1;
        let result: string;
        if (innings2Runs >= target) {
          const wicketsRemaining = 10 - wicketsLost;
          result = `${battingTeam?.name ?? "Team"} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? "s" : ""}`;
        } else {
          const margin = innings1Runs - innings2Runs;
          const innings1BattingTeam = innings.find((i) => Number(i.id) === 1);
          const winnerTeam = allTeams.find(
            (t) => t.id === innings1BattingTeam?.battingTeamId,
          );
          result = `${winnerTeam?.name ?? "Team"} won by ${margin} run${margin !== 1 ? "s" : ""}`;
        }
        setMatchFinished(result);
        if (matchId) {
          navigate({ to: `/scorecard/${matchId}` });
        }
      }
    },
    [
      beginInnings2Setup,
      deliveries,
      innings1Runs,
      wicketsLost,
      battingTeam,
      innings,
      allTeams,
      setMatchFinished,
      matchId,
      navigate,
    ],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleInningsSetupComplete = useCallback(
    (strikerId: bigint, nonStrikerId: bigint, bowlerId: bigint) => {
      // Use matchState.currentInnings to determine which innings we're setting up.
      // currentInnings=2 means innings 1 ended and we're starting innings 2.
      // currentInnings=1 (or unset) means it's the initial innings 1 setup.
      const inningsNum = matchState?.currentInnings ?? 1;
      if (inningsNum === 2) {
        startSecondInnings(strikerId, nonStrikerId, bowlerId);
      } else {
        initInnings(strikerId, nonStrikerId, bowlerId, 1);
      }
      setShowInningsSetup(false);
      setIsStuck(false);
      if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
    },
    [matchState, startSecondInnings, initInnings],
  );

  const handleRetry = useCallback(() => {
    setIsStuck(false);
    if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
    refetchMatch();
    setShowInningsSetup(true);
    stuckTimerRef.current = setTimeout(() => {
      setIsStuck(true);
    }, INNINGS_SETUP_TIMEOUT_MS);
  }, [refetchMatch]);

  const handleGoToSetup = useCallback(() => {
    navigate({ to: "/setup" });
  }, [navigate]);

  const handleResetAndSetup = useCallback(() => {
    resetState();
    setIsStuck(false);
    setShowInningsSetup(true);
    if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
    stuckTimerRef.current = setTimeout(() => {
      setIsStuck(true);
    }, INNINGS_SETUP_TIMEOUT_MS);
  }, [resetState]);

  const recordDelivery = useCallback(
    async (delivery: Delivery) => {
      if (!matchId || !matchState) return;
      setIsRecording(true);
      try {
        await recordDeliveryMutation.mutateAsync({
          matchId: BigInt(matchId),
          inningsId: currentInningsId,
          delivery,
        });
        await refetchDeliveries();
      } finally {
        setIsRecording(false);
      }
    },
    [
      matchId,
      matchState,
      currentInningsId,
      recordDeliveryMutation,
      refetchDeliveries,
    ],
  );

  // ── End-of-over handler: after bowler selected for next over ─────────────
  const handleEndOfOver = useCallback(
    (newBowlerId: bigint) => {
      resetOver(newBowlerId);
      setShowEndOfOver(false);
    },
    [resetOver],
  );

  const handleRunScored = useCallback(
    async (runs: number) => {
      if (!matchState?.strikerId || !matchState?.bowlerId) return;
      const delivery: Delivery = {
        batsmanId: matchState.strikerId,
        bowlerId: matchState.bowlerId,
        runs: BigInt(runs),
        isWide: false,
        isNoBall: false,
        isFreeHit: matchState.freeHitNext ?? false,
        isBye: false,
        isLegBye: false,
        wicket: undefined,
      };
      await recordDelivery(delivery);
      advanceBall(true, false);
      if (runs % 2 === 1) swapBatsmen();

      const newLegal = (matchState.legalBallsInOver ?? 0) + 1;
      if (newLegal >= 6) {
        swapBatsmen();
        // Use matchState.currentOver (0-based) to compute how many overs will be done
        // after this over ends. This avoids stale delivery-derived oversCompleted.
        const newOversCompleted = (matchState.currentOver ?? 0) + 1;
        if (oversLimit > 0 && newOversCompleted >= oversLimit) {
          // Innings ends — skip end-of-over bowler prompt, go straight to innings transition
          const inningsNum = matchState.currentInnings ?? currentInningsNum;
          handleInningsEnd(inningsNum);
        } else {
          setShowEndOfOver(true);
        }
      }
    },
    [
      matchState,
      recordDelivery,
      advanceBall,
      swapBatsmen,
      oversLimit,
      currentInningsNum,
      handleInningsEnd,
    ],
  );

  const handleWide = useCallback(async () => {
    if (!matchState?.strikerId || !matchState?.bowlerId) return;
    const delivery: Delivery = {
      batsmanId: matchState.strikerId,
      bowlerId: matchState.bowlerId,
      runs: BigInt(1),
      isWide: true,
      isNoBall: false,
      isFreeHit: false,
      isBye: false,
      isLegBye: false,
      wicket: undefined,
    };
    await recordDelivery(delivery);
    advanceBall(false, false);
  }, [matchState, recordDelivery, advanceBall]);

  const handleNoBall = useCallback(async () => {
    if (!matchState?.strikerId || !matchState?.bowlerId) return;
    const delivery: Delivery = {
      batsmanId: matchState.strikerId,
      bowlerId: matchState.bowlerId,
      runs: BigInt(1),
      isWide: false,
      isNoBall: true,
      isFreeHit: matchState.freeHitNext ?? false,
      isBye: false,
      isLegBye: false,
      wicket: undefined,
    };
    await recordDelivery(delivery);
    advanceBall(false, true);
  }, [matchState, recordDelivery, advanceBall]);

  const handleWicketConfirm = useCallback(
    async (
      dismissedId: bigint,
      newBatsmanId: bigint,
      wicketType: Delivery["wicket"],
    ) => {
      if (!matchState?.strikerId || !matchState?.bowlerId) return;
      const delivery: Delivery = {
        batsmanId: dismissedId,
        bowlerId: matchState.bowlerId,
        runs: BigInt(pendingWicketRuns),
        isWide: false,
        isNoBall: false,
        isFreeHit: matchState.freeHitNext ?? false,
        isBye: false,
        isLegBye: false,
        wicket: wicketType,
      };
      await recordDelivery(delivery);
      advanceBall(true, false);
      setStriker(newBatsmanId);
      setShowWicket(false);

      const newLegal = (matchState.legalBallsInOver ?? 0) + 1;
      if (newLegal >= 6) {
        // Use matchState.currentOver (0-based) — avoid stale delivery-derived oversCompleted
        const newOversCompleted = (matchState.currentOver ?? 0) + 1;
        if (oversLimit > 0 && newOversCompleted >= oversLimit) {
          // Innings ends — skip end-of-over bowler prompt
          const inningsNum = matchState.currentInnings ?? currentInningsNum;
          handleInningsEnd(inningsNum);
        } else {
          setShowEndOfOver(true);
        }
      }
    },
    [
      matchState,
      pendingWicketRuns,
      recordDelivery,
      advanceBall,
      setStriker,
      oversLimit,
      currentInningsNum,
      handleInningsEnd,
    ],
  );

  // ── Loading / error states ────────────────────────────────────────────────
  if (!matchId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <AlertTriangle className="w-12 h-12 text-warning" />
        <h2 className="text-xl font-bold text-foreground">No Active Match</h2>
        <p className="text-muted-foreground text-center">
          No match is currently in progress. Please set up a new match first.
        </p>
        <Button onClick={() => navigate({ to: "/setup" })}>
          Go to Match Setup
        </Button>
      </div>
    );
  }

  if (matchLoading || !stateLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading match data…</p>
      </div>
    );
  }

  if (matchError || !match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold text-foreground">Match Not Found</h2>
        <p className="text-muted-foreground text-center">
          Could not load match data. The match may have been reset.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetchMatch()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
          <Button onClick={() => navigate({ to: "/setup" })}>New Match</Button>
        </div>
      </div>
    );
  }

  // ── Stuck innings setup state ─────────────────────────────────────────────
  if (isStuck && !isSetupComplete) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
          <AlertTriangle className="w-12 h-12 text-warning" />
          <h2 className="text-xl font-bold text-foreground">
            Innings Setup Required
          </h2>
          <p className="text-muted-foreground text-center max-w-sm">
            The innings setup could not be completed automatically. Please
            select the opening batsmen and bowler to start scoring.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button onClick={handleResetAndSetup} className="w-full">
              <Settings className="w-4 h-4 mr-2" /> Set Up Innings
            </Button>
            <Button variant="outline" onClick={handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
            <Button
              variant="ghost"
              onClick={handleGoToSetup}
              className="w-full"
            >
              Go to Match Setup
            </Button>
          </div>
        </div>
        {showInningsSetup && (
          <EndOfInningsModal
            isOpen={showInningsSetup}
            onClose={() => setShowInningsSetup(false)}
            onConfirm={handleInningsSetupComplete}
            battingTeamPlayers={battingPlayers}
            bowlingTeamPlayers={bowlingPlayers}
            allPlayers={allPlayers}
            score={{
              runs: innings1Runs,
              wickets: innings1Wickets,
            }}
            inningsNumber={matchState?.currentInnings ?? 1}
          />
        )}
      </>
    );
  }

  // ── Waiting for innings setup (not stuck yet) ─────────────────────────────
  if (!isSetupComplete) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Waiting for innings setup…</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAndSetup}
            className="mt-2"
          >
            <Settings className="w-4 h-4 mr-2" /> Set Up Now
          </Button>
        </div>
        {showInningsSetup && (
          <EndOfInningsModal
            isOpen={showInningsSetup}
            onClose={() => setShowInningsSetup(false)}
            onConfirm={handleInningsSetupComplete}
            battingTeamPlayers={battingPlayers}
            bowlingTeamPlayers={bowlingPlayers}
            allPlayers={allPlayers}
            score={{
              runs: innings1Runs,
              wickets: innings1Wickets,
            }}
            inningsNumber={matchState?.currentInnings ?? 1}
          />
        )}
      </>
    );
  }

  // ── Main scoring UI ───────────────────────────────────────────────────────
  const battingTeamName = battingTeam?.name ?? "Batting Team";
  const bowlingTeamName = bowlingTeam?.name ?? "Bowling Team";

  const legalBallsInOver = matchState?.legalBallsInOver ?? 0;
  const oversDisplay = `${oversCompleted}.${legalBallsInOver}`;

  const target = currentInningsNum === 2 ? innings1Runs + 1 : null;
  const runsRequired = target !== null ? target - totalRuns : null;

  const innings1Summary =
    currentInningsNum === 2
      ? `1st: ${innings1Runs}/${innings1Wickets} | Target: ${target}`
      : undefined;

  // Next over number for EndOfOverModal
  const nextOverNumber = oversCompleted + 1;

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Toss Info Banner */}
      {tossInfo && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-3 py-2">
          <span className="text-xs text-muted-foreground">{tossInfo}</span>
        </div>
      )}

      {/* Score Display */}
      <ScoreDisplay
        battingTeamName={battingTeamName}
        bowlingTeamName={bowlingTeamName}
        runs={totalRuns}
        wickets={wicketsLost}
        overs={oversDisplay}
        oversLimit={oversLimit}
        innings={currentInningsNum}
        target={target}
        runsRequired={runsRequired}
        innings1Summary={innings1Summary}
      />

      {/* Over Timeline */}
      <OverTimeline deliveries={deliveries} currentOver={oversCompleted} />

      {/* Batsman Stats */}
      {strikerStats &&
        nonStrikerStats &&
        matchState?.strikerId &&
        matchState?.nonStrikerId && (
          <BatsmanStatsPanel
            strikerId={matchState.strikerId}
            nonStrikerId={matchState.nonStrikerId}
            strikerStats={strikerStats}
            nonStrikerStats={nonStrikerStats}
            players={battingPlayers}
            allPlayers={allPlayers}
          />
        )}

      {/* Bowler Stats */}
      {bowlerStats && matchState?.bowlerId && (
        <BowlerStatsPanel
          bowlerId={matchState.bowlerId}
          bowlerStats={bowlerStats}
          players={bowlingPlayers}
          allPlayers={allPlayers}
        />
      )}

      {/* Delivery Buttons */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Record Delivery
          </p>

          {/* Free Hit indicator */}
          {matchState?.freeHitNext && (
            <div className="mb-3 rounded-lg bg-accent/20 border border-accent/40 px-3 py-2 text-center">
              <span className="text-sm font-bold text-accent">
                🎯 FREE HIT!
              </span>
            </div>
          )}

          {/* Run buttons */}
          <div className="grid grid-cols-6 gap-2 mb-3">
            {RUN_BUTTONS.map((runs) => (
              <Button
                key={runs}
                variant="outline"
                size="lg"
                className="h-14 text-xl font-bold"
                disabled={isRecording}
                onClick={() => handleRunScored(runs)}
              >
                {runs}
              </Button>
            ))}
          </div>

          {/* Extra buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              variant="secondary"
              disabled={isRecording}
              onClick={handleWide}
              className="h-10 font-semibold"
            >
              Wide (+1)
            </Button>
            <Button
              variant="secondary"
              disabled={isRecording}
              onClick={handleNoBall}
              className="h-10 font-semibold"
            >
              No Ball (+1)
            </Button>
          </div>

          {/* Wicket button */}
          <Button
            variant="destructive"
            className="w-full h-12 text-base font-bold"
            disabled={isRecording}
            onClick={() => setShowWicket(true)}
          >
            {isRecording ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            WICKET
          </Button>
        </CardContent>
      </Card>

      {/* Modals */}
      <EndOfOverModal
        isOpen={showEndOfOver}
        onClose={() => setShowEndOfOver(false)}
        overNumber={nextOverNumber}
        currentBowlerId={matchState?.bowlerId ?? undefined}
        bowlingTeamPlayers={bowlingPlayers}
        allPlayers={allPlayers}
        onConfirm={handleEndOfOver}
      />

      {matchState?.strikerId && (
        <WicketModal
          isOpen={showWicket}
          onClose={() => setShowWicket(false)}
          dismissedBatsmanId={matchState.strikerId}
          battingTeamPlayers={battingPlayers}
          allPlayers={allPlayers}
          onConfirm={handleWicketConfirm}
        />
      )}

      <EndOfInningsModal
        isOpen={showInningsSetup}
        onClose={() => setShowInningsSetup(false)}
        onConfirm={handleInningsSetupComplete}
        battingTeamPlayers={battingPlayers}
        bowlingTeamPlayers={bowlingPlayers}
        allPlayers={allPlayers}
        score={{
          runs: innings1Runs,
          wickets: innings1Wickets,
        }}
        inningsNumber={matchState?.currentInnings ?? currentInningsNum}
      />
    </div>
  );
}
