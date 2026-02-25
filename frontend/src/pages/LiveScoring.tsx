import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "@tanstack/react-router";
import { useActor } from "../hooks/useActor";
import {
  useGetMatch,
  useGetAllTeams,
  useRecordDelivery,
} from "../hooks/useQueries";
import { getMatchMeta, getLocalMatchState, saveLocalMatchState } from "../lib/matchStore";
import ScoreDisplay from "../components/ScoreDisplay";
import BatsmanStatsPanel from "../components/BatsmanStatsPanel";
import BowlerStatsPanel from "../components/BowlerStatsPanel";
import OverTimeline from "../components/OverTimeline";
import EndOfOverModal from "../components/EndOfOverModal";
import WicketModal from "../components/WicketModal";
import EndOfInningsModal from "../components/EndOfInningsModal";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import type { Delivery, Player } from "../backend";

// ─── helpers ────────────────────────────────────────────────────────────────

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

function computeBatsmanStats(
  deliveries: Delivery[],
  playerId: bigint
): BatsmanStats {
  let runs = 0,
    balls = 0,
    fours = 0,
    sixes = 0;
  for (const d of deliveries) {
    if (d.batsmanId !== playerId) continue;
    if (!d.isWide && !d.isNoBall) balls++;
    if (!d.isWide) {
      runs += Number(d.runs);
      if (d.runs === 4n) fours++;
      if (d.runs === 6n) sixes++;
    }
  }
  return { playerId, runs, balls, fours, sixes };
}

function computeBowlerStats(
  deliveries: Delivery[],
  playerId: bigint
): BowlerStats {
  let runs = 0,
    wickets = 0,
    balls = 0,
    maidens = 0;
  for (const d of deliveries) {
    if (d.bowlerId !== playerId) continue;
    if (!d.isWide && !d.isNoBall) balls++;
    runs += Number(d.runs);
    if (d.wicket && d.wicket.__kind__ !== "RunOut") wickets++;
  }
  return { playerId, runs, wickets, balls, maidens };
}

const EMPTY_BATSMAN_STATS: BatsmanStats = {
  playerId: 0n,
  runs: 0,
  balls: 0,
  fours: 0,
  sixes: 0,
};

const EMPTY_BOWLER_STATS: BowlerStats = {
  playerId: 0n,
  runs: 0,
  wickets: 0,
  balls: 0,
  maidens: 0,
};

// ─── component ──────────────────────────────────────────────────────────────

