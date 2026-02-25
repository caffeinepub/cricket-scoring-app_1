import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAllTeams, useCreateMatch } from '@/hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, Play, RefreshCw, ChevronRight, Settings, Zap } from 'lucide-react';

type TossWinner = 'teamA' | 'teamB' | null;
type TossChoice = 'bat' | 'bowl' | null;

const MatchSetup: React.FC = () => {
  const navigate = useNavigate();
  const { data: teams = [], isLoading } = useGetAllTeams();
  const createMatchMutation = useCreateMatch();

  const [selectedTeamA, setSelectedTeamA] = useState<bigint | null>(null);
  const [selectedTeamB, setSelectedTeamB] = useState<bigint | null>(null);
  const [overs, setOvers] = useState(20);
  const [maxOversPerBowler, setMaxOversPerBowler] = useState(4);
  const [freeHitEnabled, setFreeHitEnabled] = useState(true);
  const [tossWinner, setTossWinner] = useState<TossWinner>(null);
  const [tossChoice, setTossChoice] = useState<TossChoice>(null);
  const [error, setError] = useState('');

  const eligibleTeams = teams.filter((t) => t.players.length >= 11);

  const handleStartMatch = async () => {
    setError('');
    if (!selectedTeamA || !selectedTeamB) {
      setError('Please select both teams');
      return;
    }
    if (selectedTeamA === selectedTeamB) {
      setError('Please select two different teams');
      return;
    }
    if (!tossWinner || !tossChoice) {
      setError('Please complete the toss');
      return;
    }

    // Determine batting/bowling order based on toss
    let battingFirstId = selectedTeamA;
    if (tossWinner === 'teamA' && tossChoice === 'bowl') {
      battingFirstId = selectedTeamB;
    } else if (tossWinner === 'teamB' && tossChoice === 'bat') {
      battingFirstId = selectedTeamB;
    }

    const teamAId = battingFirstId;
    const teamBId = battingFirstId === selectedTeamA ? selectedTeamB : selectedTeamA;

    try {
      const matchId = await createMatchMutation.mutateAsync({
        teamAId,
        teamBId,
        rules: {
          oversLimit: BigInt(overs),
          powerplayOvers: [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)],
          duckworthLewisTarget: undefined,
          maxOversPerBowler: BigInt(maxOversPerBowler),
          freeHitEnabled,
        },
      });
      navigate({ to: `/live-scoring/${matchId}` });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create match');
    }
  };

  const getTeamById = (id: bigint | null) => teams.find((t) => t.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center space-y-3">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin mx-auto"
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
        <h1 className="font-display text-2xl font-bold" style={{ color: 'oklch(0.97 0.005 240)' }}>
          Match Setup
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'oklch(0.75 0.03 240)' }}>
          Configure teams, toss, and rules before starting
        </p>
      </div>

      {eligibleTeams.length < 2 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'oklch(1 0 0)',
            border: '2px dashed oklch(0.88 0.015 240)',
          }}
        >
          <Shield size={40} className="mx-auto mb-3" style={{ color: 'oklch(0.75 0.03 240)' }} />
          <h3 className="font-display text-lg font-bold mb-2" style={{ color: 'oklch(0.22 0.07 240)' }}>
            Not Enough Teams
          </h3>
          <p className="text-sm mb-4" style={{ color: 'oklch(0.5 0.03 240)' }}>
            You need at least 2 teams with 11 players each to start a match.
          </p>
          <Button
            onClick={() => navigate({ to: '/teams' })}
            style={{
              background: 'oklch(0.65 0.18 45)',
              color: 'oklch(0.1 0.02 240)',
              fontWeight: 600,
            }}
          >
            Manage Teams
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Team Selection */}
          <div
            className="rounded-xl p-4 shadow-card"
            style={{ background: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.015 240)' }}
          >
            <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'oklch(0.22 0.07 240)' }}>
              <Shield size={18} style={{ color: 'oklch(0.65 0.18 45)' }} />
              Select Teams
            </h2>

            <div className="space-y-3">
              {/* Team A */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'oklch(0.5 0.03 240)' }}>
                  Team A (Batting First)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {eligibleTeams.map((team) => (
                    <button
                      key={team.id.toString()}
                      onClick={() => {
                        setSelectedTeamA(team.id);
                        if (selectedTeamB === team.id) setSelectedTeamB(null);
                      }}
                      disabled={selectedTeamB === team.id}
                      className="flex items-center gap-2 p-3 rounded-lg text-left transition-all duration-150"
                      style={{
                        border: selectedTeamA === team.id
                          ? '2px solid oklch(0.65 0.18 45)'
                          : '1px solid oklch(0.88 0.015 240)',
                        background: selectedTeamA === team.id
                          ? 'oklch(0.65 0.18 45 / 0.08)'
                          : 'oklch(0.97 0.005 240)',
                        opacity: selectedTeamB === team.id ? 0.4 : 1,
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded flex-shrink-0"
                        style={{ background: team.color || 'oklch(0.22 0.07 240)' }}
                      />
                      <span className="text-sm font-semibold truncate" style={{ color: 'oklch(0.22 0.07 240)' }}>
                        {team.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Team B */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'oklch(0.5 0.03 240)' }}>
                  Team B (Bowling First)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {eligibleTeams.map((team) => (
                    <button
                      key={team.id.toString()}
                      onClick={() => {
                        setSelectedTeamB(team.id);
                        if (selectedTeamA === team.id) setSelectedTeamA(null);
                      }}
                      disabled={selectedTeamA === team.id}
                      className="flex items-center gap-2 p-3 rounded-lg text-left transition-all duration-150"
                      style={{
                        border: selectedTeamB === team.id
                          ? '2px solid oklch(0.65 0.18 45)'
                          : '1px solid oklch(0.88 0.015 240)',
                        background: selectedTeamB === team.id
                          ? 'oklch(0.65 0.18 45 / 0.08)'
                          : 'oklch(0.97 0.005 240)',
                        opacity: selectedTeamA === team.id ? 0.4 : 1,
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded flex-shrink-0"
                        style={{ background: team.color || 'oklch(0.22 0.07 240)' }}
                      />
                      <span className="text-sm font-semibold truncate" style={{ color: 'oklch(0.22 0.07 240)' }}>
                        {team.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Toss */}
          {selectedTeamA && selectedTeamB && (
            <div
              className="rounded-xl p-4 shadow-card"
              style={{ background: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.015 240)' }}
            >
              <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'oklch(0.22 0.07 240)' }}>
                <RefreshCw size={18} style={{ color: 'oklch(0.65 0.18 45)' }} />
                Toss
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'oklch(0.5 0.03 240)' }}>
                    Toss Winner
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['teamA', 'teamB'] as const).map((side) => {
                      const team = side === 'teamA' ? getTeamById(selectedTeamA) : getTeamById(selectedTeamB);
                      return (
                        <button
                          key={side}
                          onClick={() => setTossWinner(side)}
                          className="p-3 rounded-lg text-sm font-semibold transition-all duration-150"
                          style={{
                            border: tossWinner === side
                              ? '2px solid oklch(0.65 0.18 45)'
                              : '1px solid oklch(0.88 0.015 240)',
                            background: tossWinner === side
                              ? 'oklch(0.65 0.18 45 / 0.08)'
                              : 'oklch(0.97 0.005 240)',
                            color: 'oklch(0.22 0.07 240)',
                          }}
                        >
                          {team?.name || side}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {tossWinner && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'oklch(0.5 0.03 240)' }}>
                      Chose to
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['bat', 'bowl'] as const).map((choice) => (
                        <button
                          key={choice}
                          onClick={() => setTossChoice(choice)}
                          className="p-3 rounded-lg text-sm font-semibold capitalize transition-all duration-150"
                          style={{
                            border: tossChoice === choice
                              ? '2px solid oklch(0.65 0.18 45)'
                              : '1px solid oklch(0.88 0.015 240)',
                            background: tossChoice === choice
                              ? 'oklch(0.65 0.18 45 / 0.08)'
                              : 'oklch(0.97 0.005 240)',
                            color: 'oklch(0.22 0.07 240)',
                          }}
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Match Rules */}
          <div
            className="rounded-xl p-4 shadow-card"
            style={{ background: 'oklch(1 0 0)', border: '1px solid oklch(0.88 0.015 240)' }}
          >
            <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'oklch(0.22 0.07 240)' }}>
              <Settings size={18} style={{ color: 'oklch(0.65 0.18 45)' }} />
              Match Rules
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'oklch(0.5 0.03 240)' }}>
                  Total Overs
                </label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={overs}
                  onChange={(e) => setOvers(Number(e.target.value))}
                  style={{ border: '1px solid oklch(0.88 0.015 240)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'oklch(0.5 0.03 240)' }}>
                  Max Overs/Bowler
                </label>
                <Input
                  type="number"
                  min={1}
                  max={overs}
                  value={maxOversPerBowler}
                  onChange={(e) => setMaxOversPerBowler(Number(e.target.value))}
                  style={{ border: '1px solid oklch(0.88 0.015 240)' }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'oklch(0.22 0.07 240)' }}>
                  Free Hit on No-Ball
                </p>
                <p className="text-xs" style={{ color: 'oklch(0.5 0.03 240)' }}>
                  Next ball after no-ball is a free hit
                </p>
              </div>
              <button
                onClick={() => setFreeHitEnabled(!freeHitEnabled)}
                className="relative w-12 h-6 rounded-full transition-all duration-200"
                style={{
                  background: freeHitEnabled ? 'oklch(0.65 0.18 45)' : 'oklch(0.75 0.03 240)',
                }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                  style={{ left: freeHitEnabled ? '26px' : '2px' }}
                />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm font-medium"
              style={{
                background: 'oklch(0.55 0.22 25 / 0.08)',
                border: '1px solid oklch(0.55 0.22 25 / 0.3)',
                color: 'oklch(0.45 0.18 25)',
              }}
            >
              {error}
            </div>
          )}

          {/* Start Match Button */}
          <Button
            onClick={handleStartMatch}
            disabled={createMatchMutation.isPending}
            className="w-full py-4 text-base font-bold shadow-orange-glow"
            style={{
              background: 'oklch(0.65 0.18 45)',
              color: 'oklch(0.1 0.02 240)',
              border: 'none',
              borderRadius: '0.75rem',
            }}
          >
            {createMatchMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Creating Match...
              </>
            ) : (
              <>
                <Play size={18} className="mr-2" />
                Start Match
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MatchSetup;
