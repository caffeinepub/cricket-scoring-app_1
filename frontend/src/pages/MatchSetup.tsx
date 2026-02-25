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
  const { data: teams, isLoading: teamsLoading, isError: teamsError } = useTeams();

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

      // Save match metadata locally — saveMatchMeta(matchId, meta)
      saveMatchMeta(matchIdStr, {
        teamAId: teamA.id.toString(),
        teamBId: teamB.id.toString(),
        teamAName: teamA.name,
        teamBName: teamB.name,
        teamAPlayers: teamA.players.map((p) => ({
          id: p.id.toString(),
          name: p.name,
          battingOrder: p.battingOrder.toString(),
          isBowler: p.isBowler,
        })),
        teamBPlayers: teamB.players.map((p) => ({
          id: p.id.toString(),
          name: p.name,
          battingOrder: p.battingOrder.toString(),
          isBowler: p.isBowler,
        })),
        teamAPlayingEleven: squadA.map(String),
        teamBPlayingEleven: squadB.map(String),
        strikerId: squadA[0]?.toString() ?? "",
        nonStrikerId: squadA[1]?.toString() ?? "",
        bowlerId: squadB[0]?.toString() ?? "",
        oversLimit: overs,
      });

      // Store match in local history — storeMatch(meta: StoredMatch)
      storeMatch({
        matchId: matchIdStr,
        teamAName: teamA.name,
        teamBName: teamB.name,
        teamAId: teamA.id.toString(),
        teamBId: teamB.id.toString(),
        date: new Date().toISOString(),
        isFinished: false,
      });

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
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load teams. Please try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Match Setup</h2>
        <p className="text-sm text-muted-foreground">
          Step {stepIndex + 1} of {STEPS.length}: {STEP_LABELS[currentStep]}
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-1">
        {STEPS.map((step, idx) => (
          <div
            key={step}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              idx <= stepIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      {currentStep === "teams" && (
        <TeamsStep
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

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={stepIndex === 0}
        >
          <ChevronLeft size={16} className="mr-1" />
          Back
        </Button>

        {currentStep !== "confirm" ? (
          <Button
            onClick={handleNext}
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
            disabled={
              createMatch.isPending ||
              selectSquad.isPending ||
              !teamA ||
              !teamB
            }
          >
            {(createMatch.isPending || selectSquad.isPending) && (
              <Loader2 size={14} className="mr-1 animate-spin" />
            )}
            Start Match
          </Button>
        )}
      </div>

      {/* Error display */}
      {(createMatch.isError || selectSquad.isError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {createMatch.error instanceof Error
              ? createMatch.error.message
              : selectSquad.error instanceof Error
              ? selectSquad.error.message
              : "Failed to start match"}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────────

function TeamsStep({
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
            You need at least 2 teams to set up a match.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
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
                .map((team) => (
                  <SelectItem key={team.id.toString()} value={team.id.toString()}>
                    {team.name}
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
                .map((team) => (
                  <SelectItem key={team.id.toString()} value={team.id.toString()}>
                    {team.name}
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
          <CardTitle className="text-sm">{teamA.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* PlayingElevenSelector expects: players, selected, onChange */}
          <PlayingElevenSelector
            players={teamA.players}
            selected={squadA}
            onChange={onSquadAChange}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{teamB.name}</CardTitle>
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
      <CardHeader>
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
          <Label htmlFor="free-hit">Enable Free Hit on No Ball</Label>
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
            <div className="text-center flex-1">
              <p className="font-bold text-foreground">{teamA.name}</p>
              <p className="text-xs text-muted-foreground">
                {squadA.length} players selected
              </p>
            </div>
            <div className="text-muted-foreground font-bold">vs</div>
            <div className="text-center flex-1">
              <p className="font-bold text-foreground">{teamB.name}</p>
              <p className="text-xs text-muted-foreground">
                {squadB.length} players selected
              </p>
            </div>
          </div>
          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Overs</span>
              <span className="font-medium">{overs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max overs/bowler</span>
              <span className="font-medium">{maxOversPerBowler}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Free Hit</span>
              <Badge variant={freeHitEnabled ? "default" : "secondary"}>
                {freeHitEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
