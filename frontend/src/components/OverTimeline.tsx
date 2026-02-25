import type { BallByBallRecord } from '../backend';
import { getBallLabel, getBallColor } from '../lib/matchUtils';

interface OverTimelineProps {
  balls: BallByBallRecord[];
  currentOver: number;
}

export default function OverTimeline({ balls, currentOver }: OverTimelineProps) {
  const currentOverBalls = balls.filter(b => Number(b.overNumber) === currentOver);

  return (
    <div className="bg-card rounded-lg px-3 py-2 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Over {currentOver}
        </span>
        <span className="text-xs text-muted-foreground">
          {currentOverBalls.filter(b => !b.isWide && !b.isNoBall).length}/6 balls
        </span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {currentOverBalls.map((ball, idx) => (
          <div
            key={idx}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getBallColor(ball)}`}
          >
            {getBallLabel(ball)}
          </div>
        ))}
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 6 - currentOverBalls.filter(b => !b.isWide && !b.isNoBall).length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30"
          />
        ))}
      </div>
    </div>
  );
}
