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
import type { Delivery, Player, WicketType } from "../backend";

interface WicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  dismissedBatsmanId: bigint;
  battingTeamPlayers: Player[];
  allPlayers: Player[];
  availableBatsmen?: Player[];
  onConfirm: (
    dismissedId: bigint,
    newBatsmanId: bigint,
    wicketType: Delivery["wicket"]
  ) => void;
}

const WICKET_TYPES = [
  { label: "Bowled", value: "Bowled" },
  { label: "Caught", value: "Caught" },
  { label: "LBW", value: "LBW" },
  { label: "Run Out", value: "RunOut" },
  { label: "Stumped", value: "Stumped" },
  { label: "Hit Wicket", value: "HitWicket" },
];

function buildWicketType(value: string): WicketType {
  switch (value) {
    case "Bowled":
      return { __kind__: "Bowled", Bowled: null };
    case "Caught":
      return { __kind__: "Caught", Caught: null };
    case "LBW":
      return { __kind__: "LBW", LBW: null };
    case "RunOut":
      return { __kind__: "RunOut", RunOut: null };
    case "Stumped":
      return { __kind__: "Stumped", Stumped: null };
    case "HitWicket":
      return { __kind__: "HitWicket", HitWicket: null };
    default:
      return { __kind__: "Other", Other: value };
  }
}

export default function WicketModal({
  isOpen,
  onClose,
  dismissedBatsmanId,
  battingTeamPlayers,
  allPlayers,
  availableBatsmen,
  onConfirm,
}: WicketModalProps) {
  const [wicketType, setWicketType] = useState<string>("");
  const [newBatsman, setNewBatsman] = useState<string>("");

  const batsmanList = availableBatsmen ?? battingTeamPlayers;
  const dismissedName =
    allPlayers.find((p) => p.id === dismissedBatsmanId)?.name ?? "Unknown";

  const handleConfirm = () => {
    if (!wicketType || !newBatsman) return;
    onConfirm(
      dismissedBatsmanId,
      BigInt(newBatsman),
      buildWicketType(wicketType)
    );
    setWicketType("");
    setNewBatsman("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Wicket!</DialogTitle>
          <DialogDescription>
            {dismissedName} is out. Select dismissal type and next batsman.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>
              Dismissal Type: <span className="text-destructive">*</span>
            </Label>
            <Select value={wicketType} onValueChange={setWicketType}>
              <SelectTrigger>
                <SelectValue placeholder="Select dismissal type..." />
              </SelectTrigger>
              <SelectContent>
                {WICKET_TYPES.map((wt) => (
                  <SelectItem key={wt.value} value={wt.value}>
                    {wt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Next Batsman: <span className="text-destructive">*</span>
            </Label>
            <Select value={newBatsman} onValueChange={setNewBatsman}>
              <SelectTrigger>
                <SelectValue placeholder="Select next batsman..." />
              </SelectTrigger>
              <SelectContent>
                {batsmanList.map((p) => (
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
            disabled={!wicketType || !newBatsman}
          >
            Confirm Wicket
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
