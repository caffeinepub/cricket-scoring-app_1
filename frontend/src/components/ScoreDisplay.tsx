import type { Match, Team } from '../backend';
import { calcRunRate, calcRequiredRunRate, formatOvers } from '../lib/matchUtils';

interface ScoreDisplayProps {
  match: Match;
  teamA: Team | null;
  teamB: Team | null;
  totalRuns: number;
  wickets: number;
  legalBalls: number;
}

export default function ScoreDisplay({ match, teamA, teamB, totalRuns, wickets, legalBalls }: ScoreDisplayProps) {
  const oversLimit = Number(match.rules.oversLimit);
  const totalBalls = oversLimit * 6;
  const ballsRemaining = totalBalls - legalBalls;
  const currentInnings = Number(match.currentInnings);

  const battingTeamId = currentInnings === 1 ? match.teamAId : match.teamBId;
  const battingTeam = battingTeamId === match.teamAId ? teamA : teamB;
  const bowlingTeam = battingTeamId === match.teamAId ? teamB : teamA;

  const rr = calcRunRate(totalRuns, legalBalls);
  const overs = formatOvers(legalBalls);

  // Second innings target
  const firstInnings = match.innings[0];
  const target = firstInnings ? Number(firstInnings.totalRuns) + 1 : null;
  const rrr = currentInnings === 2 && target !== null
    ? calcRequiredRunRate(target, totalRuns, ballsRemaining)
    : null;
  const needed = currentInnings === 2 && target !== null ? target - totalRuns : null;

  return (
    <div className="bg-scoreboard-bg rounded-xl shadow-scoreboard overflow-hidden">
      {/* Team names */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-cricket-cream/70 text-xs font-sans uppercase tracking-wider">
          {battingTeam?.name ?? 'Batting'} vs {bowlingTeam?.name ?? 'Bowling'}
        </span>
        <span className="text-cricket-cream/60 text-xs font-sans">
          Innings {currentInnings}
        </span>
      </div>

      {/* Main score */}
      <div className="px-4 pb-2">
        <div className="flex items-end gap-2">
          <span className="scoreboard-text text-5xl text-cricket-cream leading-none">
            {totalRuns}/{wickets}
          </span>
          <span className="text-cricket-cream/80 text-xl font-sans mb-1">
            ({overs})
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex border-t border-cricket-cream/10">
        <div className="flex-1 px-4 py-2 border-r border-cricket-cream/10">
          <p className="text-cricket-cream/50 text-xs font-sans">Run Rate</p>
          <p className="text-cricket-cream font-display font-bold text-lg">{rr}</p>
        </div>
        {rrr !== null && needed !== null && (
          <>
            <div className="flex-1 px-4 py-2 border-r border-cricket-cream/10">
              <p className="text-cricket-cream/50 text-xs font-sans">Req. RR</p>
              <p className="text-cricket-cream font-display font-bold text-lg">{rrr}</p>
            </div>
            <div className="flex-1 px-4 py-2">
              <p className="text-cricket-cream/50 text-xs font-sans">Need</p>
              <p className="text-cricket-cream font-display font-bold text-lg">{needed > 0 ? needed : 0}</p>
            </div>
          </>
        )}
        {rrr === null && (
          <div className="flex-1 px-4 py-2">
            <p className="text-cricket-cream/50 text-xs font-sans">Overs Left</p>
            <p className="text-cricket-cream font-display font-bold text-lg">
              {formatOvers(ballsRemaining)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
