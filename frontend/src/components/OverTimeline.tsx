import { Card, CardContent } from '@/components/ui/card';
import type { Delivery } from '../backend';

interface OverTimelineProps {
  deliveries: Delivery[];
  currentOver: number;
}

function getBallLabel(d: Delivery): string {
  if (d.isWide) return 'Wd';
  if (d.isNoBall) return 'Nb';
  if (d.wicket != null) return 'W';
  if (d.isBye) return `B${d.runs}`;
  if (d.isLegBye) return `Lb${d.runs}`;
  const r = Number(d.runs);
  if (r === 4) return '4';
  if (r === 6) return '6';
  return r.toString();
}

function getBallColor(d: Delivery): string {
  if (d.wicket != null) return 'bg-destructive text-destructive-foreground';
  if (d.isWide || d.isNoBall) return 'bg-yellow-500 text-white';
  const r = Number(d.runs);
  if (r === 6) return 'bg-purple-600 text-white';
  if (r === 4) return 'bg-blue-500 text-white';
  if (r === 0) return 'bg-muted text-muted-foreground';
  return 'bg-primary/20 text-primary';
}

export default function OverTimeline({ deliveries, currentOver }: OverTimelineProps) {
  // Group deliveries into overs
  // Legal balls count toward over; extras (wide/noball) don't count but are shown
  const overs: Delivery[][] = [];
  let legalCount = 0;

  for (const d of deliveries) {
    const overIndex = Math.floor(legalCount / 6);
    if (!overs[overIndex]) overs[overIndex] = [];
    overs[overIndex].push(d);
    if (!d.isWide && !d.isNoBall) {
      legalCount++;
    }
  }

  if (overs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-3 pb-3">
          <p className="text-xs text-muted-foreground text-center">No balls bowled yet</p>
        </CardContent>
      </Card>
    );
  }

  // Show last 3 overs
  const displayOvers = overs.slice(-3);
  const startOverIndex = overs.length - displayOvers.length;

  return (
    <Card>
      <CardContent className="pt-3 pb-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Over Timeline</p>
        {displayOvers.map((overDeliveries, idx) => {
          const overNum = startOverIndex + idx + 1;
          const legalInOver = overDeliveries.filter(d => !d.isWide && !d.isNoBall).length;
          const overRuns = overDeliveries.reduce((sum, d) => {
            return sum + Number(d.runs) + (d.isWide ? 1 : 0) + (d.isNoBall ? 1 : 0);
          }, 0);

          return (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-12 shrink-0">
                Over {overNum}
              </span>
              <div className="flex gap-1 flex-wrap flex-1">
                {overDeliveries.map((d, ballIdx) => (
                  <div
                    key={ballIdx}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getBallColor(d)}`}
                    title={d.isWide ? 'Wide' : d.isNoBall ? 'No Ball' : `${d.runs} runs`}
                  >
                    {getBallLabel(d)}
                  </div>
                ))}
                {/* Fill remaining legal ball slots */}
                {Array.from({ length: Math.max(0, 6 - legalInOver) }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-muted-foreground w-8 text-right shrink-0">
                {overRuns}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
