/**
 * Shared Tailwind class strings for form controls and buttons, so every
 * form in the application keeps a consistent look.
 */
export const LABEL_CLASS =
  'mb-1 block text-sm font-medium text-slate-700';

export const TEXT_INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 transition-colors sm:text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

/** Extra classes appended to inputs when their content is invalid. */
export const TEXT_INPUT_INVALID_CLASS =
  'border-red-400 focus:border-red-500 focus:ring-red-500/25';

export const PRIMARY_BUTTON_CLASS =
  'rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-brand-200 disabled:text-brand-800';

export const SECONDARY_BUTTON_CLASS =
  'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

export const DANGER_BUTTON_CLASS =
  'rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-red-200 disabled:text-red-800';
