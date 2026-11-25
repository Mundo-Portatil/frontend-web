import type { AvailabilityDisplay } from '../hooks/useCatalogAvailability';

interface CatalogAvailabilityCellProps {
  itemName: string;
  display: AvailabilityDisplay;
}

/**
 * Renders the confirmed availability state without ever showing a premature
 * zero. The loading skeleton is hidden from assistive technology, which gets
 * an explicit status message instead.
 */
export function CatalogAvailabilityCell({ itemName, display }: CatalogAvailabilityCellProps) {
  if (display.status === 'loading') {
    return (
      <span className="inline-flex items-center gap-2">
        <span aria-hidden="true" className="h-3 w-10 animate-pulse rounded bg-slate-200" />
        <span className="sr-only">Cargando cantidad de {itemName}</span>
      </span>
    );
  }

  if (display.status === 'error') {
    return <span className="text-xs text-slate-600">No se pudo obtener</span>;
  }

  if (display.status === 'empty') {
    return <span className="text-xs text-slate-600">Sin existencias</span>;
  }

  return <span className="font-semibold tabular-nums text-slate-900">{display.quantity}</span>;
}
