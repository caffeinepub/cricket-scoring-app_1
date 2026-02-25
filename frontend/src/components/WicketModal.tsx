import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { WicketType, Player } from '../backend';

interface WicketModalProps {
  open: boolean;
  onClose: () => void;
  striker: Player | null;
  nonStriker: Player | null;
  fieldingTeam: Player[];
  onConfirm: (batsmanId: bigint, wicket: WicketType) => void;
}

const DISMISSAL_TYPES = [
  { value: 'Bowled', label: 'Bowled' },
  { value: 'Caught', label: 'Caught' },
  { value: 'LBW', label: 'LBW' },
  { value: 'RunOut', label: 'Run Out' },
  { value: 'Stumped', label: 'Stumped' },
  { value: 'HitWicket', label: 'Hit Wicket' },
  { value: 'Other', label: 'Other' },
];

export default function WicketModal({ open, onClose, striker, nonStriker, fieldingTeam, onConfirm }: WicketModalProps) {
  const [batsmanOut, setBatsmanOut] = useState<'striker' | 'nonStriker'>('striker');
  const [dismissalType, setDismissalType] = useState('Bowled');
  const [otherText, setOtherText] = useState('');

  const handleConfirm = () => {
    const batsman = batsmanOut === 'striker' ? striker : nonStriker;
    if (!batsman) return;

    let wicket: WicketType;
    switch (dismissalType) {
      case 'Bowled': wicket = { __kind__: 'Bowled', Bowled: null }; break;
      case 'Caught': wicket = { __kind__: 'Caught', Caught: null }; break;
      case 'LBW': wicket = { __kind__: 'LBW', LBW: null }; break;
      case 'RunOut': wicket = { __kind__: 'RunOut', RunOut: null }; break;
      case 'Stumped': wicket = { __kind__: 'Stumped', Stumped: null }; break;
      case 'HitWicket': wicket = { __kind__: 'HitWicket', HitWicket: null }; break;
      default: wicket = { __kind__: 'Other', Other: otherText || 'Out' }; break;
    }

    onConfirm(batsman.id, wicket);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-cricket-red">🚨 Wicket!</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold">Batsman Out</Label>
            <RadioGroup
              value={batsmanOut}
              onValueChange={(v) => setBatsmanOut(v as 'striker' | 'nonStriker')}
              className="mt-2 space-y-2"
            >
              {striker && (
                <div className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="striker" id="out-striker" />
                  <Label htmlFor="out-striker" className="cursor-pointer">
                    {striker.name} <span className="text-cricket-green font-bold">*</span> (Striker)
                  </Label>
                </div>
              )}
              {nonStriker && (
                <div className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="nonStriker" id="out-non-striker" />
                  <Label htmlFor="out-non-striker" className="cursor-pointer">
                    {nonStriker.name} (Non-Striker)
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-semibold">Dismissal Type</Label>
            <Select value={dismissalType} onValueChange={setDismissalType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISMISSAL_TYPES.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {dismissalType === 'Other' && (
            <div>
              <Label className="text-sm font-semibold">Details</Label>
              <Input
                value={otherText}
                onChange={e => setOtherText(e.target.value)}
                placeholder="e.g. Handled the ball"
                className="mt-1"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            className="bg-cricket-red text-white hover:bg-cricket-red/90"
          >
            Confirm Wicket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
