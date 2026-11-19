interface EmptyStateProps {
  message: string;
  className?: string;
}

/** Reusable empty state for lists without results. */
export function EmptyState({ message, className = '' }: EmptyStateProps) {
  return (
    <p className={`rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 ${className}`}>
      {message}
    </p>
  );
}
