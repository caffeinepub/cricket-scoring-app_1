import type { Player } from "../backend";

interface BowlerStats {
  playerId: bigint;
  runs: number;
  wickets: number;
  balls: number;
  maidens: number;
}

interface BowlerStatsPanelProps {
  bowlerId: bigint;
  bowlerStats: BowlerStats;
  players: Player[];
  allPlayers?: Player[];
}

function getPlayerName(players: Player[], id: bigint, fallback?: Player[]): string {
  const p = players.find((p) => p.id === id);
  if (p) return p.name;
  if (fallback) {
    const fb = fallback.find((p) => p.id === id);
    if (fb) return fb.name;
  }
  return "Unknown";
}

export default function BowlerStatsPanel({
  bowlerId,
  bowlerStats,
  players,
  allPlayers,
}: BowlerStatsPanelProps) {
  const bowlerName = getPlayerName(players, bowlerId, allPlayers);
  const overs = `${Math.floor(bowlerStats.balls / 6)}.${bowlerStats.balls % 6}`;
  const economy =
    bowlerStats.balls > 0
      ? ((bowlerStats.runs / bowlerStats.balls) * 6).toFixed(2)
      : "0.00";

  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
        Bowler
      </h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{bowlerName}</p>
          <p className="text-xs text-muted-foreground">{overs} ov</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">R</p>
            <p className="font-semibold">{bowlerStats.runs}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">W</p>
            <p className="font-semibold text-destructive">{bowlerStats.wickets}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Eco</p>
            <p className="font-semibold">{economy}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">M</p>
            <p className="font-semibold">{bowlerStats.maidens}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
