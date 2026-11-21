import { useEffect, useState } from 'react';
import { asAppError } from '../../../services/api/errors';
import { SECONDARY_BUTTON_CLASS } from '../../../utils/formStyles';
import type { HardwareLifecycleEntry, HardwareLifecycleResponse } from '../hardwareModels';
import { getHardwareLifecycle } from '../services/hardwareItemService';

interface HardwareLifecycleModalProps {
  hardwareItemId: string;
  serialNumber: string;
  onClose: () => void;
}

export function HardwareLifecycleModal({
  hardwareItemId,
  serialNumber,
  onClose,
}: HardwareLifecycleModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HardwareLifecycleResponse | null>(null);

  useEffect(() => {
    let active = true;
    const fetchLifecycle = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getHardwareLifecycle(hardwareItemId);
        if (active) setData(res);
      } catch (err) {
        if (active) setError(asAppError(err).message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchLifecycle();
    return () => {
      active = false;
    };
  }, [hardwareItemId]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lifecycle-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
          <div>
            <h3 id="lifecycle-title" className="text-lg font-semibold text-slate-900">
              Hoja de Vida de Trazabilidad
            </h3>
            <p className="font-mono text-sm text-slate-500">Serie: {serialNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading && <p className="text-center text-sm text-slate-500">Cargando trazabilidad…</p>}

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">Estado actual:</span> {data.hardwareItem?.status ?? 'EN_STOCK'}
                {data.hardwareItem?.locationName && (
                  <span className="ml-4 font-semibold text-slate-900">Ubicación: {data.hardwareItem.locationName}</span>
                )}
              </div>

              {data.lifecycle.length === 0 ? (
                <p className="text-center text-sm text-slate-500">No hay eventos de trazabilidad registrados.</p>
              ) : (
                <ol className="relative ml-3 border-l border-slate-200 space-y-4">
                  {data.lifecycle.map((entry: HardwareLifecycleEntry, idx: number) => (
                    <li key={entry.id ?? idx} className="ml-4">
                      <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-brand-500" />
                      <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900">{entry.action}</span>
                          <span className="text-xs text-slate-400">
                            {entry.timestamp || entry.createdAt || 'Fecha desconocida'}
                          </span>
                        </div>
                        {entry.description && (
                          <p className="mt-1 text-sm text-slate-600">{entry.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                          {entry.userName && (
                            <span className="inline-flex items-center gap-1">
                              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Responsable: {entry.userName}
                            </span>
                          )}
                          {entry.locationName && (
                            <span className="inline-flex items-center gap-1">
                              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Ubicación: {entry.locationName}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>

        <footer className="border-t border-slate-100 p-4 sm:p-5 text-right">
          <button type="button" onClick={onClose} className={SECONDARY_BUTTON_CLASS}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}
