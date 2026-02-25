import { useState, useEffect } from 'react';
import { Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useTournamentRules, useUpdateTournamentRules } from '../hooks/useQueries';
import type { TournamentRules } from '../backend';

interface ConfigureTournamentRulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Default values matching the user-provided tournament rules
const DEFAULT_RULES: TournamentRules = {
  totalMatches: 10n,
  numTeams: 8n,
  leagueMatches: 4n,
  knockoutMatches: 2n,
  semifinalMatches: 3n,
  finalMatches: 1n,
  leagueOvers: 5n,
  finalOvers: 6n,
  leaguePowerplayOvers: 1n,
  finalPowerplayOvers: 2n,
  maxFieldersOutside30Yards: 2n,
  timeoutDurationSeconds: 60n,
  teamReadinessPenaltyMinutes: 15n,
  teamReadinessPenaltyOvers: 1n,
  slowOverRatePenaltyRuns: 6n,
  inningsDurationMinutes: 20n,
  maxBallsPerBatsmanShortFormat: 10n,
  maxBallsPerBatsmanLongFormat: 12n,
  maxOversBowlerShortFormat: 2n,
  maxOversBowlerLongFormat: 2n,
  bouncerLimitPerOver: 1n,
  widesNoBallBowlerChangeThreshold: 3n,
  defaultPenaltyRuns: 6n,
  lbwApplicable: true,
  freeHitApplicable: true,
};

interface FormValues {
  totalMatches: number;
  numTeams: number;
  leagueMatches: number;
  knockoutMatches: number;
  semifinalMatches: number;
  finalMatches: number;
  leagueOvers: number;
  finalOvers: number;
  leaguePowerplayOvers: number;
  finalPowerplayOvers: number;
  maxFieldersOutside30Yards: number;
  timeoutDurationSeconds: number;
  teamReadinessPenaltyMinutes: number;
  teamReadinessPenaltyOvers: number;
  slowOverRatePenaltyRuns: number;
  inningsDurationMinutes: number;
  maxBallsPerBatsmanShortFormat: number;
  maxBallsPerBatsmanLongFormat: number;
  maxOversBowlerShortFormat: number;
  maxOversBowlerLongFormat: number;
  bouncerLimitPerOver: number;
  widesNoBallBowlerChangeThreshold: number;
  defaultPenaltyRuns: number;
  lbwApplicable: boolean;
  freeHitApplicable: boolean;
}

function rulesFromBackend(rules: TournamentRules): FormValues {
  return {
    totalMatches: Number(rules.totalMatches),
    numTeams: Number(rules.numTeams),
    leagueMatches: Number(rules.leagueMatches),
    knockoutMatches: Number(rules.knockoutMatches),
    semifinalMatches: Number(rules.semifinalMatches),
    finalMatches: Number(rules.finalMatches),
    leagueOvers: Number(rules.leagueOvers),
    finalOvers: Number(rules.finalOvers),
    leaguePowerplayOvers: Number(rules.leaguePowerplayOvers),
    finalPowerplayOvers: Number(rules.finalPowerplayOvers),
    maxFieldersOutside30Yards: Number(rules.maxFieldersOutside30Yards),
    timeoutDurationSeconds: Number(rules.timeoutDurationSeconds),
    teamReadinessPenaltyMinutes: Number(rules.teamReadinessPenaltyMinutes),
    teamReadinessPenaltyOvers: Number(rules.teamReadinessPenaltyOvers),
    slowOverRatePenaltyRuns: Number(rules.slowOverRatePenaltyRuns),
    inningsDurationMinutes: Number(rules.inningsDurationMinutes),
    maxBallsPerBatsmanShortFormat: Number(rules.maxBallsPerBatsmanShortFormat),
    maxBallsPerBatsmanLongFormat: Number(rules.maxBallsPerBatsmanLongFormat),
    maxOversBowlerShortFormat: Number(rules.maxOversBowlerShortFormat),
    maxOversBowlerLongFormat: Number(rules.maxOversBowlerLongFormat),
    bouncerLimitPerOver: Number(rules.bouncerLimitPerOver),
    widesNoBallBowlerChangeThreshold: Number(rules.widesNoBallBowlerChangeThreshold),
    defaultPenaltyRuns: Number(rules.defaultPenaltyRuns),
    lbwApplicable: rules.lbwApplicable,
    freeHitApplicable: rules.freeHitApplicable,
  };
}

