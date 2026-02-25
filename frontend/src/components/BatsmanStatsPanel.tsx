import type { Player } from "../backend";

interface BatsmanStats {
  playerId: bigint;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
}

interface BatsmanStatsPanelProps {
  strikerId: bigint;
  nonStrikerId: bigint;
  strikerStats: BatsmanStats;
  nonStrikerStats: BatsmanStats;
  players: Player[];
  allPlayers?: Player[];
}

function getPlayerName(players: Player[], id: bigint, fallback?: Player[]): string {
  // Try primary players list first
  const p = players.find((p) => p.id === id);
  if (p) return p.name;
  // Try fallback list (all players combined)
  if (fallback) {
    const fb = fallback.find((p) => p.id === id);
    if (fb) return fb.name;
  }
  return "Unknown";
}

function BatsmanCard({
  stats,
  name,
  isStriker,
}: {
  stats: BatsmanStats;
  name: string;
  isStriker: boolean;
}) {
  const sr =
    stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.00";

  return (
    <div
      className={`rounded-lg border p-3 ${
        isStriker ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isStriker ? "bg-primary" : "bg-muted-foreground"
            }`}
          />
          <span className="font-medium text-sm">{name}</span>
        </div>
        {isStriker && (
          <span className="text-xs text-destructive font-bold">*</span>
        )}
      </div>
      <div className="mt-1">
        <span className="text-2xl font-bold">{stats.runs}</span>
        <span className="text-sm text-muted-foreground ml-1">
          ({stats.balls})
        </span>
      </div>
      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
        <span>4s</span>
        <span>6s</span>
        <span>SR</span>
      </div>
      <div className="flex gap-4 text-sm font-semibold">
        <span>{stats.fours}</span>
        <span>{stats.sixes}</span>
        <span>{sr}</span>
      </div>
    </div>
  );
}

export default function BatsmanStatsPanel({
  strikerId,
  nonStrikerId,
  strikerStats,
  nonStrikerStats,
  players,
  allPlayers,
}: BatsmanStatsPanelProps) {
  const strikerName = getPlayerName(players, strikerId, allPlayers);
  const nonStrikerName = getPlayerName(players, nonStrikerId, allPlayers);

  return (
    <div className="bg-card rounded-xl p-4 border border-border space-y-3">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
        Batsmen
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <BatsmanCard stats={strikerStats} name={strikerName} isStriker={true} />
        <BatsmanCard
          stats={nonStrikerStats}
          name={nonStrikerName}
          isStriker={false}
        />
      </div>
    </div>
  );
}
