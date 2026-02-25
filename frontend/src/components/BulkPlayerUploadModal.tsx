import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, XCircle, AlertTriangle, Users, FileText } from 'lucide-react';
import { useAddPlayer } from '@/hooks/useQueries';
import type { Player } from '@/backend';

interface BulkPlayerUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: bigint;
  currentPlayers: Player[];
  onSuccess?: () => void;
}

interface ParsedPlayer {
  name: string;
  status: 'valid' | 'duplicate' | 'empty' | 'too-long' | 'too-short' | 'no-space';
  reason?: string;
}

type UploadStep = 'input' | 'preview' | 'result';

function parseName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

function validateAndParsePlayers(
  rawText: string,
  currentPlayers: Player[]
): ParsedPlayer[] {
  const lines = rawText
    .split(/[\n,]+/)
    .map(parseName)
    .filter((l) => l.length > 0 || rawText.includes(l));

  const existingNames = new Set(currentPlayers.map((p) => p.name.toLowerCase()));
  const seenInBatch = new Set<string>();

  return lines.map((name) => {
    if (!name || name.length === 0) {
      return { name: name || '(empty)', status: 'empty', reason: 'Empty name' };
    }
    if (name.length < 3) {
      return { name, status: 'too-short', reason: 'Name must be at least 3 characters' };
    }
    if (name.length > 50) {
      return { name, status: 'too-long', reason: 'Name must not exceed 50 characters' };
    }
    if (!name.includes(' ')) {
      return { name, status: 'no-space', reason: 'Name must contain at least one space' };
    }
    if (existingNames.has(name.toLowerCase())) {
      return { name, status: 'duplicate', reason: 'Already in team' };
    }
    if (seenInBatch.has(name.toLowerCase())) {
      return { name, status: 'duplicate', reason: 'Duplicate in upload list' };
    }

    seenInBatch.add(name.toLowerCase());
    return { name, status: 'valid' };
  });
}

const statusConfig: Record<ParsedPlayer['status'], { icon: React.ReactNode; color: string; label: string }> = {
  valid: {
    icon: <CheckCircle size={14} />,
    color: 'oklch(0.55 0.15 145)',
    label: 'Valid',
  },
  duplicate: {
    icon: <XCircle size={14} />,
    color: 'oklch(0.55 0.18 45)',
    label: 'Duplicate',
  },
  empty: {
    icon: <XCircle size={14} />,
    color: 'oklch(0.55 0.22 25)',
    label: 'Empty',
  },
  'too-short': {
    icon: <AlertTriangle size={14} />,
    color: 'oklch(0.55 0.18 80)',
    label: 'Too short',
  },
  'too-long': {
    icon: <AlertTriangle size={14} />,
    color: 'oklch(0.55 0.18 80)',
    label: 'Too long',
  },
  'no-space': {
    icon: <AlertTriangle size={14} />,
    color: 'oklch(0.55 0.18 80)',
    label: 'No space',
  },
};

