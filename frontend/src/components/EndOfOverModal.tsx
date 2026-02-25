import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
  DialogPortal,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Player } from '@/backend';

interface EndOfOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (nextBowlerId: bigint) => void;
  currentBowlerId: bigint | null;
  bowlingTeamPlayers: bigint[];
  allPlayers: Player[];
  overNumber: number;
}

export default function EndOfOverModal({
  isOpen,
  onClose,
  onConfirm,
  currentBowlerId,
  bowlingTeamPlayers,
  allPlayers,
  overNumber,
}: EndOfOverModalProps) {
  const [selectedBowlerId, setSelectedBowlerId] = useState<string>('');

  useEffect(() => {
    if (isOpen) setSelectedBowlerId('');
  }, [isOpen]);

  const eligibleBowlers = allPlayers.filter(p =>
    bowlingTeamPlayers.some(id => id === p.id) && p.id !== currentBowlerId
  );

  const handleConfirm = () => {
    if (!selectedBowlerId) return;
    onConfirm(BigInt(selectedBowlerId));
    setSelectedBowlerId('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <DialogContent
          className="bg-background border border-border shadow-xl sm:max-w-sm"
          onInteractOutside={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">End of Over {overNumber}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Over {overNumber} complete. Select the bowler for the next over.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium">
                Next Bowler <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedBowlerId} onValueChange={setSelectedBowlerId}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select next bowler..." />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {eligibleBowlers.map(p => (
                    <SelectItem key={p.id.toString()} value={p.id.toString()} className="text-foreground">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleConfirm}
              disabled={!selectedBowlerId}
              className="w-full"
            >
              Start Over {overNumber + 1}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