export default function LiveScoring() {
  const { matchId: matchIdParam } = useParams({ strict: false }) as {
    matchId?: string;
  };

  // matchId for backend calls must be bigint; for localStorage keys use string
  const matchIdBigInt = matchIdParam ? BigInt(matchIdParam) : undefined;
  const matchIdStr = matchIdParam ?? "";

  const { actor } = useActor();
  const { data: match, isLoading: matchLoading } = useGetMatch(matchIdBigInt ?? null);
  const { data: allTeams = [], isLoading: teamsLoading } = useGetAllTeams();

  // ── local state ──────────────────────────────────────────────────────────
  const [strikerId, setStrikerId] = useState<bigint | null>(null);
  const [nonStrikerId, setNonStrikerId] = useState<bigint | null>(null);
  const [bowlerId, setBowlerId] = useState<bigint | null>(null);
  const [currentInnings, setCurrentInnings] = useState<number>(1);
  const [localDeliveries, setLocalDeliveries] = useState<Delivery[]>([]);
  const [innings2Deliveries, setInnings2Deliveries] = useState<Delivery[]>([]);
  const [showEndOfOver, setShowEndOfOver] = useState(false);
  const [showWicket, setShowWicket] = useState(false);
  const [showEndOfInnings, setShowEndOfInnings] = useState(false);
  const [pendingWicketDelivery, setPendingWicketDelivery] =
    useState<Partial<Delivery> | null>(null);
  const [dismissedBatsmanId, setDismissedBatsmanId] = useState<bigint | null>(null);
  const [matchResult, setMatchResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track the last over number that has already triggered the end-of-over modal
  // to prevent the modal from re-opening after the bowler is confirmed.
  const lastHandledOverRef = useRef<number>(-1);

  // Use refs for strikerId/nonStrikerId so handleDelivery always has fresh values
  const strikerIdRef = useRef<bigint | null>(null);
  const nonStrikerIdRef = useRef<bigint | null>(null);
  const currentInningsRef = useRef<number>(1);

  // Keep refs in sync with state
  useEffect(() => { strikerIdRef.current = strikerId; }, [strikerId]);
  useEffect(() => { nonStrikerIdRef.current = nonStrikerId; }, [nonStrikerId]);
  useEffect(() => { currentInningsRef.current = currentInnings; }, [currentInnings]);

  const recordDelivery = useRecordDelivery();

  // ── load persisted state ─────────────────────────────────────────────────
  useEffect(() => {
    if (!matchIdStr) return;
    const saved = getLocalMatchState(matchIdStr);
    if (saved) {
      if (saved.strikerId) setStrikerId(BigInt(saved.strikerId));
      if (saved.nonStrikerId) setNonStrikerId(BigInt(saved.nonStrikerId));
      if (saved.bowlerId) setBowlerId(BigInt(saved.bowlerId));
    }
    // Load extended state from localStorage directly
    try {
      const raw = localStorage.getItem(`cricket_live_state_${matchIdStr}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.currentInnings) setCurrentInnings(Number(parsed.currentInnings));
        if (parsed.localDeliveries) {
          setLocalDeliveries(
            parsed.localDeliveries.map((d: any) => ({
              ...d,
              batsmanId: BigInt(d.batsmanId),
              bowlerId: BigInt(d.bowlerId),
              runs: BigInt(d.runs),
              wicket: d.wicket,
            }))
          );
        }
        if (parsed.innings2Deliveries) {
          setInnings2Deliveries(
            parsed.innings2Deliveries.map((d: any) => ({
              ...d,
              batsmanId: BigInt(d.batsmanId),
              bowlerId: BigInt(d.bowlerId),
              runs: BigInt(d.runs),
              wicket: d.wicket,
            }))
          );
        }
        if (parsed.matchResult) setMatchResult(parsed.matchResult);
        // Restore lastHandledOver so we don't re-trigger on reload
        if (typeof parsed.lastHandledOver === "number") {
          lastHandledOverRef.current = parsed.lastHandledOver;
        }
      }
    } catch {}
  }, [matchIdStr]);

  // ── persist state ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!matchIdStr) return;
    // Save basic state via matchStore
    saveLocalMatchState(matchIdStr, {
      strikerId: strikerId ?? null,
      nonStrikerId: nonStrikerId ?? null,
      bowlerId: bowlerId ?? null,
    });
    // Save extended state directly
    try {
      const extended = {
        currentInnings,
        localDeliveries: localDeliveries.map((d) => ({
          ...d,
          batsmanId: d.batsmanId.toString(),
          bowlerId: d.bowlerId.toString(),
          runs: d.runs.toString(),
        })),
        innings2Deliveries: innings2Deliveries.map((d) => ({
          ...d,
          batsmanId: d.batsmanId.toString(),
          bowlerId: d.bowlerId.toString(),
          runs: d.runs.toString(),
        })),
        matchResult,
        lastHandledOver: lastHandledOverRef.current,
      };
      localStorage.setItem(`cricket_live_state_${matchIdStr}`, JSON.stringify(extended));
    } catch {}
  }, [matchIdStr, strikerId, nonStrikerId, bowlerId, currentInnings, localDeliveries, innings2Deliveries, matchResult]);

  // ── derived data ─────────────────────────────────────────────────────────
  const meta = matchIdStr ? getMatchMeta(matchIdStr) : null;

  const teamA = allTeams.find((t) => match && t.id === match.teamAId);
  const teamB = allTeams.find((t) => match && t.id === match.teamBId);

  // In innings 1: teamA bats, teamB bowls
  // In innings 2: teamB bats, teamA bowls
  const battingTeam = currentInnings === 1 ? teamA : teamB;
  const bowlingTeam = currentInnings === 1 ? teamB : teamA;

  // Combined player pool for reliable name lookups
  const allPlayers: Player[] = [...(teamA?.players ?? []), ...(teamB?.players ?? [])];

  // Batting/bowling team players — fall back to allPlayers if team not yet loaded
  const allBattingPlayers: Player[] =
    battingTeam?.players?.length ? battingTeam.players : allPlayers;
  const allBowlingPlayers: Player[] =
    bowlingTeam?.players?.length ? bowlingTeam.players : allPlayers;

  const activeDeliveries =
    currentInnings === 1 ? localDeliveries : innings2Deliveries;

  // ── score computation ────────────────────────────────────────────────────
  const totalRuns = activeDeliveries.reduce(
    (sum, d) => sum + Number(d.runs),
    0
  );
  const totalWickets = activeDeliveries.filter((d) => d.wicket).length;

  const legalBalls = activeDeliveries.filter(
    (d) => !d.isWide && !d.isNoBall
  ).length;
  const oversCompleted = Math.floor(legalBalls / 6);
  const ballsInCurrentOver = legalBalls % 6;
  const oversDisplay = `${oversCompleted}.${ballsInCurrentOver}`;

  const oversLimit = match ? Number(match.rules.oversLimit) : 20;

  // First innings score — always from localDeliveries (innings 1)
  const innings1Runs = localDeliveries.reduce((sum, d) => sum + Number(d.runs), 0);
  const innings1Wickets = localDeliveries.filter((d) => d.wicket).length;
  const target = innings1Runs + 1;
  const runsRequired = target - totalRuns;

  // innings1Summary string for ScoreDisplay
  const innings1Summary =
    currentInnings === 2
      ? `${teamA?.name ?? "Team A"}: ${innings1Runs}/${innings1Wickets} | Target: ${target}`
      : undefined;

  // ── over detection ───────────────────────────────────────────────────────
  useEffect(() => {
    if (
      ballsInCurrentOver === 0 &&
      legalBalls > 0 &&
      !showWicket &&
      !showEndOfInnings &&
      oversCompleted > lastHandledOverRef.current
    ) {
      const isLastOver = oversCompleted >= oversLimit;
      if (isLastOver) {
        lastHandledOverRef.current = oversCompleted;
        if (currentInnings === 1) {
          setShowEndOfInnings(true);
        } else {
          const won = totalRuns > innings1Runs;
          if (won) {
            setMatchResult(`${battingTeam?.name ?? "Team"} won!`);
          } else {
            setMatchResult(
              `${bowlingTeam?.name ?? "Team"} won by ${innings1Runs - totalRuns + 1} runs!`
            );
          }
        }
      } else {
        lastHandledOverRef.current = oversCompleted;
        setShowEndOfOver(true);
      }
    }
  }, [
    legalBalls,
    ballsInCurrentOver,
    oversCompleted,
    oversLimit,
    showWicket,
    showEndOfInnings,
    currentInnings,
    totalRuns,
    innings1Runs,
    battingTeam,
    bowlingTeam,
  ]);

  // ── wicket handling ──────────────────────────────────────────────────────
  const handleWicket = useCallback((partialDelivery: Partial<Delivery>) => {
    setPendingWicketDelivery(partialDelivery);
    setDismissedBatsmanId(partialDelivery.batsmanId ?? null);
    setShowWicket(true);
  }, []);

  // ── record delivery ──────────────────────────────────────────────────────
  // Uses functional state updates to avoid stale closure on deliveries array.
  const handleDelivery = useCallback(
    async (delivery: Delivery) => {
      if (!matchIdBigInt || !actor) return;
      setIsSubmitting(true);
      try {
        const innings = currentInningsRef.current;
        const inningsId = BigInt(innings);
        await recordDelivery.mutateAsync({ matchId: matchIdBigInt, inningsId, delivery });

        // Use functional updates so we always append to the latest array
        if (innings === 1) {
          setLocalDeliveries((prev) => [...prev, delivery]);
        } else {
          setInnings2Deliveries((prev) => [...prev, delivery]);
        }

        // Swap striker/non-striker on odd runs using refs for fresh values
        if (Number(delivery.runs) % 2 === 1) {
          const currentStriker = strikerIdRef.current;
          const currentNonStriker = nonStrikerIdRef.current;
          setStrikerId(currentNonStriker);
          setNonStrikerId(currentStriker);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [matchIdBigInt, actor, recordDelivery]
  );

  // ── scoring buttons ──────────────────────────────────────────────────────
  const scoreRuns = useCallback(
    async (runs: number) => {
      const currentStriker = strikerIdRef.current;
      const currentBowler = bowlerId;
      if (!currentStriker || !currentBowler) return;
      const delivery: Delivery = {
        batsmanId: currentStriker,
        bowlerId: currentBowler,
        runs: BigInt(runs),
        isWide: false,
        isNoBall: false,
        isFreeHit: false,
        isBye: false,
        isLegBye: false,
        wicket: undefined,
      };
      await handleDelivery(delivery);
    },
    [bowlerId, handleDelivery]
  );

  const scoreExtra = useCallback(
    async (type: "wide" | "noBall" | "bye" | "legBye") => {
      const currentStriker = strikerIdRef.current;
      const currentBowler = bowlerId;
      if (!currentStriker || !currentBowler) return;
      const delivery: Delivery = {
        batsmanId: currentStriker,
        bowlerId: currentBowler,
        runs: 1n,
        isWide: type === "wide",
        isNoBall: type === "noBall",
        isFreeHit: false,
        isBye: type === "bye",
        isLegBye: type === "legBye",
        wicket: undefined,
      };
      await handleDelivery(delivery);
    },
    [bowlerId, handleDelivery]
  );

  const scoreWicket = useCallback(() => {
    const currentStriker = strikerIdRef.current;
    const currentBowler = bowlerId;
    if (!currentStriker || !currentBowler) return;
    handleWicket({ batsmanId: currentStriker, bowlerId: currentBowler });
  }, [bowlerId, handleWicket]);

  // ── innings transition ───────────────────────────────────────────────────
  const handleEndOfInnings = useCallback(
    (newStriker: bigint, newNonStriker: bigint, newBowler: bigint) => {
      setCurrentInnings(2);
      setStrikerId(newStriker);
      setNonStrikerId(newNonStriker);
      setBowlerId(newBowler);
      setShowEndOfInnings(false);
      // Reset the handled-over tracker for the new innings
      lastHandledOverRef.current = -1;
    },
    []
  );

  // ── end of over ──────────────────────────────────────────────────────────
  const handleEndOfOver = useCallback(
    (newBowler: bigint) => {
      setShowEndOfOver(false);
      setBowlerId(newBowler);
      // Swap batsmen at end of over using refs for fresh values
      const currentStriker = strikerIdRef.current;
      const currentNonStriker = nonStrikerIdRef.current;
      setStrikerId(currentNonStriker);
      setNonStrikerId(currentStriker);
    },
    []
  );

  // ── wicket confirmed ─────────────────────────────────────────────────────
  const handleWicketConfirmed = useCallback(
    async (
      dismissedId: bigint,
      newBatsmanId: bigint,
      wicketType: Delivery["wicket"]
    ) => {
      if (!pendingWicketDelivery || !bowlerId) return;
      const delivery: Delivery = {
        batsmanId: dismissedId,
        bowlerId,
        runs: BigInt(pendingWicketDelivery.runs ?? 0),
        isWide: false,
        isNoBall: false,
        isFreeHit: false,
        isBye: false,
        isLegBye: false,
        wicket: wicketType,
      };
      await handleDelivery(delivery);
      if (dismissedId === strikerIdRef.current) {
        setStrikerId(newBatsmanId);
      } else {
        setNonStrikerId(newBatsmanId);
      }
      setPendingWicketDelivery(null);
      setDismissedBatsmanId(null);
      setShowWicket(false);

      const newWickets = totalWickets + 1;
      if (newWickets >= 10) {
        if (currentInnings === 1) {
          setShowEndOfInnings(true);
        } else {
          setMatchResult(
            `${bowlingTeam?.name ?? "Team"} won by ${innings1Runs - totalRuns} runs!`
          );
        }
      }
    },
    [
      pendingWicketDelivery,
      bowlerId,
      handleDelivery,
      totalWickets,
      currentInnings,
      bowlingTeam,
      innings1Runs,
      totalRuns,
    ]
  );

  // ── loading / error ──────────────────────────────────────────────────────
  if (matchLoading || teamsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-lg font-semibold">Match not found</p>
      </div>
    );
  }

  // ── playing elevens ──────────────────────────────────────────────────────
  const teamAPlayingEleven: bigint[] =
    meta?.teamAPlayingEleven ?? teamA?.squad ?? [];
  const teamBPlayingEleven: bigint[] =
    meta?.teamBPlayingEleven ?? teamB?.squad ?? [];

  const battingPlayingEleven =
    currentInnings === 1 ? teamAPlayingEleven : teamBPlayingEleven;
  const bowlingPlayingEleven =
    currentInnings === 1 ? teamBPlayingEleven : teamAPlayingEleven;

  // Dismissed batsmen
  const dismissedIds = new Set(
    activeDeliveries.filter((d) => d.wicket).map((d) => d.batsmanId)
  );

  // Available batsmen: from batting playing eleven, not at crease, not dismissed
  const availableBatsmen = allPlayers.filter(
    (p) =>
      battingPlayingEleven.some((id) => id === p.id) &&
      p.id !== strikerId &&
      p.id !== nonStrikerId &&
      !dismissedIds.has(p.id)
  );

  // Available bowlers: from bowling playing eleven
  const availableBowlers = allPlayers.filter((p) =>
    bowlingPlayingEleven.some((id) => id === p.id)
  );

  // Playing eleven player objects for modals
  const battingPlayingElevenPlayers = allPlayers.filter((p) =>
    battingPlayingEleven.some((id) => id === p.id)
  );
  const bowlingPlayingElevenPlayers = allPlayers.filter((p) =>
    bowlingPlayingEleven.some((id) => id === p.id)
  );

  // ── batsman/bowler stats ─────────────────────────────────────────────────
  const strikerStats = strikerId
    ? computeBatsmanStats(activeDeliveries, strikerId)
    : null;
  const nonStrikerStats = nonStrikerId
    ? computeBatsmanStats(activeDeliveries, nonStrikerId)
    : null;
  const bowlerStats = bowlerId
    ? computeBowlerStats(activeDeliveries, bowlerId)
    : null;

  const overNumber = oversCompleted + 1;

  const canScore = !!strikerId && !!bowlerId && !isSubmitting && !matchResult;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Match result banner */}
      {matchResult && (
        <div className="bg-primary text-primary-foreground rounded-lg p-4 text-center font-bold text-lg">
          🏆 {matchResult}
        </div>
      )}

      {/* Score display */}
      <ScoreDisplay
        battingTeamName={battingTeam?.name ?? "Batting Team"}
        bowlingTeamName={bowlingTeam?.name ?? "Bowling Team"}
        runs={totalRuns}
        wickets={totalWickets}
        overs={oversDisplay}
        oversLimit={oversLimit}
        innings={currentInnings}
        target={currentInnings === 2 ? target : undefined}
        runsRequired={currentInnings === 2 ? runsRequired : undefined}
        innings1Summary={innings1Summary}
      />

      {/* Batsman stats */}
      {strikerId && nonStrikerId && strikerStats && nonStrikerStats && (
        <BatsmanStatsPanel
          strikerId={strikerId}
          nonStrikerId={nonStrikerId}
          strikerStats={strikerStats}
          nonStrikerStats={nonStrikerStats}
          players={allBattingPlayers}
          allPlayers={allPlayers}
        />
      )}

      {/* Bowler stats */}
      {bowlerId && bowlerStats && (
        <BowlerStatsPanel
          bowlerId={bowlerId}
          bowlerStats={bowlerStats}
          players={allBowlingPlayers}
          allPlayers={allPlayers}
        />
      )}

      {/* Over timeline */}
      <OverTimeline deliveries={activeDeliveries} currentOver={overNumber} />

      {/* Scoring pad */}
      {!matchResult && (
        <div className="bg-card border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Scoring Pad
          </h3>

          {!strikerId || !bowlerId ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Waiting for innings setup…
            </p>
          ) : (
            <>
              {/* Run buttons */}
              <div className="grid grid-cols-7 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                  <Button
                    key={r}
                    variant={r === 4 || r === 6 ? "default" : "outline"}
                    className="h-12 text-lg font-bold"
                    disabled={!canScore}
                    onClick={() => scoreRuns(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>

              {/* Extra buttons */}
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="secondary"
                  className="h-10 text-sm font-semibold"
                  disabled={!canScore}
                  onClick={() => scoreExtra("wide")}
                >
                  Wide
                </Button>
                <Button
                  variant="secondary"
                  className="h-10 text-sm font-semibold"
                  disabled={!canScore}
                  onClick={() => scoreExtra("noBall")}
                >
                  No Ball
                </Button>
                <Button
                  variant="secondary"
                  className="h-10 text-sm font-semibold"
                  disabled={!canScore}
                  onClick={() => scoreExtra("bye")}
                >
                  Bye
                </Button>
                <Button
                  variant="secondary"
                  className="h-10 text-sm font-semibold"
                  disabled={!canScore}
                  onClick={() => scoreExtra("legBye")}
                >
                  Leg Bye
                </Button>
              </div>

              {/* Wicket button */}
              <Button
                variant="destructive"
                className="w-full h-12 text-base font-bold"
                disabled={!canScore}
                onClick={scoreWicket}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin w-5 h-5 mr-2" />
                ) : null}
                Wicket
              </Button>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      <EndOfOverModal
        isOpen={showEndOfOver}
        onClose={() => setShowEndOfOver(false)}
        bowlingTeamPlayers={allBowlingPlayers}
        allPlayers={allPlayers}
        overNumber={overNumber}
        onConfirm={handleEndOfOver}
        currentBowlerId={bowlerId ?? undefined}
        availableBowlers={availableBowlers}
      />

      {dismissedBatsmanId !== null && (
        <WicketModal
          isOpen={showWicket}
          onClose={() => {
            setShowWicket(false);
            setPendingWicketDelivery(null);
            setDismissedBatsmanId(null);
          }}
          dismissedBatsmanId={dismissedBatsmanId}
          battingTeamPlayers={allBattingPlayers}
          allPlayers={allPlayers}
          availableBatsmen={availableBatsmen}
          onConfirm={handleWicketConfirmed}
        />
      )}

      <EndOfInningsModal
        isOpen={showEndOfInnings}
        onClose={() => setShowEndOfInnings(false)}
        inningsNumber={currentInnings}
        battingTeamPlayers={
          currentInnings === 1
            ? (teamB?.players ?? allBowlingPlayers)
            : (teamA?.players ?? allBattingPlayers)
        }
        bowlingTeamPlayers={
          currentInnings === 1
            ? (teamA?.players ?? allBattingPlayers)
            : (teamB?.players ?? allBowlingPlayers)
        }
        allPlayers={allPlayers}
        score={{ runs: innings1Runs, wickets: innings1Wickets }}
        onConfirm={handleEndOfInnings}
      />
    </div>
  );
}
