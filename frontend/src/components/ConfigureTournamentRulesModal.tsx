import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useGetTournamentRules, useUpdateTournamentRules } from '@/hooks/useQueries';
import { toast } from 'sonner';
import type { TournamentRules } from '@/backend';

interface ConfigureTournamentRulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_RULES: TournamentRules = {
  totalMatches: BigInt(0),
  numTeams: BigInt(0),
  leagueMatches: BigInt(0),
  knockoutMatches: BigInt(0),
  semifinalMatches: BigInt(0),
  finalMatches: BigInt(0),
  leagueOvers: BigInt(50),
  finalOvers: BigInt(50),
  leaguePowerplayOvers: BigInt(10),
  finalPowerplayOvers: BigInt(10),
  maxFieldersOutside30Yards: BigInt(5),
  timeoutDurationSeconds: BigInt(120),
  teamReadinessPenaltyMinutes: BigInt(10),
  teamReadinessPenaltyOvers: BigInt(3),
  slowOverRatePenaltyRuns: BigInt(5),
  inningsDurationMinutes: BigInt(90),
  maxBallsPerBatsmanShortFormat: BigInt(50),
  maxBallsPerBatsmanLongFormat: BigInt(100),
  maxOversBowlerShortFormat: BigInt(10),
  maxOversBowlerLongFormat: BigInt(20),
  bouncerLimitPerOver: BigInt(2),
  widesNoBallBowlerChangeThreshold: BigInt(3),
  defaultPenaltyRuns: BigInt(5),
  lbwApplicable: true,
  freeHitApplicable: true,
};

export default function ConfigureTournamentRulesModal({
  open,
  onOpenChange,
}: ConfigureTournamentRulesModalProps) {
  const { data: existingRules } = useGetTournamentRules();
  const updateRules = useUpdateTournamentRules();

  const [form, setForm] = useState<TournamentRules>(DEFAULT_RULES);

  useEffect(() => {
    if (existingRules) {
      setForm(existingRules);
    }
  }, [existingRules]);

  const setNum = (field: keyof TournamentRules, value: string) => {
    const n = parseInt(value, 10);
    if (!isNaN(n) && n >= 0) {
      setForm((prev) => ({ ...prev, [field]: BigInt(n) }));
    }
  };

  const setBool = (field: keyof TournamentRules, value: boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateRules.mutateAsync(form);
      toast.success('Tournament rules saved successfully');
      onOpenChange(false);
    } catch {
      toast.error('Failed to save tournament rules');
    }
  };

  const numField = (
    label: string,
    field: keyof TournamentRules,
    min = 0
  ) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min={min}
        value={Number(form[field] as bigint)}
        onChange={(e) => setNum(field, e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure Tournament Rules</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-2">
            {/* Tournament Structure */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Tournament Structure</h3>
              <div className="grid grid-cols-2 gap-3">
                {numField('Total Matches', 'totalMatches')}
                {numField('Number of Teams', 'numTeams')}
                {numField('League Matches', 'leagueMatches')}
                {numField('Knockout Matches', 'knockoutMatches')}
                {numField('Semifinal Matches', 'semifinalMatches')}
                {numField('Final Matches', 'finalMatches')}
              </div>
            </section>

            {/* Overs */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Overs</h3>
              <div className="grid grid-cols-2 gap-3">
                {numField('League Overs', 'leagueOvers', 1)}
                {numField('Final Overs', 'finalOvers', 1)}
                {numField('League Powerplay Overs', 'leaguePowerplayOvers')}
                {numField('Final Powerplay Overs', 'finalPowerplayOvers')}
              </div>
            </section>

            {/* Field Restrictions */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Field Restrictions</h3>
              <div className="grid grid-cols-2 gap-3">
                {numField('Max Fielders Outside 30 Yards', 'maxFieldersOutside30Yards')}
                {numField('Bouncer Limit Per Over', 'bouncerLimitPerOver')}
              </div>
            </section>

            {/* Penalties */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Penalties & Timing</h3>
              <div className="grid grid-cols-2 gap-3">
                {numField('Timeout Duration (sec)', 'timeoutDurationSeconds')}
                {numField('Team Readiness Penalty (min)', 'teamReadinessPenaltyMinutes')}
                {numField('Team Readiness Penalty (overs)', 'teamReadinessPenaltyOvers')}
                {numField('Slow Over Rate Penalty (runs)', 'slowOverRatePenaltyRuns')}
                {numField('Innings Duration (min)', 'inningsDurationMinutes')}
                {numField('Default Penalty Runs', 'defaultPenaltyRuns')}
                {numField('Wides/No-Ball Bowler Change Threshold', 'widesNoBallBowlerChangeThreshold')}
              </div>
            </section>

            {/* Batsman Limits */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Batsman Ball Limits</h3>
              <div className="grid grid-cols-2 gap-3">
                {numField('Max Balls (Short Format)', 'maxBallsPerBatsmanShortFormat')}
                {numField('Max Balls (Long Format)', 'maxBallsPerBatsmanLongFormat')}
              </div>
            </section>

            {/* Bowler Limits */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Bowler Over Limits</h3>
              <div className="grid grid-cols-2 gap-3">
                {numField('Max Overs (Short Format)', 'maxOversBowlerShortFormat')}
                {numField('Max Overs (Long Format)', 'maxOversBowlerLongFormat')}
              </div>
            </section>

            {/* Toggles */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Rule Toggles</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">LBW Applicable</Label>
                  <Switch
                    checked={form.lbwApplicable}
                    onCheckedChange={(v) => setBool('lbwApplicable', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Free Hit Applicable</Label>
                  <Switch
                    checked={form.freeHitApplicable}
                    onCheckedChange={(v) => setBool('freeHitApplicable', v)}
                  />
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateRules.isPending}>
            {updateRules.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Save Rules
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
