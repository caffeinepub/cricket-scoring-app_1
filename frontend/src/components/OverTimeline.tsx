interface BallResult {
  runs: number;
  isWide: boolean;
  isNoBall: boolean;
  isWicket: boolean;
  isFreeHit: boolean;
}

interface OverTimelineProps {
  balls: BallResult[];
  maxBalls?: number;
}

function getBallColor(ball: BallResult): string {
  if (ball.isWicket) return "bg-destructive text-white";
  if (ball.isWide || ball.isNoBall) return "bg-warning text-[oklch(0.15_0.02_240)]";
  if (ball.runs === 6) return "bg-[oklch(0.65_0.18_45)] text-white";
  if (ball.runs === 4) return "bg-[oklch(0.55_0.18_145)] text-white";
  if (ball.runs === 0) return "bg-muted text-muted-foreground";
  return "bg-[oklch(0.28_0.06_240)] text-white";
}

function getBallLabel(ball: BallResult): string {
  if (ball.isWicket) return "W";
  if (ball.isWide) return "Wd";
  if (ball.isNoBall) return "Nb";
  return String(ball.runs);
}

export default function OverTimeline({ balls, maxBalls = 6 }: OverTimelineProps) {
  const emptySlots = Math.max(0, maxBalls - balls.length);

  return (
    <div className="cricket-card p-3">
      <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        This Over
      </h3>
      <div className="flex items-center gap-1.5 flex-wrap">
        {balls.map((ball, idx) => (
          <div
            key={idx}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${getBallColor(ball)}`}
          >
            {getBallLabel(ball)}
          </div>
        ))}
        {Array.from({ length: emptySlots }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="w-8 h-8 rounded-full border-2 border-dashed border-border flex items-center justify-center"
          />
        ))}
      </div>
    </div>
  );
}
