import React, { useState } from 'react';
import { useGetAllTeams, useAddTeam, useAddPlayer } from '@/hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Users, Plus, UserPlus, Upload, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import BulkPlayerUploadModal from '@/components/BulkPlayerUploadModal';
import type { Team } from '@/backend';

const Teams: React.FC = () => {
  const { data: teams = [], isLoading, refetch } = useGetAllTeams();
  const addTeamMutation = useAddTeam();
  const addPlayerMutation = useAddPlayer();

  // Add Team Dialog
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('#1e3a5f');
  const [teamError, setTeamError] = useState('');

  // Expanded teams
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  // Add Player state per team
  const [playerInputs, setPlayerInputs] = useState<Record<string, string>>({});
  const [playerErrors, setPlayerErrors] = useState<Record<string, string>>({});

  // Bulk Upload Modal
  const [bulkUploadTeam, setBulkUploadTeam] = useState<Team | null>(null);

  const toggleTeam = (teamId: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  const handleAddTeam = async () => {
    setTeamError('');
    if (!teamName.trim()) {
      setTeamError('Team name is required');
      return;
    }
    try {
      await addTeamMutation.mutateAsync({ name: teamName.trim(), color: teamColor, logo: '' });
      setTeamName('');
      setTeamColor('#1e3a5f');
      setAddTeamOpen(false);
    } catch (err: unknown) {
      setTeamError(err instanceof Error ? err.message : 'Failed to add team');
    }
  };

  const handleAddPlayer = async (teamId: bigint, teamKey: string, currentCount: number) => {
    const name = playerInputs[teamKey]?.trim() || '';
    setPlayerErrors((prev) => ({ ...prev, [teamKey]: '' }));

    if (!name) {
      setPlayerErrors((prev) => ({ ...prev, [teamKey]: 'Player name is required' }));
      return;
    }

    try {
      await addPlayerMutation.mutateAsync({
        teamId,
        name,
        battingOrder: BigInt(currentCount + 1),
        isBowler: false,
      });
      setPlayerInputs((prev) => ({ ...prev, [teamKey]: '' }));
    } catch (err: unknown) {
      setPlayerErrors((prev) => ({
        ...prev,
        [teamKey]: err instanceof Error ? err.message : 'Failed to add player',
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center space-y-3">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto"
            style={{ borderColor: 'oklch(0.65 0.18 45)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm font-medium" style={{ color: 'oklch(0.5 0.03 240)' }}>
            Loading teams...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Page Header */}
      <div
        className="rounded-2xl p-5 shadow-navy-md"
        style={{
          background: 'linear-gradient(135deg, oklch(0.22 0.07 240), oklch(0.15 0.06 240))',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: 'oklch(0.97 0.005 240)' }}>
              Teams
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'oklch(0.75 0.03 240)' }}>
              {teams.length} team{teams.length !== 1 ? 's' : ''} registered
            </p>
          </div>
          <Button
            onClick={() => setAddTeamOpen(true)}
            className="flex items-center gap-2 font-semibold shadow-orange-glow"
            style={{
              background: 'oklch(0.65 0.18 45)',
              color: 'oklch(0.1 0.02 240)',
              border: 'none',
            }}
          >
            <Plus size={16} />
            Add Team
          </Button>
        </div>
      </div>

      {/* Teams List */}
      {teams.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: 'oklch(1 0 0)',
            border: '2px dashed oklch(0.88 0.015 240)',
          }}
        >
          <Shield size={48} className="mx-auto mb-4" style={{ color: 'oklch(0.75 0.03 240)' }} />
          <h3 className="font-display text-xl font-bold mb-2" style={{ color: 'oklch(0.22 0.07 240)' }}>
            No Teams Yet
          </h3>
          <p className="text-sm mb-5" style={{ color: 'oklch(0.5 0.03 240)' }}>
            Create your first team to get started with the tournament.
          </p>
          <Button
            onClick={() => setAddTeamOpen(true)}
            style={{
              background: 'oklch(0.65 0.18 45)',
              color: 'oklch(0.1 0.02 240)',
              fontWeight: 600,
            }}
          >
            <Plus size={16} className="mr-2" />
            Create First Team
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => {
            const teamKey = team.id.toString();
            const isExpanded = expandedTeams.has(teamKey);
            const playerCount = team.players.length;
            const isFull = playerCount >= 11;

            return (
              <div
                key={teamKey}
                className="rounded-xl overflow-hidden shadow-card"
                style={{
                  background: 'oklch(1 0 0)',
                  border: '1px solid oklch(0.88 0.015 240)',
                }}
              >
                {/* Team Header */}
                <button
                  className="w-full flex items-center gap-3 p-4 text-left transition-colors duration-150"
                  style={{ background: 'transparent' }}
                  onClick={() => toggleTeam(teamKey)}
                >
                  {/* Color swatch */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-navy-sm"
                    style={{ background: team.color || 'oklch(0.22 0.07 240)' }}
                  >
                    <Shield size={18} style={{ color: 'oklch(0.97 0.005 240)' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-bold truncate" style={{ color: 'oklch(0.22 0.07 240)' }}>
                      {team.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: 'oklch(0.5 0.03 240)' }}>
                        {playerCount}/11 players
                      </span>
                      {isFull && (
                        <Badge
                          className="text-xs px-2 py-0"
                          style={{
                            background: 'oklch(0.55 0.15 145 / 0.12)',
                            color: 'oklch(0.45 0.15 145)',
                            border: '1px solid oklch(0.55 0.15 145 / 0.3)',
                          }}
                        >
                          Full Squad
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Player count bar */}
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.01 240)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(playerCount / 11) * 100}%`,
                          background: isFull ? 'oklch(0.55 0.15 145)' : 'oklch(0.65 0.18 45)',
                        }}
                      />
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={16} style={{ color: 'oklch(0.5 0.03 240)' }} />
                    ) : (
                      <ChevronDown size={16} style={{ color: 'oklch(0.5 0.03 240)' }} />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div
                    className="border-t px-4 pb-4 pt-3 space-y-4"
                    style={{ borderColor: 'oklch(0.93 0.01 240)' }}
                  >
                    {/* Players List */}
                    {team.players.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'oklch(0.5 0.03 240)' }}>
                          Squad
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {team.players.map((player, idx) => (
                            <div
                              key={player.id.toString()}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg"
                              style={{ background: 'oklch(0.97 0.005 240)' }}
                            >
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{
                                  background: 'oklch(0.22 0.07 240)',
                                  color: 'oklch(0.97 0.005 240)',
                                }}
                              >
                                {idx + 1}
                              </span>
                              <span className="text-sm font-medium truncate" style={{ color: 'oklch(0.22 0.07 240)' }}>
                                {player.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div
                        className="text-center py-4 rounded-lg"
                        style={{ background: 'oklch(0.97 0.005 240)' }}
                      >
                        <Users size={24} className="mx-auto mb-1.5" style={{ color: 'oklch(0.75 0.03 240)' }} />
                        <p className="text-sm" style={{ color: 'oklch(0.5 0.03 240)' }}>
                          No players yet. Add players below.
                        </p>
                      </div>
                    )}

                    {/* Add Player Section */}
                    {!isFull && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'oklch(0.5 0.03 240)' }}>
                          Add Players
                        </p>

                        {/* Individual Add */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Full name (e.g. John Smith)"
                            value={playerInputs[teamKey] || ''}
                            onChange={(e) =>
                              setPlayerInputs((prev) => ({ ...prev, [teamKey]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddPlayer(team.id, teamKey, playerCount);
                            }}
                            className="flex-1 text-sm"
                            style={{
                              border: '1px solid oklch(0.88 0.015 240)',
                              borderRadius: '0.5rem',
                            }}
                          />
                          <Button
                            onClick={() => handleAddPlayer(team.id, teamKey, playerCount)}
                            disabled={addPlayerMutation.isPending}
                            size="sm"
                            style={{
                              background: 'oklch(0.22 0.07 240)',
                              color: 'oklch(0.97 0.005 240)',
                              fontWeight: 600,
                            }}
                          >
                            {addPlayerMutation.isPending ? (
                              <span className="animate-spin">⟳</span>
                            ) : (
                              <UserPlus size={15} />
                            )}
                          </Button>
                        </div>

                        {playerErrors[teamKey] && (
                          <p className="text-xs" style={{ color: 'oklch(0.45 0.18 25)' }}>
                            {playerErrors[teamKey]}
                          </p>
                        )}

                        {/* Bulk Upload Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full flex items-center gap-2 font-semibold"
                          onClick={() => setBulkUploadTeam(team)}
                          style={{
                            border: '1.5px dashed oklch(0.65 0.18 45 / 0.5)',
                            color: 'oklch(0.55 0.15 45)',
                            background: 'oklch(0.65 0.18 45 / 0.04)',
                          }}
                        >
                          <Upload size={14} />
                          Bulk Add Players
                        </Button>
                      </div>
                    )}

                    {isFull && (
                      <div
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                        style={{
                          background: 'oklch(0.55 0.15 145 / 0.08)',
                          color: 'oklch(0.45 0.15 145)',
                          border: '1px solid oklch(0.55 0.15 145 / 0.2)',
                        }}
                      >
                        <Shield size={14} />
                        Squad is complete (11/11 players)
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Team Dialog */}
      <Dialog open={addTeamOpen} onOpenChange={setAddTeamOpen}>
        <DialogContent
          style={{
            background: 'oklch(1 0 0)',
            border: '1px solid oklch(0.88 0.015 240)',
            borderRadius: '0.75rem',
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl" style={{ color: 'oklch(0.22 0.07 240)' }}>
              Create New Team
            </DialogTitle>
            <DialogDescription style={{ color: 'oklch(0.5 0.03 240)' }}>
              Enter the team name and choose a color to represent the team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'oklch(0.22 0.07 240)' }}>
                Team Name *
              </label>
              <Input
                placeholder="e.g. Mumbai Indians"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                style={{ border: '1px solid oklch(0.88 0.015 240)' }}
              />
              <p className="text-xs mt-1" style={{ color: 'oklch(0.6 0.03 240)' }}>
                Must be 3–50 characters with at least one space
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'oklch(0.22 0.07 240)' }}>
                Team Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={teamColor}
                  onChange={(e) => setTeamColor(e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer border-0 p-0.5"
                  style={{ border: '1px solid oklch(0.88 0.015 240)' }}
                />
                <span className="text-sm font-mono" style={{ color: 'oklch(0.5 0.03 240)' }}>
                  {teamColor}
                </span>
              </div>
            </div>

            {teamError && (
              <p className="text-sm" style={{ color: 'oklch(0.45 0.18 25)' }}>
                {teamError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddTeamOpen(false);
                setTeamName('');
                setTeamError('');
              }}
              style={{ borderColor: 'oklch(0.88 0.015 240)', color: 'oklch(0.35 0.05 240)' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTeam}
              disabled={addTeamMutation.isPending}
              style={{
                background: 'oklch(0.65 0.18 45)',
                color: 'oklch(0.1 0.02 240)',
                fontWeight: 600,
              }}
            >
              {addTeamMutation.isPending ? (
                <span className="animate-spin mr-1.5">⟳</span>
              ) : (
                <Plus size={14} className="mr-1.5" />
              )}
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal */}
      {bulkUploadTeam && (
        <BulkPlayerUploadModal
          open={!!bulkUploadTeam}
          onOpenChange={(open) => {
            if (!open) setBulkUploadTeam(null);
          }}
          teamId={bulkUploadTeam.id}
          currentPlayers={bulkUploadTeam.players}
          onSuccess={() => {
            refetch();
            setBulkUploadTeam(null);
          }}
        />
      )}
    </div>
  );
};

export default Teams;
