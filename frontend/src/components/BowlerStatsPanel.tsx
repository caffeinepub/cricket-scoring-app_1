import { Card, CardContent } from '@/components/ui/card';
import type { BowlerStats } from '../lib/matchUtils';

interface BowlerStatsPanelProps {
  bowler: BowlerStats | null;
}

export default function BowlerStatsPanel({ bowler }: BowlerStatsPanelProps) {
  if (!bowler) return null;

  return (
    <Card className="shadow-card">
      <CardContent className="pt-3 pb-2 px-3">
        <div className="flex justify-between text-[10px] text-muted-foreground px-2 mb-1">
          <span>Bowler</span>
          <div className="flex gap-3">
            <span>O</span>
            <span>M</span>
            <span>R</span>
            <span>W</span>
            <span>Eco</span>
          </div>
        </div>
        <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-cricket-green/10">
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold truncate">{bowler.name}</span>
          </div>
          <div className="flex gap-3 text-right shrink-0">
            <span className="text-sm font-semibold w-6 text-center">{bowler.overs}</span>
            <span className="text-sm font-semibold w-4 text-center">{bowler.maidens}</span>
            <span className="text-sm font-semibold w-6 text-center">{bowler.runs}</span>
            <span className="text-sm font-semibold w-4 text-center">{bowler.wickets}</span>
            <span className="text-sm font-semibold w-8 text-center">{bowler.economy}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
