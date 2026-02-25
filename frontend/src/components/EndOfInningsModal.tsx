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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { Player } from '@/backend';

interface EndOfInningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (strikerId: bigint, nonStrikerId: bigint, bowlerId: bigint) => void;
  inningsNumber: number;
  battingTeamPlayers: bigint[];
  bowlingTeamPlayers: bigint[];
  allPlayers: Player[];
  score: string;
  isOpenerSelection?: boolean;
}

export default function EndOfInningsModal({
  isOpen,
  onClose,
  onConfirm,
  inningsNumber,
  battingTeamPlayers,
  bowlingTeamPlayers,
  allPlayers,
  score,
  isOpenerSelection = false,
}: EndOfInningsModalProps) {
  const [strikerId, setStrikerId] = useState<string>('');
  const [nonStrikerId, setNonStrikerId] = useState<string>('');
  const [bowlerId, setBowlerId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setStrikerId('');
      setNonStrikerId('');
      setBowlerId('');
    }
  }, [isOpen]);

  const battingElevenPlayers = allPlayers.filter(p =>
    battingTeamPlayers.some(id => id === p.id)
  );
  const bowlingElevenPlayers = allPlayers.filter(p =>
    bowlingTeamPlayers.some(id => id === p.id)
  );

  const isValid = strikerId !== '' && nonStrikerId !== '' && bowlerId !== '' && strikerId !== nonStrikerId;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(BigInt(strikerId), BigInt(nonStrikerId), BigInt(bowlerId));
  };

  const title = isOpenerSelection
    ? `Innings ${inningsNumber} — Select Opening Players`
    : `Innings ${inningsNumber} Complete`;

  const description = isOpenerSelection
    ? 'Select the opening batsmen (striker and non-striker) and the opening bowler to begin.'
    : `Score: ${score}. Select the opening batsmen and bowler for Innings ${inningsNumber + 1}.`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isOpenerSelection) onClose(); }}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <DialogContent
          className="bg-background border border-border shadow-xl sm:max-w-sm"
          onInteractOutside={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">{title}</DialogTitle>
            <DialogDescription className="text-muted-foreground">{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Striker */}
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium">
                Opener / Striker <span className="text-destructive">*</span>
              </Label>
              <Select value={strikerId} onValueChange={setStrikerId}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select striker..." />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {battingElevenPlayers.map(p => (
                    <SelectItem
                      key={p.id.toString()}
                      value={p.id.toString()}
                      disabled={p.id.toString() === nonStrikerId}
                      className="text-foreground"
                    >
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Non-Striker */}
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium">
                Non-Striker <span className="text-destructive">*</span>
              </Label>
              <Select value={nonStrikerId} onValueChange={setNonStrikerId}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select non-striker..." />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {battingElevenPlayers.map(p => (
                    <SelectItem
                      key={p.id.toString()}
                      value={p.id.toString()}
                      disabled={p.id.toString() === strikerId}
                      className="text-foreground"
                    >
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bowler */}
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium">
                Opening Bowler <span className="text-destructive">*</span>
              </Label>
              <Select value={bowlerId} onValueChange={setBowlerId}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select bowler..." />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {bowlingElevenPlayers.map(p => (
                    <SelectItem key={p.id.toString()} value={p.id.toString()} className="text-foreground">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {strikerId !== '' && nonStrikerId !== '' && strikerId === nonStrikerId && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Striker and non-striker must be different players.</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            {!isOpenerSelection && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button onClick={handleConfirm} disabled={!isValid}>
              {isOpenerSelection ? 'Start Innings' : `Start Innings ${inningsNumber + 1}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
