import { InlineSpinner } from './InlineSpinner';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

/** Reusable loading state for queries and administrative operations. */
export function LoadingState({ message = 'Cargando...', className = '' }: LoadingStateProps) {
  return (
    <p role="status" className={`flex items-center gap-2 text-sm text-slate-500 ${className}`}>
      <InlineSpinner />
      <span>{message}</span>
    </p>
  );
}
