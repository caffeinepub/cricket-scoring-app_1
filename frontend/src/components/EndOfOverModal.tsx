import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Player } from "../backend";

interface EndOfOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  bowlingTeamPlayers: Player[];
  allPlayers: Player[];
  overNumber: number;
  onConfirm: (newBowlerId: bigint) => void;
  currentBowlerId?: bigint;
  availableBowlers?: Player[];
}

export default function EndOfOverModal({
  isOpen,
  onClose,
  bowlingTeamPlayers,
  allPlayers,
  overNumber,
  onConfirm,
  currentBowlerId,
  availableBowlers,
}: EndOfOverModalProps) {
  const [selectedBowler, setSelectedBowler] = useState<string>("");

  const bowlerList = availableBowlers ?? bowlingTeamPlayers;

  const handleConfirm = () => {
    if (!selectedBowler) return;
    onConfirm(BigInt(selectedBowler));
    setSelectedBowler("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>End of Over {overNumber - 1}</DialogTitle>
          <DialogDescription>
            Over {overNumber - 1} complete. Select the bowler for the next
            over.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>
              Next Bowler: <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedBowler} onValueChange={setSelectedBowler}>
              <SelectTrigger>
                <SelectValue placeholder="Select next bowler..." />
              </SelectTrigger>
              <SelectContent>
                {bowlerList.map((p) => (
                  <SelectItem
                    key={p.id.toString()}
                    value={p.id.toString()}
                    disabled={p.id === currentBowlerId}
                  >
                    {p.name}
                    {p.id === currentBowlerId ? " (current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={handleConfirm}
            disabled={!selectedBowler}
          >
            Start Over {overNumber}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
