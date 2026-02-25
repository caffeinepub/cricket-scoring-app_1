import { Player } from "@/backend";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PlayingElevenSelectorProps {
  players: Player[];
  selected: bigint[];
  onChange: (selected: bigint[]) => void;
  maxSelection?: number;
}

export default function PlayingElevenSelector({
  players,
  selected,
  onChange,
  maxSelection = 11,
}: PlayingElevenSelectorProps) {
  const isComplete = selected.length >= maxSelection;

  const toggle = (playerId: bigint) => {
    if (selected.includes(playerId)) {
      onChange(selected.filter((id) => id !== playerId));
    } else if (!isComplete) {
      onChange([...selected, playerId]);
    }
  };

  return (
    <div className="space-y-2">
      {/* Counter */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm text-muted-foreground">Select playing 11</span>
        <Badge
          variant={isComplete ? "default" : "outline"}
          className={isComplete ? "bg-[oklch(0.55_0.18_145)] text-white border-0" : ""}
        >
          {selected.length} / {maxSelection}
        </Badge>
      </div>

      {/* Player list */}
      <ScrollArea className="h-64 rounded-lg border border-border">
        <div className="p-2 space-y-1">
          {players.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No players in squad
            </p>
          ) : (
            players.map((player) => {
              const isSelected = selected.includes(player.id);
              const isDisabled = !isSelected && isComplete;

              return (
                <label
                  key={String(player.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[oklch(0.65_0.18_45)]/10 border border-[oklch(0.65_0.18_45)]/30"
                      : isDisabled
                      ? "opacity-40 cursor-not-allowed bg-muted/30"
                      : "hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggle(player.id)}
                    disabled={isDisabled}
                    className={isSelected ? "border-[oklch(0.65_0.18_45)] data-[state=checked]:bg-[oklch(0.65_0.18_45)]" : ""}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? "text-foreground" : "text-foreground"}`}>
                      {player.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {player.isBowler ? "Bowler" : "Batsman"} · #{Number(player.battingOrder)}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="text-[oklch(0.65_0.18_45)] text-xs font-bold">✓</span>
                  )}
                </label>
              );
            })
          )}
        </div>
      </ScrollArea>

      {isComplete && (
        <p className="text-xs text-[oklch(0.55_0.18_145)] text-center font-medium">
          ✓ Playing 11 complete
        </p>
      )}
    </div>
  );
}
