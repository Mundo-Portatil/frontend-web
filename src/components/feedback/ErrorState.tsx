import type { AppError, AppErrorKind } from '../../services/api/errors';
import { Notification } from '../notifications/Notification';
import type { NotificationKind } from '../notifications/Notification';
import { SECONDARY_BUTTON_CLASS } from '../../utils/formStyles';

interface ErrorStateProps {
  error: AppError | string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

function errorMessage(error: AppError | string): string {
  return typeof error === 'string' ? error : error.message;
}

function errorKind(error: AppError | string): AppErrorKind | undefined {
  return typeof error === 'string' ? undefined : error.kind;
}

function notificationKind(kind: AppErrorKind | undefined): NotificationKind {
  if (kind === 'unauthorized' || kind === 'forbidden' || kind === 'validation') {
    return 'warning';
  }
  return 'error';
}

/**
 * Reusable error state that keeps the central error classification visible to
 * the user and optionally offers a retry action for connectivity failures.
 */
export function ErrorState({
  error,
  onRetry,
  retryLabel = 'Reintentar',
  className = '',
}: ErrorStateProps) {
  const kind = errorKind(error);

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <Notification kind={notificationKind(kind)}>{errorMessage(error)}</Notification>
      {onRetry && (
        <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
