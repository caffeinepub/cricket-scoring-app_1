import { Match, Team } from "@/backend";

interface ScoreDisplayProps {
  match: Match;
  teamA: Team;
  teamB: Team;
}

export default function ScoreDisplay({ match, teamA, teamB }: ScoreDisplayProps) {
  const currentInningsIdx = Number(match.currentInnings) - 1;
  const innings1 = match.innings[0];
  const innings2 = match.innings[1];
  const currentInnings = match.innings[currentInningsIdx];

  const battingTeam = currentInnings?.battingTeamId === teamA.id ? teamA : teamB;
  const bowlingTeam = currentInnings?.battingTeamId === teamA.id ? teamB : teamA;

  const runs = Number(currentInnings?.totalRuns ?? 0);
  const wickets = Number(currentInnings?.wicketsLost ?? 0);
  const overs = Number(currentInnings?.overs ?? 0);

  // Calculate balls in current over from deliveries
  const currentOverDeliveries = currentInnings?.deliveries?.filter(
    (d) => !d.isWide && !d.isNoBall
  ) ?? [];
  const ballsInCurrentOver = currentOverDeliveries.length % 6;

  // Run rate
  const totalBalls = overs * 6 + ballsInCurrentOver;
  const runRate = totalBalls > 0 ? ((runs / totalBalls) * 6).toFixed(2) : "0.00";

  // Target for 2nd innings
  const isSecondInnings = Number(match.currentInnings) === 2;
  const target = isSecondInnings ? Number(innings1?.totalRuns ?? 0) + 1 : null;
  const runsNeeded = target ? target - runs : null;
  const ballsLeft = isSecondInnings
    ? Number(match.rules.oversLimit) * 6 - totalBalls
    : null;

  return (
    <div className="bg-[oklch(0.20_0.06_240)] rounded-xl p-4 shadow-card-md text-white">
      {/* Teams row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-0.5">Batting</p>
          <p className="font-display text-base font-bold truncate">{battingTeam.name}</p>
        </div>
        <div className="text-center px-3">
          <p className="text-white/40 text-xs">vs</p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-0.5">Bowling</p>
          <p className="font-display text-base font-bold truncate">{bowlingTeam.name}</p>
        </div>
      </div>

      {/* Score */}
      <div className="flex items-end justify-between">
        <div>
          <div className="score-display text-4xl font-bold text-white leading-none">
            {runs}/{wickets}
          </div>
          <div className="text-white/60 text-sm mt-1">
            {overs}.{ballsInCurrentOver} overs
          </div>
        </div>

        <div className="text-right space-y-1">
          <div className="bg-white/10 rounded-lg px-3 py-1.5">
            <p className="text-white/60 text-xs">Run Rate</p>
            <p className="font-display text-lg font-bold text-[oklch(0.65_0.18_45)]">{runRate}</p>
          </div>
        </div>
      </div>

      {/* Target info for 2nd innings */}
      {isSecondInnings && target !== null && runsNeeded !== null && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
          <div>
            <span className="text-white/60 text-xs">Target: </span>
            <span className="font-display text-base font-bold text-[oklch(0.65_0.18_45)]">{target}</span>
          </div>
          <div>
            <span className="text-white/60 text-xs">Need: </span>
            <span className="font-display text-base font-bold">
              {runsNeeded > 0 ? runsNeeded : 0} off {ballsLeft} balls
            </span>
          </div>
        </div>
      )}

      {/* Innings indicator */}
      <div className="mt-2 flex gap-1">
        {match.innings.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 flex-1 rounded-full ${
              idx + 1 === Number(match.currentInnings)
                ? "bg-[oklch(0.65_0.18_45)]"
                : idx + 1 < Number(match.currentInnings)
                ? "bg-white/40"
                : "bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
