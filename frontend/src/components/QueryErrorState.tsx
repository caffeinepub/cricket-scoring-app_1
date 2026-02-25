import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Detects whether an error is an Internet Computer canister rejection
 * (e.g. IC0508 – canister stopped, IC0503 – canister out of cycles, etc.)
 */
function isCanisterError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("Reject code:") ||
    msg.includes("IC0508") ||
    msg.includes("IC0503") ||
    msg.includes("IC0504") ||
    msg.includes("is stopped") ||
    msg.includes("CallContextManager") ||
    msg.includes("replica returned a rejection")
  );
}

/**
 * Returns a short, user-friendly description for a backend error.
 */
function friendlyMessage(error: unknown): string {
  if (!error) return "An unexpected error occurred.";
  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes("is stopped") || msg.includes("IC0508") || msg.includes("CallContextManager")) {
    return "The backend service is temporarily unavailable. Please try again in a moment.";
  }
  if (msg.includes("out of cycles") || msg.includes("IC0503")) {
    return "The backend service has run out of resources. Please contact support.";
  }
  if (msg.includes("IC0504")) {
    return "The backend service is overloaded. Please try again shortly.";
  }
  if (isCanisterError(error)) {
    return "Unable to connect to the backend. Please try again later.";
  }
  // For non-IC errors, show a truncated version (max 120 chars)
  return msg.length > 120 ? msg.slice(0, 120) + "…" : msg;
}

interface QueryErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

export default function QueryErrorState({
  error,
  onRetry,
  title = "Failed to load data",
  className = "",
}: QueryErrorStateProps) {
  const isIC = isCanisterError(error);
  const message = friendlyMessage(error);

  return (
    <div className={`space-y-3 ${className}`}>
      <Alert variant="destructive">
        {isIC ? (
          <WifiOff className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
