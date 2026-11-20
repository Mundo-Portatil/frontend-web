import type { ReactNode } from 'react';

export type BadgeTone = 'success' | 'neutral' | 'warning' | 'danger' | 'info';

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  neutral: 'bg-slate-200 text-slate-700',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-800',
};

/** Small, consistent status pill used across the inventory module. */
export function InventoryBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}
