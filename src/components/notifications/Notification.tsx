import type { ReactNode } from 'react';

export type NotificationKind = 'success' | 'warning' | 'error';

const CLASS_BY_KIND: Record<NotificationKind, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-800',
};

/** Shared accessible feedback for successful, warning and failed operations. */
export function Notification({ kind, children }: { kind: NotificationKind; children: ReactNode }) {
  return <p role={kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${CLASS_BY_KIND[kind]}`}>{children}</p>;
}