function formToBackend(form: FormValues): TournamentRules {
  return {
    totalMatches: BigInt(form.totalMatches),
    numTeams: BigInt(form.numTeams),
    leagueMatches: BigInt(form.leagueMatches),
    knockoutMatches: BigInt(form.knockoutMatches),
    semifinalMatches: BigInt(form.semifinalMatches),
    finalMatches: BigInt(form.finalMatches),
    leagueOvers: BigInt(form.leagueOvers),
    finalOvers: BigInt(form.finalOvers),
    leaguePowerplayOvers: BigInt(form.leaguePowerplayOvers),
    finalPowerplayOvers: BigInt(form.finalPowerplayOvers),
    maxFieldersOutside30Yards: BigInt(form.maxFieldersOutside30Yards),
    timeoutDurationSeconds: BigInt(form.timeoutDurationSeconds),
    teamReadinessPenaltyMinutes: BigInt(form.teamReadinessPenaltyMinutes),
    teamReadinessPenaltyOvers: BigInt(form.teamReadinessPenaltyOvers),
    slowOverRatePenaltyRuns: BigInt(form.slowOverRatePenaltyRuns),
    inningsDurationMinutes: BigInt(form.inningsDurationMinutes),
    maxBallsPerBatsmanShortFormat: BigInt(form.maxBallsPerBatsmanShortFormat),
    maxBallsPerBatsmanLongFormat: BigInt(form.maxBallsPerBatsmanLongFormat),
    maxOversBowlerShortFormat: BigInt(form.maxOversBowlerShortFormat),
    maxOversBowlerLongFormat: BigInt(form.maxOversBowlerLongFormat),
    bouncerLimitPerOver: BigInt(form.bouncerLimitPerOver),
    widesNoBallBowlerChangeThreshold: BigInt(form.widesNoBallBowlerChangeThreshold),
    defaultPenaltyRuns: BigInt(form.defaultPenaltyRuns),
    lbwApplicable: form.lbwApplicable,
    freeHitApplicable: form.freeHitApplicable,
  };
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  hint?: string;
}

function NumberField({ id, label, value, min = 0, max, onChange, hint }: NumberFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Math.max(min, Number(e.target.value)))}
        className="h-9"
      />
    </div>
  );
}

interface SwitchFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  hint?: string;
}

function SwitchField({ id, label, checked, onCheckedChange, hint }: SwitchFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">
          {label}
        </Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2">
      <h4 className="text-xs font-bold uppercase tracking-widest text-cricket-green mb-3">
        {children}
      </h4>
    </div>
  );
}

