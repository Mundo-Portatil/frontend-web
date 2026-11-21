import { useEffect, useState } from 'react';
import { asAppError } from '../../../services/api/errors';
import { SECONDARY_BUTTON_CLASS } from '../../../utils/formStyles';
import type { CatalogDetail } from '../catalogModels';
import type { AvailableSerial } from '../hardwareModels';
import { getCatalogDetail } from '../services/catalogService';
import { getAvailableSerials } from '../services/hardwareItemService';

interface CatalogStockDetailModalProps {
  catalogId: string;
  onClose: () => void;
}

export function CatalogStockDetailModal({ catalogId, onClose }: CatalogStockDetailModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CatalogDetail | null>(null);

  // Map of locationId -> AvailableSerial[]
  const [locationSerials, setLocationSerials] = useState<Record<string, AvailableSerial[]>>({});
  const [loadingSerials, setLoadingSerials] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getCatalogDetail(catalogId);
        if (!active) return;
        setDetail(res);

        // If serialized, load available serials for each location with stock
        if (res.item.isSerialized && res.stockSummary.length > 0) {
          setLoadingSerials(true);
          const serialsMap: Record<string, AvailableSerial[]> = {};

          await Promise.all(
            res.stockSummary.map(async (loc) => {
              try {
                const s = await getAvailableSerials({ catalogId, locationId: loc.locationId });
                serialsMap[loc.locationId] = s;
              } catch {
                serialsMap[loc.locationId] = [];
              }
            }),
          );

          if (active) {
            setLocationSerials(serialsMap);
            setLoadingSerials(false);
          }
        }
      } catch (err) {
        if (active) setError(asAppError(err).message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchDetail();
    return () => {
      active = false;
    };
  }, [catalogId]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
        <header className="border-b border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="stock-detail-title" className="text-lg font-semibold text-slate-900">
                Ficha Técnica y Disponibilidad en Almacén
              </h3>
              {detail && (
                <p className="text-sm text-slate-600 mt-0.5">
                  <span className="font-semibold text-slate-900">
                    {detail.item.brand} {detail.item.model}
                  </span>{' '}
                  — Cód. Etiqueta: <span className="font-mono text-xs">{detail.item.sku}</span> (
                  {detail.categoryName})
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && <p className="text-center text-sm text-slate-500">Cargando ficha y stock…</p>}

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && detail && (
            <>
              {/* Technical Specifications Section */}
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Especificaciones Técnicas
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                  <div>
                    <span className="text-slate-400">Marca:</span>
                    <p className="font-medium text-slate-800">{detail.item.brand}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Modelo:</span>
                    <p className="font-medium text-slate-800">{detail.item.model}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Categoría:</span>
                    <p className="font-medium text-slate-800">{detail.categoryName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Cód. Etiqueta:</span>
                    <p className="font-mono font-medium text-slate-800">{detail.item.sku}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Precio Base:</span>
                    <p className="font-semibold text-slate-900">S/ {detail.item.basePrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Umbral Mínimo:</span>
                    <p className="font-medium text-slate-800">{detail.item.minStockThreshold} unidades</p>
                  </div>

                  {detail.item.processor && (
                    <div>
                      <span className="text-slate-400">Procesador:</span>
                      <p className="font-medium text-slate-800">{detail.item.processor}</p>
                    </div>
                  )}
                  {detail.item.ramCapacity && (
                    <div>
                      <span className="text-slate-400">Memoria RAM:</span>
                      <p className="font-medium text-slate-800">{detail.item.ramCapacity}</p>
                    </div>
                  )}
                  {detail.item.storageCapacity && (
                    <div>
                      <span className="text-slate-400">Almacenamiento:</span>
                      <p className="font-medium text-slate-800">{detail.item.storageCapacity}</p>
                    </div>
                  )}
                  {detail.item.gpu && (
                    <div>
                      <span className="text-slate-400">Gráficos (GPU):</span>
                      <p className="font-medium text-slate-800">{detail.item.gpu}</p>
                    </div>
                  )}
                  {detail.item.screenSize && (
                    <div>
                      <span className="text-slate-400">Pantalla:</span>
                      <p className="font-medium text-slate-800">{detail.item.screenSize}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">Tipo de Gestión:</span>
                    <p className="font-medium text-slate-800">
                      {detail.item.isSerialized ? 'Individual por serie' : 'Por cantidad global'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Condición:</span>
                    <p className="font-medium text-slate-800">
                      {detail.item.isSecondHand ? 'Segunda mano' : 'Nuevo'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Estado:</span>
                    <p className={`font-semibold ${detail.item.active ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {detail.item.active ? 'Activo' : 'Dado de baja'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Stock by Location */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Existencias por Ubicación
                  </h4>
                  <span className="text-sm font-bold text-slate-900">
                    Stock Total Global: {detail.totalStockOverall} uds.
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 uppercase text-slate-600">
                      <tr>
                        <th className="px-3 py-2">Ubicación</th>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2 text-center">Con Serie</th>
                        <th className="px-3 py-2 text-center">Por Cantidad</th>
                        <th className="px-3 py-2 text-center">Total Disponible</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detail.stockSummary.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                            Sin existencias en ninguna ubicación activa.
                          </td>
                        </tr>
                      ) : (
                        detail.stockSummary.map((summary) => (
                          <tr key={summary.locationId} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium text-slate-900">{summary.locationName}</td>
                            <td className="px-3 py-2 text-slate-500">{summary.locationType}</td>
                            <td className="px-3 py-2 text-center text-slate-700">{summary.serializedCount}</td>
                            <td className="px-3 py-2 text-center text-slate-700">{summary.quantityCount}</td>
                            <td className="px-3 py-2 text-center font-bold text-slate-900">
                              {summary.totalAvailable}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Exact Serial Numbers per Location (if isSerialized) */}
              {detail.item.isSerialized && (
                <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Números de Serie Exactos por Almacén
                    </h4>
                    {loadingSerials && (
                      <span className="text-xs text-slate-400">Consultando series…</span>
                    )}
                  </div>

                  {detail.stockSummary.length === 0 || detail.totalStockOverall === 0 ? (
                    <p className="text-xs text-slate-400 italic">No hay series registradas en stock.</p>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {detail.stockSummary.map((loc) => {
                        const locSerials = locationSerials[loc.locationId] || [];
                        return (
                          <div key={`loc-serials-${loc.locationId}`} className="space-y-1.5">
                            <h5 className="text-xs font-medium text-slate-700">
                              {loc.locationName} ({locSerials.length} series):
                            </h5>
                            {locSerials.length === 0 ? (
                              <p className="text-[0.6875rem] text-slate-400 italic">
                                Sin series disponibles en este almacén.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {locSerials.map((s) => (
                                  <span
                                    key={s.id}
                                    className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-0.5 font-mono text-[0.6875rem] text-slate-800"
                                  >
                                    <span className="font-semibold">{s.serialNumber}</span>
                                    {s.salePrice !== null && (
                                      <span className="text-slate-500 font-sans">
                                        (S/ {s.salePrice.toFixed(2)})
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
            </>
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
