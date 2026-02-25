import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Trophy, Clock, RotateCcw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ResetAllDataModal from "@/components/ResetAllDataModal";
import { useResetAllData } from "@/hooks/useQueries";
import { getStoredMatches, type StoredMatch } from "@/lib/matchStore";

export default function MatchHistory() {
  const [showResetModal, setShowResetModal] = useState(false);
  const [matches, setMatches] = useState<StoredMatch[]>(() => getStoredMatches());

  const resetMutation = useResetAllData();

  const handleReset = () => {
    resetMutation.mutate(undefined, {
      onSuccess: () => {
        setMatches([]);
        setShowResetModal(false);
      },
      onError: () => {
        setShowResetModal(false);
      },
    });
  };

  const refreshMatches = () => {
    setMatches(getStoredMatches());
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Match History</h2>
          <p className="text-sm text-muted-foreground">
            {matches.length} match{matches.length !== 1 ? "es" : ""} recorded
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshMatches}>
            <RotateCcw size={14} className="mr-1" />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowResetModal(true)}
          >
            Reset
          </Button>
          <Link to="/setup">
            <Button size="sm">
              <Plus size={14} className="mr-1" />
              New Match
            </Button>
          </Link>
        </div>
      </div>

      {/* Match list */}
      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy size={48} className="mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No matches yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Set up a match to get started
            </p>
            <Link to="/setup">
              <Button className="mt-4" size="sm">
                Start a Match
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {matches
            .slice()
            .reverse()
            .map((match) => (
              <MatchCard key={match.matchId} match={match} />
            ))}
        </div>
      )}

      {/* Reset All Data Modal */}
      <ResetAllDataModal
        open={showResetModal}
        onConfirm={handleReset}
        onCancel={() => setShowResetModal(false)}
        isLoading={resetMutation.isPending}
      />
    </div>
  );
}

function MatchCard({ match }: { match: StoredMatch }) {
  const isLive = !match.isFinished;
  const isCompleted = match.isFinished;

  const formatDate = (ts: number | undefined) => {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <Card className={`transition-shadow hover:shadow-md ${isLive ? "border-accent/50" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isLive && (
                <Badge variant="default" className="bg-accent text-accent-foreground text-xs">
                  In Progress
                </Badge>
              )}
              {isCompleted && (
                <Badge variant="secondary" className="text-xs">
                  <Trophy size={10} className="mr-1" />
                  Completed
                </Badge>
              )}
            </div>
            <p className="font-semibold text-foreground truncate">
              {match.teamAName} vs {match.teamBName}
            </p>
            {match.result && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{match.result}</p>
            )}
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Clock size={12} />
              <span>{formatDate(match.createdAt)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            {isLive && (
              <Link to="/match/$matchId" params={{ matchId: match.matchId }}>
                <Button size="sm" className="text-xs w-full">
                  Continue
                </Button>
              </Link>
            )}
            <Link to="/scorecard/$matchId" params={{ matchId: match.matchId }}>
              <Button variant="outline" size="sm" className="text-xs w-full">
                Scorecard
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