export default function ConfigureTournamentRulesModal({
  open,
  onOpenChange,
}: ConfigureTournamentRulesModalProps) {
  const { data: backendRules, isLoading } = useTournamentRules();
  const updateMutation = useUpdateTournamentRules();

  const [form, setForm] = useState<FormValues>(rulesFromBackend(DEFAULT_RULES));

  // Sync form when backend data loads
  useEffect(() => {
    if (backendRules) {
      // If backend has default zeros (first deploy), use our proper defaults
      const isUninitialized = Number(backendRules.totalMatches) === 0;
      setForm(rulesFromBackend(isUninitialized ? DEFAULT_RULES : backendRules));
    }
  }, [backendRules]);

  function setNum(field: keyof FormValues, val: number) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  function setBool(field: keyof FormValues, val: boolean) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  async function handleSave() {
    try {
      await updateMutation.mutateAsync(formToBackend(form));
      toast.success('Tournament rules saved successfully!');
      onOpenChange(false);
    } catch {
      toast.error('Failed to save tournament rules. Please try again.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-cricket-green/5 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cricket-green/15 flex items-center justify-center">
              <Settings size={18} className="text-cricket-green" />
            </div>
            <div>
              <DialogTitle className="font-display text-lg font-bold">
                Configure Tournament Rules
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Adjust all configurable parameters for this tournament.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-cricket-green" />
          </div>
        ) : (
          <ScrollArea className="flex-1 px-6">
            <div className="py-4 space-y-4">

              {/* Match Format */}
              <SectionTitle>Match Format</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  id="totalMatches"
                  label="Total Matches"
                  value={form.totalMatches}
                  min={1}
                  onChange={v => setNum('totalMatches', v)}
                />
                <NumberField
                  id="numTeams"
                  label="Number of Teams"
                  value={form.numTeams}
                  min={2}
                  onChange={v => setNum('numTeams', v)}
                />
                <NumberField
                  id="leagueMatches"
                  label="League Matches"
                  value={form.leagueMatches}
                  min={1}
                  onChange={v => setNum('leagueMatches', v)}
                />
                <NumberField
                  id="knockoutMatches"
                  label="Knock-Out Matches"
                  value={form.knockoutMatches}
                  min={0}
                  onChange={v => setNum('knockoutMatches', v)}
                />
                <NumberField
                  id="semifinalMatches"
                  label="Semi-Final Matches"
                  value={form.semifinalMatches}
                  min={1}
                  onChange={v => setNum('semifinalMatches', v)}
                />
                <NumberField
                  id="finalMatches"
                  label="Final Matches"
                  value={form.finalMatches}
                  min={1}
                  onChange={v => setNum('finalMatches', v)}
                />
              </div>

              <Separator />

              {/* Overs & Powerplay */}
              <SectionTitle>Overs & Powerplay</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  id="leagueOvers"
                  label="League / KO / SF Overs"
                  value={form.leagueOvers}
                  min={1}
                  hint="Overs per innings for league, knock-out & semi-final matches"
                  onChange={v => setNum('leagueOvers', v)}
                />
                <NumberField
                  id="finalOvers"
                  label="Final Overs"
                  value={form.finalOvers}
                  min={1}
                  hint="Overs per innings for the final match"
                  onChange={v => setNum('finalOvers', v)}
                />
                <NumberField
                  id="leaguePowerplayOvers"
                  label="League Powerplay Overs"
                  value={form.leaguePowerplayOvers}
                  min={1}
                  onChange={v => setNum('leaguePowerplayOvers', v)}
                />
                <NumberField
                  id="finalPowerplayOvers"
                  label="Final Powerplay Overs"
                  value={form.finalPowerplayOvers}
                  min={1}
                  onChange={v => setNum('finalPowerplayOvers', v)}
                />
                <NumberField
                  id="maxFieldersOutside30Yards"
                  label="Max Fielders Outside 30 Yards"
                  value={form.maxFieldersOutside30Yards}
                  min={0}
                  max={9}
                  hint="During powerplay overs"
                  onChange={v => setNum('maxFieldersOutside30Yards', v)}
                />
              </div>

              <Separator />

              {/* Player Rules */}
              <SectionTitle>Player Rules</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  id="maxBallsPerBatsmanShortFormat"
                  label={`Max Balls per Batsman (${form.leagueOvers}-over)`}
                  value={form.maxBallsPerBatsmanShortFormat}
                  min={1}
                  onChange={v => setNum('maxBallsPerBatsmanShortFormat', v)}
                />
                <NumberField
                  id="maxBallsPerBatsmanLongFormat"
                  label={`Max Balls per Batsman (${form.finalOvers}-over)`}
                  value={form.maxBallsPerBatsmanLongFormat}
                  min={1}
                  onChange={v => setNum('maxBallsPerBatsmanLongFormat', v)}
                />
                <NumberField
                  id="maxOversBowlerShortFormat"
                  label={`Max Overs per Bowler (${form.leagueOvers}-over)`}
                  value={form.maxOversBowlerShortFormat}
                  min={1}
                  onChange={v => setNum('maxOversBowlerShortFormat', v)}
                />
                <NumberField
                  id="maxOversBowlerLongFormat"
                  label={`Max Overs per Bowler (${form.finalOvers}-over)`}
                  value={form.maxOversBowlerLongFormat}
                  min={1}
                  onChange={v => setNum('maxOversBowlerLongFormat', v)}
                />
                <NumberField
                  id="bouncerLimitPerOver"
                  label="Bouncers Allowed per Over"
                  value={form.bouncerLimitPerOver}
                  min={0}
                  max={6}
                  onChange={v => setNum('bouncerLimitPerOver', v)}
                />
                <NumberField
                  id="widesNoBallBowlerChangeThreshold"
                  label="Wides/No-Balls Before Bowler Change"
                  value={form.widesNoBallBowlerChangeThreshold}
                  min={1}
                  hint="Captain may change bowler after this many wides/no-balls"
                  onChange={v => setNum('widesNoBallBowlerChangeThreshold', v)}
                />
              </div>

              <Separator />

              {/* Timing & Penalties */}
              <SectionTitle>Timing & Penalties</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  id="timeoutDurationSeconds"
                  label="Timeout Duration (seconds)"
                  value={form.timeoutDurationSeconds}
                  min={1}
                  hint="New batsman must reach ground within this time"
                  onChange={v => setNum('timeoutDurationSeconds', v)}
                />
                <NumberField
                  id="inningsDurationMinutes"
                  label="Max Innings Duration (minutes)"
                  value={form.inningsDurationMinutes}
                  min={1}
                  onChange={v => setNum('inningsDurationMinutes', v)}
                />
                <NumberField
                  id="teamReadinessPenaltyMinutes"
                  label="Team Readiness Required (minutes before)"
                  value={form.teamReadinessPenaltyMinutes}
                  min={1}
                  hint="Teams must be ready this many minutes before match"
                  onChange={v => setNum('teamReadinessPenaltyMinutes', v)}
                />
                <NumberField
                  id="teamReadinessPenaltyOvers"
                  label="Team Readiness Penalty (overs deducted)"
                  value={form.teamReadinessPenaltyOvers}
                  min={0}
                  onChange={v => setNum('teamReadinessPenaltyOvers', v)}
                />
                <NumberField
                  id="slowOverRatePenaltyRuns"
                  label="Slow Over Rate Penalty (runs)"
                  value={form.slowOverRatePenaltyRuns}
                  min={0}
                  hint="Extra runs credited to batting side per over after time limit"
                  onChange={v => setNum('slowOverRatePenaltyRuns', v)}
                />
                <NumberField
                  id="defaultPenaltyRuns"
                  label="Default Rule Violation Penalty (runs)"
                  value={form.defaultPenaltyRuns}
                  min={0}
                  hint="Penalty for captain/vice-captain rule violations"
                  onChange={v => setNum('defaultPenaltyRuns', v)}
                />
              </div>

              <Separator />

              {/* Special Rules Toggles */}
              <SectionTitle>Special Rules</SectionTitle>
              <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/30">
                <SwitchField
                  id="lbwApplicable"
                  label="LBW Applicable"
                  checked={form.lbwApplicable}
                  onCheckedChange={v => setBool('lbwApplicable', v)}
                  hint="Leg Before Wicket dismissal is in effect"
                />
                <Separator />
                <SwitchField
                  id="freeHitApplicable"
                  label="Free Hit Applicable"
                  checked={form.freeHitApplicable}
                  onCheckedChange={v => setBool('freeHitApplicable', v)}
                  hint="Free hit delivery after a no-ball"
                />
              </div>

              <div className="pb-4" />
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-lg">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || isLoading}
            className="bg-cricket-green hover:bg-cricket-green/90 text-white min-w-[100px]"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin mr-2" />
                Saving…
              </>
            ) : (
              'Save Rules'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
