/** Small accessible spinner used inside buttons and compact loading states. */
export function InlineSpinner({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}
