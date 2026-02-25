import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Delivery } from '@/backend';

interface ScoreDisplayProps {
  battingTeamName: string;
  bowlingTeamName: string;
  runs: number;
  wickets: number;
  overs: string;
  oversLimit: number;
  innings: number;
  target?: number | null;
  runsRequired?: number | null;
  innings1Summary?: string;
}

/**
 * Compute total runs from a deliveries array (including extras).
 * Each delivery's `runs` field already encodes the full run value
 * (e.g. wide = 1 run, no-ball = 1 run, etc.).
 */
export function computeTotalRunsFromDeliveries(deliveries: Delivery[]): number {
  return deliveries.reduce((sum, d) => sum + Number(d.runs), 0);
}

export default function ScoreDisplay({
  battingTeamName,
  bowlingTeamName,
  runs,
  wickets,
  overs,
  oversLimit,
  innings,
  target,
  runsRequired,
  innings1Summary,
}: ScoreDisplayProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="pt-4 pb-4">
        {/* Innings indicator */}
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            Innings {innings}
          </Badge>
          {innings1Summary && (
            <span className="text-xs text-muted-foreground">{innings1Summary}</span>
          )}
        </div>

        {/* Main score */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground mb-1">{battingTeamName}</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl font-bold tabular-nums">{runs}</span>
            <span className="text-2xl text-muted-foreground">/{wickets}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {overs} / {oversLimit} overs
          </p>
        </div>

        {/* Target info for innings 2 */}
        {innings === 2 && target != null && (
          <div className="mt-3 pt-3 border-t border-primary/20">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Target</span>
              <span className="font-semibold">{target}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Required</span>
              <span className={`font-semibold ${runsRequired === 0 ? 'text-green-600' : ''}`}>
                {runsRequired} runs
              </span>
            </div>
          </div>
        )}

        {/* Bowling team */}
        <p className="text-xs text-center text-muted-foreground mt-2">
          Bowling: {bowlingTeamName}
        </p>
      </CardContent>
    </Card>
  );
}
