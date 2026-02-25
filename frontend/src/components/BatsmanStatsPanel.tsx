import { Player } from "@/backend";

interface BatsmanStats {
  playerId: bigint;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
}

interface BatsmanStatsPanelProps {
  striker: BatsmanStats | null;
  nonStriker: BatsmanStats | null;
  players: Player[];
}

function getPlayerName(players: Player[], id: bigint): string {
  return players.find((p) => p.id === id)?.name ?? "Unknown";
}

function calcStrikeRate(runs: number, balls: number): string {
  if (balls === 0) return "0.00";
  return ((runs / balls) * 100).toFixed(1);
}

interface StatRowProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

function StatRow({ label, value, highlight }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-[oklch(0.65_0.18_45)]" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

interface BatsmanCardProps {
  stats: BatsmanStats;
  name: string;
  isStriker: boolean;
}

function BatsmanCard({ stats, name, isStriker }: BatsmanCardProps) {
  return (
    <div className={`flex-1 rounded-lg p-3 border ${isStriker ? "border-[oklch(0.65_0.18_45)] bg-[oklch(0.65_0.18_45)]/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-1.5 mb-2">
        {isStriker && (
          <span className="w-2 h-2 rounded-full bg-[oklch(0.65_0.18_45)] flex-shrink-0" />
        )}
        <p className="font-semibold text-sm truncate">{name}</p>
        {isStriker && (
          <span className="ml-auto text-[10px] font-bold text-[oklch(0.65_0.18_45)] bg-[oklch(0.65_0.18_45)]/10 px-1.5 py-0.5 rounded-full">
            *
          </span>
        )}
      </div>
      <div className="score-display text-2xl font-bold text-foreground leading-none mb-1">
        {stats.runs}
        <span className="text-muted-foreground text-sm font-normal ml-1">({stats.balls})</span>
      </div>
      <div className="flex gap-3 mt-1.5">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">4s</p>
          <p className="text-sm font-bold">{stats.fours}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">6s</p>
          <p className="text-sm font-bold">{stats.sixes}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">SR</p>
          <p className="text-sm font-bold">{calcStrikeRate(stats.runs, stats.balls)}</p>
        </div>
      </div>
    </div>
  );
}

export default function BatsmanStatsPanel({ striker, nonStriker, players }: BatsmanStatsPanelProps) {
  if (!striker && !nonStriker) {
    return (
      <div className="cricket-card p-3">
        <p className="text-muted-foreground text-sm text-center">No batsmen at crease</p>
      </div>
    );
  }

  return (
    <div className="cricket-card p-3">
      <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Batsmen
      </h3>
      <div className="flex gap-2">
        {striker && (
          <BatsmanCard
            stats={striker}
            name={getPlayerName(players, striker.playerId)}
            isStriker={true}
          />
        )}
        {nonStriker && (
          <BatsmanCard
            stats={nonStriker}
            name={getPlayerName(players, nonStriker.playerId)}
            isStriker={false}
          />
        )}
      </div>
    </div>
  );
}
