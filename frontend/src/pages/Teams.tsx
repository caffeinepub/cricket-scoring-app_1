import { useState } from "react";
import {
  Users,
  Plus,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTeams, useAddTeam, useAddPlayer } from "@/hooks/useQueries";
import BulkPlayerUploadModal from "@/components/BulkPlayerUploadModal";
import QueryErrorState from "@/components/QueryErrorState";
import type { Team } from "@/backend";

export default function Teams() {
  const { data: teams, isLoading, isError, error, refetch } = useTeams();
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [addPlayerTeamId, setAddPlayerTeamId] = useState<bigint | null>(null);
  const [bulkUploadTeam, setBulkUploadTeam] = useState<Team | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Teams</h2>
        </div>
        <QueryErrorState
          error={error}
          title="Failed to load teams"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const teamList = teams ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Teams</h2>
          <p className="text-sm text-muted-foreground">
            {teamList.length} team{teamList.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddTeam(true)}>
          <Plus size={16} className="mr-1" />
          Add Team
        </Button>
      </div>

      {/* Team list */}
      {teamList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users size={48} className="mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No teams yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Add your first team to get started
            </p>
            <Button className="mt-4" size="sm" onClick={() => setShowAddTeam(true)}>
              Add Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {teamList.map((team) => (
            <TeamCard
              key={team.id.toString()}
              team={team}
              isExpanded={expandedTeam === team.id.toString()}
              onToggle={() =>
                setExpandedTeam(
                  expandedTeam === team.id.toString() ? null : team.id.toString()
                )
              }
              onAddPlayer={() => setAddPlayerTeamId(team.id)}
              onBulkUpload={() => setBulkUploadTeam(team)}
            />
          ))}
        </div>
      )}

      {/* Add Team Dialog */}
      <AddTeamDialog open={showAddTeam} onOpenChange={setShowAddTeam} />

      {/* Add Player Dialog */}
      {addPlayerTeamId !== null && (
        <AddPlayerDialog
          teamId={addPlayerTeamId}
          open={addPlayerTeamId !== null}
          onOpenChange={(open) => !open && setAddPlayerTeamId(null)}
        />
      )}

      {/* Bulk Upload Modal — requires currentPlayers */}
      {bulkUploadTeam !== null && (
        <BulkPlayerUploadModal
          teamId={bulkUploadTeam.id}
          currentPlayers={bulkUploadTeam.players}
          open={bulkUploadTeam !== null}
          onOpenChange={(open) => !open && setBulkUploadTeam(null)}
        />
      )}
    </div>
  );
}

function TeamCard({
  team,
  isExpanded,
  onToggle,
  onAddPlayer,
  onBulkUpload,
}: {
  team: Team;
  isExpanded: boolean;
  onToggle: () => void;
  onAddPlayer: () => void;
  onBulkUpload: () => void;
}) {
  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none py-3 px-4"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: team.color || "#6b7280" }}
            >
              {team.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-base">{team.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {team.players.length} player{team.players.length !== 1 ? "s" : ""}
                {team.squad.length > 0 && ` • ${team.squad.length} in squad`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {team.players.length} players
            </Badge>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 px-4 pb-4">
          <div className="flex gap-2 mb-3">
            <Button size="sm" variant="outline" onClick={onAddPlayer}>
              <UserPlus size={14} className="mr-1" />
              Add Player
            </Button>
            <Button size="sm" variant="outline" onClick={onBulkUpload}>
              <Plus size={14} className="mr-1" />
              Bulk Add
            </Button>
          </div>

          {team.players.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No players yet. Add players to this team.
            </p>
          ) : (
            <div className="space-y-1">
              {team.players
                .slice()
                .sort((a, b) => Number(a.battingOrder) - Number(b.battingOrder))
                .map((player) => (
                  <div
                    key={player.id.toString()}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-5 text-right text-xs">
                        {Number(player.battingOrder)}
                      </span>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    {player.isBowler && (
                      <Badge variant="secondary" className="text-xs">
                        Bowler
                      </Badge>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function AddTeamDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#1e3a5f");
  const addTeam = useAddTeam();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addTeam.mutateAsync({ name: name.trim(), color, logo: "" });
      setName("");
      setColor("#1e3a5f");
      onOpenChange(false);
    } catch {
      // error shown via mutation state
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mumbai Indians"
              required
            />
            <p className="text-xs text-muted-foreground">
              Must be 3–50 characters and contain a space
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-color">Team Color</Label>
            <div className="flex items-center gap-3">
              <input
                id="team-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-border"
              />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>
          {addTeam.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {addTeam.error instanceof Error
                  ? addTeam.error.message
                  : "Failed to add team"}
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addTeam.isPending || !name.trim()}>
              {addTeam.isPending && (
                <Loader2 size={14} className="mr-1 animate-spin" />
              )}
              Add Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddPlayerDialog({
  teamId,
  open,
  onOpenChange,
}: {
  teamId: bigint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [isBowler, setIsBowler] = useState(false);
  const addPlayer = useAddPlayer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addPlayer.mutateAsync({
        teamId,
        name: name.trim(),
        battingOrder: BigInt(1),
        isBowler,
      });
      setName("");
      setIsBowler(false);
      onOpenChange(false);
    } catch {
      // error shown via mutation state
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Player</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="player-name">Player Name</Label>
            <Input
              id="player-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Virat Kohli"
              required
            />
            <p className="text-xs text-muted-foreground">
              Must be 3–50 characters and contain a space
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="is-bowler"
              type="checkbox"
              checked={isBowler}
              onChange={(e) => setIsBowler(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="is-bowler">This player is a bowler</Label>
          </div>
          {addPlayer.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {addPlayer.error instanceof Error
                  ? addPlayer.error.message
                  : "Failed to add player"}
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addPlayer.isPending || !name.trim()}>
              {addPlayer.isPending && (
                <Loader2 size={14} className="mr-1 animate-spin" />
              )}
              Add Player
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
