import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TriangleAlert } from 'lucide-react';

interface ResetAllDataModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ResetAllDataModal({
  open,
  onConfirm,
  onCancel,
  isLoading = false,
}: ResetAllDataModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 flex-shrink-0">
              <TriangleAlert className="w-5 h-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-lg">Reset All Data?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm leading-relaxed">
            This will <strong className="text-foreground">permanently delete</strong> all data including:
          </AlertDialogDescription>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-none">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
              All teams and players
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
              All matches, innings, and scores
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
              Tournament rules (reset to defaults)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
              All locally saved match history
            </li>
          </ul>
          <p className="mt-3 text-sm font-medium text-destructive">
            This action cannot be undone.
          </p>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-white hover:bg-destructive/90 focus:ring-destructive"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Resetting…
              </span>
            ) : (
              'Delete All Data'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
