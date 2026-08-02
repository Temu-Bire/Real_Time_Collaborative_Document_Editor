import { AlertCircle, X } from "lucide-react";

const ErrorAlert = ({ message, onDismiss, className = "" }) => {
  if (!message) return null;

  return (
    <div
      className={`rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2 ${className}`}
      role="alert"
    >
      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700 dark:hover:text-red-200 shrink-0"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
