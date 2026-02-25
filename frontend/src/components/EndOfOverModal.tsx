import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Player } from '../backend';

interface EndOfOverModalProps {
  open: boolean;
  overNumber: number;
  bowlingTeamPlayers: Player[];
  currentBowlerId: bigint;
  maxOversPerBowler: number;
  bowlerOverCounts: Map<string, number>;
  onSelectBowler: (bowlerId: bigint) => void;
}

export default function EndOfOverModal({
  open,
  overNumber,
  bowlingTeamPlayers,
  currentBowlerId,
  maxOversPerBowler,
  bowlerOverCounts,
  onSelectBowler,
}: EndOfOverModalProps) {
  const [selectedBowlerId, setSelectedBowlerId] = useState('');

  const eligibleBowlers = bowlingTeamPlayers.filter(p => {
    const overs = bowlerOverCounts.get(p.id.toString()) ?? 0;
    return overs < maxOversPerBowler && p.id !== currentBowlerId;
  });

  const handleConfirm = () => {
    if (!selectedBowlerId) return;
    const bowler = bowlingTeamPlayers.find(p => p.id.toString() === selectedBowlerId);
    if (bowler) {
      onSelectBowler(bowler.id);
      setSelectedBowlerId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">End of Over {overNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Select the bowler for the next over.</p>
          <div>
            <Label>Next Bowler</Label>
            <Select value={selectedBowlerId} onValueChange={setSelectedBowlerId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select bowler" />
              </SelectTrigger>
              <SelectContent>
                {eligibleBowlers.map(p => {
                  const overs = bowlerOverCounts.get(p.id.toString()) ?? 0;
                  return (
                    <SelectItem key={p.id.toString()} value={p.id.toString()}>
                      {p.name} ({overs}/{maxOversPerBowler} overs)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {eligibleBowlers.length === 0 && (
              <p className="text-xs text-destructive mt-1">No eligible bowlers available!</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleConfirm}
            disabled={!selectedBowlerId}
            className="w-full bg-cricket-green text-cricket-cream hover:bg-cricket-green-dark"
          >
            Start Next Over
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
