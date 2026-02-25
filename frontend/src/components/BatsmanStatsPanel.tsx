import { Card, CardContent } from '@/components/ui/card';
import type { BatsmanStats } from '../lib/matchUtils';

interface BatsmanStatsPanelProps {
  striker: BatsmanStats | null;
  nonStriker: BatsmanStats | null;
}

function BatsmanRow({ stats, isStriker }: { stats: BatsmanStats; isStriker: boolean }) {
  return (
    <div className={`flex items-center gap-2 py-1.5 px-2 rounded-lg ${isStriker ? 'bg-cricket-green/10' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold truncate">{stats.name}</span>
          {isStriker && (
            <span className="text-cricket-green text-xs font-bold">*</span>
          )}
        </div>
      </div>
      <div className="flex gap-3 text-right shrink-0">
        <div className="text-center">
          <p className="text-base font-display font-bold leading-none">{stats.runs}</p>
          <p className="text-[10px] text-muted-foreground">({stats.balls})</p>
        </div>
        <div className="text-center hidden sm:block">
          <p className="text-sm font-semibold leading-none">{stats.fours}</p>
          <p className="text-[10px] text-muted-foreground">4s</p>
        </div>
        <div className="text-center hidden sm:block">
          <p className="text-sm font-semibold leading-none">{stats.sixes}</p>
          <p className="text-[10px] text-muted-foreground">6s</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold leading-none">{stats.strikeRate}</p>
          <p className="text-[10px] text-muted-foreground">SR</p>
        </div>
      </div>
    </div>
  );
}

export default function BatsmanStatsPanel({ striker, nonStriker }: BatsmanStatsPanelProps) {
  return (
    <Card className="shadow-card">
      <CardContent className="pt-3 pb-2 px-3">
        <div className="flex justify-between text-[10px] text-muted-foreground px-2 mb-1">
          <span>Batsman</span>
          <div className="flex gap-3">
            <span className="w-10 text-right">R(B)</span>
            <span className="w-5 text-right hidden sm:block">4s</span>
            <span className="w-5 text-right hidden sm:block">6s</span>
            <span className="w-8 text-right">SR</span>
          </div>
        </div>
        {striker && <BatsmanRow stats={striker} isStriker={true} />}
        {nonStriker && <BatsmanRow stats={nonStriker} isStriker={false} />}
        {!striker && !nonStriker && (
          <p className="text-sm text-muted-foreground text-center py-2">No batsmen data</p>
        )}
      </CardContent>
    </Card>
  );
}
