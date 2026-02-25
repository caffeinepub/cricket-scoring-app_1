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
import { Badge } from "@/components/ui/badge";
import type { Player } from "../backend";

interface EndOfInningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inningsNumber: number;
  battingTeamPlayers: Player[];
  bowlingTeamPlayers: Player[];
  allPlayers: Player[];
  score: { runs: number; wickets: number };
  onConfirm: (
    strikerId: bigint,
    nonStrikerId: bigint,
    bowlerId: bigint
  ) => void;
}

export default function EndOfInningsModal({
  isOpen,
  onClose,
  inningsNumber,
  battingTeamPlayers,
  bowlingTeamPlayers,
  allPlayers,
  score,
  onConfirm,
}: EndOfInningsModalProps) {
  const [striker, setStriker] = useState<string>("");
  const [nonStriker, setNonStriker] = useState<string>("");
  const [bowler, setBowler] = useState<string>("");

  const handleConfirm = () => {
    if (!striker || !nonStriker || !bowler) return;
    onConfirm(BigInt(striker), BigInt(nonStriker), BigInt(bowler));
    setStriker("");
    setNonStriker("");
    setBowler("");
  };

  const isInnings1End = inningsNumber === 1;

  // For innings 2 setup: batting team is the team that was bowling in innings 1
  // bowlingTeamPlayers here is the team that will bowl in innings 2 (was batting in innings 1)
  // battingTeamPlayers here is the team that will bat in innings 2 (was bowling in innings 1)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isInnings1End ? "End of Innings 1" : "Set Up Innings 1"}
          </DialogTitle>
          <DialogDescription>
            {isInnings1End
              ? `Innings 1 complete. Score: ${score.runs}/${score.wickets}. Set up the second innings.`
              : "Select the opening batsmen and opening bowler to start the innings."}
          </DialogDescription>
        </DialogHeader>

        {isInnings1End && (
          <div className="flex items-center gap-2 py-1">
            <Badge variant="secondary">
              Innings 1: {score.runs}/{score.wickets}
            </Badge>
            <Badge variant="outline">Target: {score.runs + 1}</Badge>
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>
              Striker: <span className="text-destructive">*</span>
            </Label>
            <Select value={striker} onValueChange={setStriker}>
              <SelectTrigger>
                <SelectValue placeholder="Select striker..." />
              </SelectTrigger>
              <SelectContent>
                {battingTeamPlayers.map((p) => (
                  <SelectItem
                    key={p.id.toString()}
                    value={p.id.toString()}
                    disabled={p.id.toString() === nonStriker}
                  >
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Non-Striker: <span className="text-destructive">*</span>
            </Label>
            <Select value={nonStriker} onValueChange={setNonStriker}>
              <SelectTrigger>
                <SelectValue placeholder="Select non-striker..." />
              </SelectTrigger>
              <SelectContent>
                {battingTeamPlayers.map((p) => (
                  <SelectItem
                    key={p.id.toString()}
                    value={p.id.toString()}
                    disabled={p.id.toString() === striker}
                  >
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Opening Bowler: <span className="text-destructive">*</span>
            </Label>
            <Select value={bowler} onValueChange={setBowler}>
              <SelectTrigger>
                <SelectValue placeholder="Select opening bowler..." />
              </SelectTrigger>
              <SelectContent>
                {bowlingTeamPlayers.map((p) => (
                  <SelectItem key={p.id.toString()} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={handleConfirm}
            disabled={!striker || !nonStriker || !bowler}
          >
            {isInnings1End ? "Start Innings 2" : "Start Innings 1"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
