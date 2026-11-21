import { useEffect, useState, type FormEvent } from 'react';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import { asAppError } from '../../../services/api/errors';
import { openLabelsPdf } from '../../../services/printer/labelPdfService';
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import type { Location } from '../../foundation/locations/models';
import { listActiveLocations } from '../../foundation/locations/services/locationService';
import type { HardwareItem } from '../hardwareModels';
import { getSingleBarcodeLabel } from '../services/barcodeLabelService';
import { getCatalogDetail } from '../services/catalogService';
import { scanHardware } from '../services/hardwareItemService';
import { HardwareLifecycleModal } from './HardwareLifecycleModal';

interface ScannerQuickLookupBarProps {
  onItemScanned?: (item: HardwareItem) => void;
}

export function ScannerQuickLookupBar({ onItemScanned }: ScannerQuickLookupBarProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultItem, setResultItem] = useState<HardwareItem | null>(null);

  // Resolved display names
  const [locations, setLocations] = useState<Location[]>([]);
  const [resolvedModelName, setResolvedModelName] = useState<string>('');
  const [resolvedLocationName, setResolvedLocationName] = useState<string>('');

  // Modals / actions
  const [lifecycleModalOpen, setLifecycleModalOpen] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const [labelMessage, setLabelMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void listActiveLocations().then((locs) => {
      if (active) setLocations(locs);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = async (codeToSearch: string) => {
    const code = codeToSearch.trim();
    if (!code) return;

    setSearching(true);
    setError(null);
    setLabelMessage(null);
    setResultItem(null);
    setResolvedModelName('');
    setResolvedLocationName('');

    try {
      const item = await scanHardware(code);
      setResultItem(item);
      onItemScanned?.(item);

      // Resolve location name
      const loc = locations.find((l) => l.id === item.locationId);
      setResolvedLocationName(item.locationName ?? loc?.name ?? 'Ubicación desconocida');

      // Resolve model/brand if missing
      if (item.catalogBrand && item.catalogModel) {
        setResolvedModelName(`${item.catalogBrand} ${item.catalogModel}`);
      } else if (item.catalogId) {
        try {
          const detail = await getCatalogDetail(item.catalogId);
          setResolvedModelName(`${detail.item.brand} ${detail.item.model}`);
        } catch {
          setResolvedModelName('Modelo desconocido');
        }
      }
    } catch (e) {
      setError(asAppError(e).message);
    } finally {
      setSearching(false);
    }
  };

  useBarcodeScanner((scannedValue) => {
    setQuery(scannedValue);
    void handleSearch(scannedValue);
  }, !searching);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleSearch(query);
  };

  const handlePrintLabel = async () => {
    if (!resultItem) return;
    setLabelLoading(true);
    setLabelMessage(null);
    try {
      const label = await getSingleBarcodeLabel(resultItem.id);
      openLabelsPdf([label]);
      setLabelMessage('Etiqueta PDF generada.');
    } catch (e) {
      setError(`Error generando etiqueta: ${asAppError(e).message}`);
    } finally {
      setLabelLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={searching}
            placeholder="Pistolee o escriba N/S o código de barras (Enter)..."
            className={`${TEXT_INPUT_CLASS} pr-10`}
            aria-label="Pistolear o escribir N/S o código"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </span>
        </div>
        <button type="submit" disabled={searching || !query.trim()} className={PRIMARY_BUTTON_CLASS}>
          {searching ? 'Buscando…' : 'Buscar'}
        </button>
        {resultItem && (
          <button
            type="button"
            onClick={() => {
              setResultItem(null);
              setQuery('');
              setError(null);
            }}
            className={SECONDARY_BUTTON_CLASS}
          >
            Limpiar
          </button>
        )}
      </form>

      {error && (
        <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {labelMessage && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {labelMessage}
        </div>
      )}

      {resultItem && (
        <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{resolvedModelName || 'Equipo en stock'}</span>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                  {resultItem.status}
                </span>
              </div>
              <p className="mt-1 font-mono text-sm text-slate-700">
                Serie: <span className="font-semibold">{resultItem.serialNumber}</span>
                {resultItem.catalogSku && (
                  <span className="ml-3 font-sans text-xs text-slate-500">
                    Cód. Etiqueta: {resultItem.catalogSku}
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-600">
                Ubicación: <span className="font-medium">{resolvedLocationName}</span>
                {resultItem.salePrice !== null && (
                  <span className="ml-3 font-semibold text-slate-900">
                    Precio: S/ {resultItem.salePrice.toFixed(2)}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setLifecycleModalOpen(true)}
                className={`${SECONDARY_BUTTON_CLASS} text-xs`}
              >
                Hoja de Vida
              </button>
              <button
                type="button"
                disabled={labelLoading}
                onClick={() => void handlePrintLabel()}
                className={`${SECONDARY_BUTTON_CLASS} text-xs`}
              >
                {labelLoading ? 'Generando…' : 'Imprimir Etiqueta 1D'}
              </button>
            </div>
          </div>
        </div>
      )}

      {lifecycleModalOpen && resultItem && (
        <HardwareLifecycleModal
          hardwareItemId={resultItem.id}
          serialNumber={resultItem.serialNumber}
          onClose={() => setLifecycleModalOpen(false)}
        />
      )}
    </div>
  );
}
