import { useEffect, useState } from 'react';
import { asAppError } from '../../../../services/api/errors';
import { useLocationStore } from '../../../../stores/locationStore';
import { listActiveLocations } from '../services/locationService';
import { InlineSpinner } from '../../../../components/feedback/InlineSpinner';

/**
 * Shared selector for the operational location context.
 *
 * The available list lives in the Zustand store so any location created or
 * updated from the administration screen is reflected here immediately,
 * without waiting for a full page reload.
 */
export function LocationSelector() {
  const activeLocation = useLocationStore((state) => state.activeLocation);
  const availableLocations = useLocationStore((state) => state.availableLocations);
  const selectLocation = useLocationStore((state) => state.selectLocation);
  const clearLocation = useLocationStore((state) => state.clearLocation);
  const setAvailableLocations = useLocationStore((state) => state.setAvailableLocations);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void listActiveLocations()
      .then((data) => {
        if (isCurrent) setAvailableLocations(data);
      })
      .catch((reason: unknown) => {
        if (isCurrent) setError(asAppError(reason).message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [setAvailableLocations]);

  if (isLoading && availableLocations.length === 0) {
    return (
      <span role="status" className="flex min-w-0 items-center gap-2 text-sm text-brand-100">
        <InlineSpinner className="border-brand-200" /> Cargando ubicaciones…
      </span>
    );
  }

  if (error && availableLocations.length === 0) {
    return (
      <span
        role="alert"
        className="max-w-full break-words text-sm text-amber-200 lg:max-w-56"
        title={error}
      >
        {error}
      </span>
    );
  }

  if (availableLocations.length === 0) {
    return <span className="text-sm text-brand-100">Sin ubicaciones activas</span>;
  }

  return (
    <label className="flex w-full min-w-0 items-center gap-2 text-sm text-brand-100 lg:w-auto">
      <span className="sr-only">Ubicación operativa</span>
      <select
        aria-label="Ubicación operativa"
        value={activeLocation?.id ?? ''}
        onChange={(event) => {
          if (event.target.value === '') {
            clearLocation();
            return;
          }
          const location = availableLocations.find((item) => item.id === event.target.value);
          if (location) selectLocation(location);
        }}
        className="w-full min-w-0 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1.5 text-sm text-white transition-colors hover:bg-white/15 focus:border-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:max-w-56"
      >
        <option value="" className="bg-brand-950 text-white">
          Todas las ubicaciones
        </option>
        {availableLocations.map((location) => (
          <option key={location.id} value={location.id} className="bg-brand-950 text-white">
            {location.name}
          </option>
        ))}
      </select>
    </label>
  );
}