const BulkPlayerUploadModal: React.FC<BulkPlayerUploadModalProps> = ({
  open,
  onOpenChange,
  teamId,
  currentPlayers,
  onSuccess,
}) => {
  const [step, setStep] = useState<UploadStep>('input');
  const [rawText, setRawText] = useState('');
  const [parsedPlayers, setParsedPlayers] = useState<ParsedPlayer[]>([]);
  const [addedCount, setAddedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addPlayerMutation = useAddPlayer();

  const handleReset = () => {
    setStep('input');
    setRawText('');
    setParsedPlayers([]);
    setAddedCount(0);
    setSkippedCount(0);
    setIsProcessing(false);
    setErrors([]);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      handleReset();
    }
    onOpenChange(open);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setRawText(content || '');
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePreview = () => {
    if (!rawText.trim()) return;
    const parsed = validateAndParsePlayers(rawText, currentPlayers);
    setParsedPlayers(parsed);
    setStep('preview');
  };

  const handleConfirm = async () => {
    const validPlayers = parsedPlayers.filter((p) => p.status === 'valid');
    const skipped = parsedPlayers.filter((p) => p.status !== 'valid');

    setIsProcessing(true);
    setErrors([]);

    let added = 0;
    const errorList: string[] = [];

    for (let i = 0; i < validPlayers.length; i++) {
      const player = validPlayers[i];
      try {
        const battingOrder = BigInt(currentPlayers.length + added + 1);
        await addPlayerMutation.mutateAsync({
          teamId,
          name: player.name,
          battingOrder,
          isBowler: false,
        });
        added++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errorList.push(`${player.name}: ${msg}`);
      }
    }

    setAddedCount(added);
    setSkippedCount(skipped.length + (validPlayers.length - added));
    setErrors(errorList);
    setIsProcessing(false);
    setStep('result');

    if (added > 0 && onSuccess) {
      onSuccess();
    }
  };

  const validCount = parsedPlayers.filter((p) => p.status === 'valid').length;
  const invalidCount = parsedPlayers.filter((p) => p.status !== 'valid').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg"
        style={{
          background: 'oklch(1 0 0)',
          border: '1px solid oklch(0.88 0.015 240)',
          borderRadius: '0.75rem',
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2 font-display text-xl"
            style={{ color: 'oklch(0.22 0.07 240)' }}
          >
            <Users size={20} style={{ color: 'oklch(0.65 0.18 45)' }} />
            Bulk Add Players
          </DialogTitle>
          <DialogDescription style={{ color: 'oklch(0.5 0.03 240)' }}>
            {step === 'input' && 'Paste player names or upload a .txt/.csv file. One name per line or comma-separated.'}
            {step === 'preview' && 'Review the parsed names before adding them to the team.'}
            {step === 'result' && 'Bulk upload complete. See the summary below.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Input */}
        {step === 'input' && (
          <div className="space-y-4">
            <div
              className="rounded-lg p-3 text-sm"
              style={{
                background: 'oklch(0.22 0.07 240 / 0.06)',
                border: '1px solid oklch(0.22 0.07 240 / 0.15)',
                color: 'oklch(0.35 0.05 240)',
              }}
            >
              <p className="font-semibold mb-1" style={{ color: 'oklch(0.22 0.07 240)' }}>Format requirements:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>Each name must have at least one space (e.g., "John Smith")</li>
                <li>3–50 characters per name</li>
                <li>Duplicates will be skipped automatically</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'oklch(0.22 0.07 240)' }}>
                Paste Names
              </label>
              <Textarea
                placeholder={`John Smith\nJane Doe\nAlex Johnson\n...`}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={6}
                className="resize-none text-sm"
                style={{
                  border: '1px solid oklch(0.88 0.015 240)',
                  borderRadius: '0.5rem',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'oklch(0.88 0.015 240)' }} />
              <span className="text-xs font-medium" style={{ color: 'oklch(0.6 0.03 240)' }}>OR</span>
              <div className="flex-1 h-px" style={{ background: 'oklch(0.88 0.015 240)' }} />
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="bulk-upload-file"
              />
              <label htmlFor="bulk-upload-file">
                <div
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium"
                  style={{
                    border: '2px dashed oklch(0.65 0.18 45 / 0.4)',
                    background: 'oklch(0.65 0.18 45 / 0.05)',
                    color: 'oklch(0.55 0.15 45)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = 'oklch(0.65 0.18 45 / 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = 'oklch(0.65 0.18 45 / 0.05)';
                  }}
                >
                  <FileText size={16} />
                  Upload .txt or .csv file
                </div>
              </label>
              {rawText && (
                <p className="text-xs mt-1.5" style={{ color: 'oklch(0.55 0.15 145)' }}>
                  ✓ File loaded — {rawText.split(/[\n,]+/).filter(l => l.trim()).length} entries detected
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'oklch(0.55 0.15 145 / 0.12)', color: 'oklch(0.45 0.15 145)' }}
              >
                <CheckCircle size={12} />
                {validCount} valid
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'oklch(0.55 0.22 25 / 0.12)', color: 'oklch(0.45 0.18 25)' }}
              >
                <XCircle size={12} />
                {invalidCount} skipped
              </div>
              <div
                className="ml-auto text-xs"
                style={{ color: 'oklch(0.5 0.03 240)' }}
              >
                Current: {currentPlayers.length} players
              </div>
            </div>

            <ScrollArea className="h-64 rounded-lg" style={{ border: '1px solid oklch(0.88 0.015 240)' }}>
              <div className="p-2 space-y-1">
                {parsedPlayers.map((player, idx) => {
                  const config = statusConfig[player.status];
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm"
                      style={{
                        background: player.status === 'valid'
                          ? 'oklch(0.55 0.15 145 / 0.06)'
                          : 'oklch(0.55 0.22 25 / 0.06)',
                      }}
                    >
                      <span style={{ color: config.color }}>{config.icon}</span>
                      <span
                        className="flex-1 font-medium truncate"
                        style={{ color: 'oklch(0.22 0.07 240)' }}
                      >
                        {player.name}
                      </span>
                      {player.status !== 'valid' && (
                        <span className="text-xs" style={{ color: 'oklch(0.55 0.08 240)' }}>
                          {player.reason}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {validCount === 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  No valid player names found. Please check the format requirements and try again.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step: Result */}
        {step === 'result' && (
          <div className="space-y-4">
            <div
              className="rounded-xl p-5 text-center"
              style={{
                background: addedCount > 0
                  ? 'oklch(0.55 0.15 145 / 0.08)'
                  : 'oklch(0.55 0.22 25 / 0.08)',
                border: `1px solid ${addedCount > 0 ? 'oklch(0.55 0.15 145 / 0.3)' : 'oklch(0.55 0.22 25 / 0.3)'}`,
              }}
            >
              {addedCount > 0 ? (
                <CheckCircle
                  size={40}
                  className="mx-auto mb-3"
                  style={{ color: 'oklch(0.55 0.15 145)' }}
                />
              ) : (
                <XCircle
                  size={40}
                  className="mx-auto mb-3"
                  style={{ color: 'oklch(0.55 0.22 25)' }}
                />
              )}
              <p className="font-display text-2xl font-bold" style={{ color: 'oklch(0.22 0.07 240)' }}>
                {addedCount} Player{addedCount !== 1 ? 's' : ''} Added
              </p>
              {skippedCount > 0 && (
                <p className="text-sm mt-1" style={{ color: 'oklch(0.5 0.03 240)' }}>
                  {skippedCount} skipped
                </p>
              )}
            </div>

            {errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.18 25)' }}>
                  Errors during upload:
                </p>
                <ScrollArea className="h-24 rounded-lg" style={{ border: '1px solid oklch(0.88 0.015 240)' }}>
                  <div className="p-2 space-y-1">
                    {errors.map((err, i) => (
                      <p key={i} className="text-xs" style={{ color: 'oklch(0.45 0.18 25)' }}>
                        • {err}
                      </p>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'input' && (
            <>
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                style={{ borderColor: 'oklch(0.88 0.015 240)', color: 'oklch(0.35 0.05 240)' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!rawText.trim()}
                style={{
                  background: 'oklch(0.65 0.18 45)',
                  color: 'oklch(0.1 0.02 240)',
                  fontWeight: 600,
                }}
              >
                <Upload size={14} className="mr-1.5" />
                Preview Names
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep('input')}
                style={{ borderColor: 'oklch(0.88 0.015 240)', color: 'oklch(0.35 0.05 240)' }}
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={validCount === 0 || isProcessing}
                style={{
                  background: validCount > 0 ? 'oklch(0.65 0.18 45)' : undefined,
                  color: validCount > 0 ? 'oklch(0.1 0.02 240)' : undefined,
                  fontWeight: 600,
                }}
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin mr-1.5">⟳</span>
                    Adding...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} className="mr-1.5" />
                    Add {validCount} Player{validCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'result' && (
            <>
              <Button
                variant="outline"
                onClick={handleReset}
                style={{ borderColor: 'oklch(0.88 0.015 240)', color: 'oklch(0.35 0.05 240)' }}
              >
                Add More
              </Button>
              <Button
                onClick={() => handleClose(false)}
                style={{
                  background: 'oklch(0.65 0.18 45)',
                  color: 'oklch(0.1 0.02 240)',
                  fontWeight: 600,
                }}
              >
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkPlayerUploadModal;
