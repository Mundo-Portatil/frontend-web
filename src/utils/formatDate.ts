const FORMATTER = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/**
 * Formats an ISO date string for the UI using the es-PE locale.
 * Falls back to the raw string when the value cannot be parsed.
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return FORMATTER.format(date);
}
