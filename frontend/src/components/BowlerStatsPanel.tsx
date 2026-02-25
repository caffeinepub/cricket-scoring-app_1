import { Player } from "@/backend";

interface BowlerStats {
  playerId: bigint;
  overs: number;
  balls: number;
  maidens: number;
  runs: number;
  wickets: number;
}

interface BowlerStatsPanelProps {
  bowler: BowlerStats | null;
  players: Player[];
}

function getPlayerName(players: Player[], id: bigint): string {
  return players.find((p) => p.id === id)?.name ?? "Unknown";
}

function calcEconomy(runs: number, overs: number, balls: number): string {
  const totalOvers = overs + balls / 6;
  if (totalOvers === 0) return "0.00";
  return (runs / totalOvers).toFixed(2);
}

export default function BowlerStatsPanel({ bowler, players }: BowlerStatsPanelProps) {
  if (!bowler) {
    return (
      <div className="cricket-card p-3">
        <p className="text-muted-foreground text-sm text-center">No bowler selected</p>
      </div>
    );
  }

  const name = getPlayerName(players, bowler.playerId);
  const economy = calcEconomy(bowler.runs, bowler.overs, bowler.balls);

  return (
    <div className="cricket-card p-3">
      <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Bowler
      </h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {bowler.overs}.{bowler.balls} ov
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">R</p>
            <p className="text-sm font-bold">{bowler.runs}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">W</p>
            <p className="text-sm font-bold text-[oklch(0.65_0.18_45)]">{bowler.wickets}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Eco</p>
            <p className="text-sm font-bold">{economy}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">M</p>
            <p className="text-sm font-bold">{bowler.maidens}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
