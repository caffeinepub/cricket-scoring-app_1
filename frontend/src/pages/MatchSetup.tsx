import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTeams, useCreateMatch, useSelectSquad } from "@/hooks/useQueries";
import PlayingElevenSelector from "@/components/PlayingElevenSelector";
import QueryErrorState from "@/components/QueryErrorState";
import { saveMatchMeta, storeMatch } from "@/lib/matchStore";
import type { Team } from "@/backend";

type Step = "teams" | "playing11" | "rules" | "confirm";

const STEPS: Step[] = ["teams", "playing11", "rules", "confirm"];

const STEP_LABELS: Record<Step, string> = {
  teams: "Select Teams",
  playing11: "Playing 11",
  rules: "Match Rules",
  confirm: "Confirm",
};

export default function MatchSetup() {
  const navigate = useNavigate();
  const {
    data: teams,
    isLoading: teamsLoading,
    isError: teamsError,
    error: teamsErrorObj,
    refetch: refetchTeams,
  } = useTeams();

  const [currentStep, setCurrentStep] = useState<Step>("teams");
  const [teamAId, setTeamAId] = useState<string>("");
  const [teamBId, setTeamBId] = useState<string>("");
  const [squadA, setSquadA] = useState<bigint[]>([]);
  const [squadB, setSquadB] = useState<bigint[]>([]);
  const [overs, setOvers] = useState(20);
  const [maxOversPerBowler, setMaxOversPerBowler] = useState(4);
  const [freeHitEnabled, setFreeHitEnabled] = useState(true);

  const createMatch = useCreateMatch();
  const selectSquad = useSelectSquad();

  const teamList = teams ?? [];
  const teamA = teamList.find((t) => t.id.toString() === teamAId) ?? null;
  const teamB = teamList.find((t) => t.id.toString() === teamBId) ?? null;

  const stepIndex = STEPS.indexOf(currentStep);

  const canProceedFromTeams = teamAId && teamBId && teamAId !== teamBId;
  const canProceedFromPlaying11 = squadA.length === 11 && squadB.length === 11;
  const canProceedFromRules = overs > 0 && maxOversPerBowler > 0;

  const handleNext = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const handleStartMatch = async () => {
    if (!teamA || !teamB) return;

    try {
      // Save squads to backend
      await selectSquad.mutateAsync({ teamId: teamA.id, squad: squadA });
      await selectSquad.mutateAsync({ teamId: teamB.id, squad: squadB });

      // Create match
      const matchId = await createMatch.mutateAsync({
        teamAId: teamA.id,
        teamBId: teamB.id,
        rules: {
          oversLimit: BigInt(overs),
          powerplayOvers: [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)],
          duckworthLewisTarget: undefined,
          maxOversPerBowler: BigInt(maxOversPerBowler),
          freeHitEnabled,
        },
      });

      const matchIdStr = matchId.toString();

      // Save match metadata locally
      saveMatchMeta(matchIdStr, {
        matchId: matchIdStr,
        teamAId: teamA.id,
        teamBId: teamB.id,
        teamAPlayingEleven: squadA,
        teamBPlayingEleven: squadB,
        strikerId: squadA[0] ?? null,
        nonStrikerId: squadA[1] ?? null,
        bowlerId: squadB[0] ?? null,
      });

      // Store match in local history
      storeMatch({
        matchId: matchIdStr,
        teamAName: teamA.name,
        teamBName: teamB.name,
        teamAId: teamA.id,
        teamBId: teamB.id,
        createdAt: Date.now(),
        isFinished: false,
      });

      // Save current match ID for live scoring
      localStorage.setItem('currentMatchId', matchIdStr);

      navigate({ to: "/match/$matchId", params: { matchId: matchIdStr } });
    } catch {
      // error handled by mutation state
    }
  };

  if (teamsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (teamsError) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Match Setup</h2>
          <p className="text-sm text-muted-foreground">Set up a new match</p>
        </div>
        <QueryErrorState
          error={teamsErrorObj}
          title="Failed to load teams"
          onRetry={() => refetchTeams()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Match Setup</h2>
        <p className="text-sm text-muted-foreground">
          Step {stepIndex + 1} of {STEPS.length} — {STEP_LABELS[currentStep]}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1">
        {STEPS.map((step, idx) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              idx <= stepIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      {currentStep === "teams" && (
        <TeamSelectionStep
          teams={teamList}
          teamAId={teamAId}
          teamBId={teamBId}
          onTeamAChange={setTeamAId}
          onTeamBChange={setTeamBId}
        />
      )}

      {currentStep === "playing11" && teamA && teamB && (
        <Playing11Step
          teamA={teamA}
          teamB={teamB}
          squadA={squadA}
          squadB={squadB}
          onSquadAChange={setSquadA}
          onSquadBChange={setSquadB}
        />
      )}

      {currentStep === "rules" && (
        <RulesStep
          overs={overs}
          maxOversPerBowler={maxOversPerBowler}
          freeHitEnabled={freeHitEnabled}
          onOversChange={setOvers}
          onMaxOversPerBowlerChange={setMaxOversPerBowler}
          onFreeHitChange={setFreeHitEnabled}
        />
      )}

      {currentStep === "confirm" && teamA && teamB && (
        <ConfirmStep
          teamA={teamA}
          teamB={teamB}
          squadA={squadA}
          squadB={squadB}
          overs={overs}
          maxOversPerBowler={maxOversPerBowler}
          freeHitEnabled={freeHitEnabled}
        />
      )}

      {/* Mutation errors */}
      {(createMatch.isError || selectSquad.isError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {createMatch.isError
              ? "Failed to create match. Please try again."
              : "Failed to save squad. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {stepIndex > 0 && (
          <Button variant="outline" onClick={handleBack} className="flex-1">
            <ChevronLeft size={16} className="mr-1" />
            Back
          </Button>
        )}

        {currentStep !== "confirm" ? (
          <Button
            onClick={handleNext}
            className="flex-1"
            disabled={
              (currentStep === "teams" && !canProceedFromTeams) ||
              (currentStep === "playing11" && !canProceedFromPlaying11) ||
              (currentStep === "rules" && !canProceedFromRules)
            }
          >
            Next
            <ChevronRight size={16} className="ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleStartMatch}
            className="flex-1"
            disabled={createMatch.isPending || selectSquad.isPending}
          >
            {(createMatch.isPending || selectSquad.isPending) && (
              <Loader2 size={14} className="mr-1 animate-spin" />
            )}
            Start Match
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TeamSelectionStep({
  teams,
  teamAId,
  teamBId,
  onTeamAChange,
  onTeamBChange,
}: {
  teams: Team[];
  teamAId: string;
  teamBId: string;
  onTeamAChange: (id: string) => void;
  onTeamBChange: (id: string) => void;
}) {
  if (teams.length < 2) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle size={40} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">Not enough teams</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            You need at least 2 teams to set up a match. Go to Teams to add more.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Select Teams</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Team A (Batting First)</Label>
          <Select value={teamAId} onValueChange={onTeamAChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select Team A" />
            </SelectTrigger>
            <SelectContent>
              {teams
                .filter((t) => t.id.toString() !== teamBId)
                .map((t) => (
                  <SelectItem key={t.id.toString()} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Team B (Bowling First)</Label>
          <Select value={teamBId} onValueChange={onTeamBChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select Team B" />
            </SelectTrigger>
            <SelectContent>
              {teams
                .filter((t) => t.id.toString() !== teamAId)
                .map((t) => (
                  <SelectItem key={t.id.toString()} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function Playing11Step({
  teamA,
  teamB,
  squadA,
  squadB,
  onSquadAChange,
  onSquadBChange,
}: {
  teamA: Team;
  teamB: Team;
  squadA: bigint[];
  squadB: bigint[];
  onSquadAChange: (squad: bigint[]) => void;
  onSquadBChange: (squad: bigint[]) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{teamA.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <PlayingElevenSelector
            players={teamA.players}
            selected={squadA}
            onChange={onSquadAChange}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{teamB.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <PlayingElevenSelector
            players={teamB.players}
            selected={squadB}
            onChange={onSquadBChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function RulesStep({
  overs,
  maxOversPerBowler,
  freeHitEnabled,
  onOversChange,
  onMaxOversPerBowlerChange,
  onFreeHitChange,
}: {
  overs: number;
  maxOversPerBowler: number;
  freeHitEnabled: boolean;
  onOversChange: (v: number) => void;
  onMaxOversPerBowlerChange: (v: number) => void;
  onFreeHitChange: (v: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Match Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="overs">Total Overs</Label>
          <Input
            id="overs"
            type="number"
            min={1}
            max={50}
            value={overs}
            onChange={(e) => onOversChange(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-overs-bowler">Max Overs per Bowler</Label>
          <Input
            id="max-overs-bowler"
            type="number"
            min={1}
            max={overs}
            value={maxOversPerBowler}
            onChange={(e) => onMaxOversPerBowlerChange(Number(e.target.value))}
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            id="free-hit"
            type="checkbox"
            checked={freeHitEnabled}
            onChange={(e) => onFreeHitChange(e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="free-hit">Free Hit on No Ball</Label>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfirmStep({
  teamA,
  teamB,
  squadA,
  squadB,
  overs,
  maxOversPerBowler,
  freeHitEnabled,
}: {
  teamA: Team;
  teamB: Team;
  squadA: bigint[];
  squadB: bigint[];
  overs: number;
  maxOversPerBowler: number;
  freeHitEnabled: boolean;
}) {
  const getPlayerName = (team: Team, id: bigint) =>
    team.players.find((p) => p.id === id)?.name ?? id.toString();

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-500" />
            Match Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Teams</span>
            <span className="text-sm font-medium">
              {teamA.name} vs {teamB.name}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Overs</span>
            <Badge variant="outline">{overs} overs</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Max per Bowler</span>
            <Badge variant="outline">{maxOversPerBowler} overs</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Free Hit</span>
            <Badge variant={freeHitEnabled ? "default" : "secondary"}>
              {freeHitEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-sm">{teamA.name} XI</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-0.5">
              {squadA.map((id, i) => (
                <p key={id.toString()} className="text-xs text-muted-foreground">
                  {i + 1}. {getPlayerName(teamA, id)}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-sm">{teamB.name} XI</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-0.5">
              {squadB.map((id, i) => (
                <p key={id.toString()} className="text-xs text-muted-foreground">
                  {i + 1}. {getPlayerName(teamB, id)}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
