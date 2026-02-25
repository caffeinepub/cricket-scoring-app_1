import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Player } from "@/backend";
import { Loader2 } from "lucide-react";

interface EndOfInningsModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (strikerId: bigint, nonStrikerId: bigint, bowlerId: bigint) => void;
  battingTeamPlayers: bigint[];
  bowlingTeamPlayers: bigint[];
  allPlayers: Player[];
  isLoading?: boolean;
}

export default function EndOfInningsModal({
  open,
  onClose,
  onConfirm,
  battingTeamPlayers,
  bowlingTeamPlayers,
  allPlayers,
  isLoading = false,
}: EndOfInningsModalProps) {
  const [strikerId, setStrikerId] = useState<string>("");
  const [nonStrikerId, setNonStrikerId] = useState<string>("");
  const [bowlerId, setBowlerId] = useState<string>("");

  const battingPlayers = allPlayers.filter((p) => battingTeamPlayers.includes(p.id));
  const bowlingPlayers = allPlayers.filter((p) => bowlingTeamPlayers.includes(p.id));

  const handleConfirm = () => {
    if (!strikerId || !nonStrikerId || !bowlerId) return;
    onConfirm(BigInt(strikerId), BigInt(nonStrikerId), BigInt(bowlerId));
  };

  const canConfirm = strikerId && nonStrikerId && bowlerId && strikerId !== nonStrikerId;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">2nd Innings — Select Openers</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Opening Striker</Label>
            <Select value={strikerId} onValueChange={setStrikerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select striker" />
              </SelectTrigger>
              <SelectContent>
                {battingPlayers.map((p) => (
                  <SelectItem key={String(p.id)} value={String(p.id)} disabled={p.id === BigInt(nonStrikerId || -1)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Opening Non-Striker</Label>
            <Select value={nonStrikerId} onValueChange={setNonStrikerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select non-striker" />
              </SelectTrigger>
              <SelectContent>
                {battingPlayers.map((p) => (
                  <SelectItem key={String(p.id)} value={String(p.id)} disabled={p.id === BigInt(strikerId || -1)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Opening Bowler</Label>
            <Select value={bowlerId} onValueChange={setBowlerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select bowler" />
              </SelectTrigger>
              <SelectContent>
                {bowlingPlayers.map((p) => (
                  <SelectItem key={String(p.id)} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            className="flex-1"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Start 2nd Innings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
