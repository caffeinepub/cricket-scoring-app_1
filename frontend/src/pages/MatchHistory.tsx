import { useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { Clock, Plus, Trash2, Play, FileText, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getStoredMatches, deleteStoredMatch, type MatchMeta } from '../lib/matchStore';
import { useGetMatch } from '../hooks/useQueries';

function MatchCard({
  meta,
  onDelete,
}: {
  meta: MatchMeta;
  onDelete: (matchId: string) => void;
}) {
  const router = useRouter();
  const { data: match } = useGetMatch(BigInt(meta.matchId));

  const isFinished = meta.isFinished || match?.isFinished;
  const date = new Date(meta.createdAt);
  const dateStr = date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const totalRuns = match?.deliveries.reduce((s, d) => s + Number(d.runs), 0) ?? 0;
  const wickets = match?.deliveries.filter(d => d.wicket !== undefined && d.wicket !== null).length ?? 0;
  const legalBalls = match?.deliveries.filter(d => !d.isWide && !d.isNoBall).length ?? 0;
  const overs = Math.floor(legalBalls / 6);
  const rem = legalBalls % 6;
  const oversStr = `${overs}.${rem}`;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'oklch(1 0 0)',
        border: '1px solid oklch(0.88 0.015 240)',
        boxShadow: '0 2px 8px oklch(0.22 0.07 240 / 0.08)',
      }}
    >
      {/* Status bar */}
      <div
        className="h-1"
        style={{
          background: isFinished ? 'oklch(0.55 0.15 145)' : 'oklch(0.65 0.18 45)',
        }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Teams */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display font-bold text-base truncate" style={{ color: 'oklch(0.22 0.07 240)' }}>
                {meta.teamAName}
              </span>
              <span className="text-xs shrink-0" style={{ color: 'oklch(0.6 0.03 240)' }}>vs</span>
              <span className="font-display font-bold text-base truncate" style={{ color: 'oklch(0.22 0.07 240)' }}>
                {meta.teamBName}
              </span>
            </div>

            {/* Score summary */}
            {match && match.deliveries.length > 0 && (
              <p className="text-sm font-mono font-semibold mb-1" style={{ color: 'oklch(0.65 0.18 45)' }}>
                {totalRuns}/{wickets} ({oversStr} ov)
              </p>
            )}

            {/* Date & status */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs flex items-center gap-1" style={{ color: 'oklch(0.6 0.03 240)' }}>
                <Clock size={10} />
                {dateStr}
              </span>
              {isFinished ? (
                <Badge
                  className="text-xs py-0"
                  style={{
                    background: 'oklch(0.55 0.15 145 / 0.12)',
                    color: 'oklch(0.45 0.15 145)',
                    border: '1px solid oklch(0.55 0.15 145 / 0.3)',
                  }}
                >
                  <Trophy size={10} className="mr-1" />
                  Completed
                </Badge>
              ) : (
                <Badge
                  className="text-xs py-0"
                  style={{
                    background: 'oklch(0.65 0.18 45 / 0.12)',
                    color: 'oklch(0.55 0.15 45)',
                    border: '1px solid oklch(0.65 0.18 45 / 0.3)',
                  }}
                >
                  In Progress
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 shrink-0">
            {isFinished ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8"
                style={{
                  borderColor: 'oklch(0.22 0.07 240 / 0.3)',
                  color: 'oklch(0.22 0.07 240)',
                }}
                onClick={() => router.navigate({ to: `/scorecard/${meta.matchId}` })}
              >
                <FileText size={12} className="mr-1" />
                Scorecard
              </Button>
            ) : (
              <Button
                size="sm"
                className="text-xs h-8 font-semibold"
                style={{
                  background: 'oklch(0.65 0.18 45)',
                  color: 'oklch(0.1 0.02 240)',
                  border: 'none',
                }}
                onClick={() => router.navigate({ to: `/match/${meta.matchId}` })}
              >
                <Play size={12} className="mr-1" />
                Resume
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={12} className="mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Match?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove{' '}
                    <strong>{meta.teamAName} vs {meta.teamBName}</strong> from your match history.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(meta.matchId)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MatchHistory() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchMeta[]>(() => getStoredMatches());

  const handleDelete = (matchId: string) => {
    deleteStoredMatch(matchId);
    setMatches(getStoredMatches());
  };

  return (
    <div className="p-4 space-y-5">
      {/* Page Header */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, oklch(0.22 0.07 240), oklch(0.15 0.06 240))',
          boxShadow: '0 4px 12px oklch(0.22 0.07 240 / 0.2)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: 'oklch(0.97 0.005 240)' }}>
              Match History
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'oklch(0.75 0.03 240)' }}>
              {matches.length} match{matches.length !== 1 ? 'es' : ''} recorded
            </p>
          </div>
          <Button
            onClick={() => router.navigate({ to: '/setup' })}
            className="flex items-center gap-2 font-semibold"
            style={{
              background: 'oklch(0.65 0.18 45)',
              color: 'oklch(0.1 0.02 240)',
              border: 'none',
            }}
          >
            <Plus size={16} />
            New Match
          </Button>
        </div>
      </div>

      {/* Matches List */}
      {matches.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: 'oklch(1 0 0)',
            border: '2px dashed oklch(0.88 0.015 240)',
          }}
        >
          <Trophy size={48} className="mx-auto mb-4" style={{ color: 'oklch(0.75 0.03 240)' }} />
          <h3 className="font-display text-xl font-bold mb-2" style={{ color: 'oklch(0.22 0.07 240)' }}>
            No Matches Yet
          </h3>
          <p className="text-sm mb-5" style={{ color: 'oklch(0.5 0.03 240)' }}>
            Start your first match to see it here.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              onClick={() => router.navigate({ to: '/teams' })}
              variant="outline"
              style={{ borderColor: 'oklch(0.88 0.015 240)', color: 'oklch(0.35 0.05 240)' }}
            >
              <Users size={14} className="mr-2" />
              Manage Teams
            </Button>
            <Button
              onClick={() => router.navigate({ to: '/setup' })}
              style={{
                background: 'oklch(0.65 0.18 45)',
                color: 'oklch(0.1 0.02 240)',
                fontWeight: 600,
              }}
            >
              <Play size={14} className="mr-2" />
              Start Match
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {[...matches].reverse().map((meta) => (
            <MatchCard key={meta.matchId} meta={meta} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
