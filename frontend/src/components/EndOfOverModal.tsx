import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Player } from "@/backend";
import { Loader2 } from "lucide-react";

interface EndOfOverModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (nextBowlerId: bigint) => void;
  currentBowlerId: bigint | null;
  bowlingTeamPlayers: bigint[];
  allPlayers: Player[];
  isLoading?: boolean;
}

export default function EndOfOverModal({
  open,
  onClose,
  onConfirm,
  currentBowlerId,
  bowlingTeamPlayers,
  allPlayers,
  isLoading = false,
}: EndOfOverModalProps) {
  const [nextBowlerId, setNextBowlerId] = useState<string>("");

  const availableBowlers = allPlayers.filter(
    (p) =>
      bowlingTeamPlayers.includes(p.id) &&
      (currentBowlerId === null || p.id !== currentBowlerId)
  );

  const handleConfirm = () => {
    if (!nextBowlerId) return;
    onConfirm(BigInt(nextBowlerId));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">End of Over</DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-1.5">
          <Label className="text-sm font-medium">Next Bowler</Label>
          <Select value={nextBowlerId} onValueChange={setNextBowlerId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select next bowler" />
            </SelectTrigger>
            <SelectContent>
              {availableBowlers.length === 0 ? (
                <SelectItem value="none" disabled>
                  No bowlers available
                </SelectItem>
              ) : (
                availableBowlers.map((p) => (
                  <SelectItem key={String(p.id)} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!nextBowlerId || isLoading}
            className="flex-1"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Start Next Over
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
