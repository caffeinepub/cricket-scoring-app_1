import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { WicketType, Player } from "@/backend";
import { Loader2 } from "lucide-react";

interface WicketModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (wicketType: WicketType, nextBatsmanId: bigint) => void;
  dismissedBatsmanId: bigint;
  battingTeamPlayers: bigint[];
  allPlayers: Player[];
  isLoading?: boolean;
}

const WICKET_TYPES: { value: WicketType["__kind__"]; label: string }[] = [
  { value: "Bowled", label: "Bowled" },
  { value: "Caught", label: "Caught" },
  { value: "LBW", label: "LBW" },
  { value: "RunOut", label: "Run Out" },
  { value: "Stumped", label: "Stumped" },
  { value: "HitWicket", label: "Hit Wicket" },
];

function makeWicketType(kind: WicketType["__kind__"]): WicketType {
  switch (kind) {
    case "Bowled": return { __kind__: "Bowled", Bowled: null };
    case "Caught": return { __kind__: "Caught", Caught: null };
    case "LBW": return { __kind__: "LBW", LBW: null };
    case "RunOut": return { __kind__: "RunOut", RunOut: null };
    case "Stumped": return { __kind__: "Stumped", Stumped: null };
    case "HitWicket": return { __kind__: "HitWicket", HitWicket: null };
    default: return { __kind__: "Other", Other: "Unknown" };
  }
}

export default function WicketModal({
  open,
  onClose,
  onConfirm,
  dismissedBatsmanId,
  battingTeamPlayers,
  allPlayers,
  isLoading = false,
}: WicketModalProps) {
  const [wicketKind, setWicketKind] = useState<WicketType["__kind__"]>("Bowled");
  const [nextBatsmanId, setNextBatsmanId] = useState<string>("");

  const availableBatsmen = allPlayers.filter(
    (p) => battingTeamPlayers.includes(p.id) && p.id !== dismissedBatsmanId
  );

  const handleConfirm = () => {
    if (!nextBatsmanId) return;
    onConfirm(makeWicketType(wicketKind), BigInt(nextBatsmanId));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Wicket!</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Wicket Type</Label>
            <Select value={wicketKind} onValueChange={(v) => setWicketKind(v as WicketType["__kind__"])}>
              <SelectTrigger className="w-full">
                <SelectValue />
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

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Next Batsman</Label>
            <Select value={nextBatsmanId} onValueChange={setNextBatsmanId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select next batsman" />
              </SelectTrigger>
              <SelectContent>
                {availableBatsmen.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No more batsmen
                  </SelectItem>
                ) : (
                  availableBatsmen.map((p) => (
                    <SelectItem key={String(p.id)} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))
                )}
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
            disabled={!nextBatsmanId || isLoading || availableBatsmen.length === 0}
            className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Confirm Wicket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
