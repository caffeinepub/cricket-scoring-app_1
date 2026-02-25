import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QueryErrorStateProps {
  error?: Error | unknown;
  onRetry?: () => void;
  title?: string;
  description?: string;
  retryLabel?: string;
  /** Additional action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

function isInfrastructureError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('IC0508') ||
    msg.includes('stopped') ||
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError')
  );
}

export default function QueryErrorState({
  error,
  onRetry,
  title,
  description,
  retryLabel = 'Retry',
  secondaryAction,
}: QueryErrorStateProps) {
  const isInfra = isInfrastructureError(error);

  const defaultTitle = isInfra
    ? 'Service Temporarily Unavailable'
    : 'Something Went Wrong';

  const defaultDescription = isInfra
    ? 'The service is temporarily unavailable. Please try again in a moment.'
    : 'An error occurred while loading data. Please try again.';

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
      {isInfra ? (
        <WifiOff className="w-10 h-10 text-muted-foreground" />
      ) : (
        <AlertTriangle className="w-10 h-10 text-destructive" />
      )}
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground">{title ?? defaultTitle}</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {description ?? defaultDescription}
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {retryLabel}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="ghost" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
