import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Player } from '../backend';

interface EndOfInningsModalProps {
  open: boolean;
  inningsNumber: number;
  totalRuns: number;
  wickets: number;
  overs: string;
  battingTeamName: string;
  nextBattingTeamPlayers: Player[];
  nextBowlingTeamPlayers: Player[];
  onStartSecondInnings: (strikerId: bigint, nonStrikerId: bigint, bowlerId: bigint) => void;
  onEndMatch: () => void;
}

export default function EndOfInningsModal({
  open,
  inningsNumber,
  totalRuns,
  wickets,
  overs,
  battingTeamName,
  nextBattingTeamPlayers,
  nextBowlingTeamPlayers,
  onStartSecondInnings,
  onEndMatch,
}: EndOfInningsModalProps) {
  const [strikerId, setStrikerId] = useState('');
  const [nonStrikerId, setNonStrikerId] = useState('');
  const [bowlerId, setBowlerId] = useState('');

  const canStart = strikerId && nonStrikerId && bowlerId && strikerId !== nonStrikerId;

  const handleStart = () => {
    if (!canStart) return;
    const striker = nextBattingTeamPlayers.find(p => p.id.toString() === strikerId);
    const nonStriker = nextBattingTeamPlayers.find(p => p.id.toString() === nonStrikerId);
    const bowler = nextBowlingTeamPlayers.find(p => p.id.toString() === bowlerId);
    if (striker && nonStriker && bowler) {
      onStartSecondInnings(striker.id, nonStriker.id, bowler.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {inningsNumber === 1 ? 'End of 1st Innings' : 'Match Complete'}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-scoreboard-bg rounded-lg p-4 text-center mb-2">
          <p className="text-cricket-cream/70 text-xs mb-1">{battingTeamName}</p>
          <p className="scoreboard-text text-3xl text-cricket-cream">{totalRuns}/{wickets}</p>
          <p className="text-cricket-cream/70 text-sm">({overs} overs)</p>
        </div>

        {inningsNumber === 1 ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Select opening players for 2nd innings:</p>
            <div>
              <Label>Striker</Label>
              <Select value={strikerId} onValueChange={setStrikerId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select striker" />
                </SelectTrigger>
                <SelectContent>
                  {nextBattingTeamPlayers.map(p => (
                    <SelectItem key={p.id.toString()} value={p.id.toString()} disabled={p.id.toString() === nonStrikerId}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Non-Striker</Label>
              <Select value={nonStrikerId} onValueChange={setNonStrikerId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select non-striker" />
                </SelectTrigger>
                <SelectContent>
                  {nextBattingTeamPlayers.map(p => (
                    <SelectItem key={p.id.toString()} value={p.id.toString()} disabled={p.id.toString() === strikerId}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Opening Bowler</Label>
              <Select value={bowlerId} onValueChange={setBowlerId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select bowler" />
                </SelectTrigger>
                <SelectContent>
                  {nextBowlingTeamPlayers.map(p => (
                    <SelectItem key={p.id.toString()} value={p.id.toString()}>
                      {p.name} {p.isBowler ? '(Bowler)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">The match has concluded.</p>
        )}

        <DialogFooter className="gap-2">
          {inningsNumber === 1 ? (
            <>
              <Button variant="outline" onClick={onEndMatch}>End Match</Button>
              <Button
                onClick={handleStart}
                disabled={!canStart}
                className="bg-cricket-green text-cricket-cream hover:bg-cricket-green-dark"
              >
                Start 2nd Innings
              </Button>
            </>
          ) : (
            <Button
              onClick={onEndMatch}
              className="w-full bg-cricket-green text-cricket-cream hover:bg-cricket-green-dark"
            >
              View Scorecard
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
