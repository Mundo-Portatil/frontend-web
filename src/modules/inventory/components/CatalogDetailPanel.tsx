import { useEffect, useState } from 'react';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { asAppError, type AppError } from '../../../services/api/errors';
import { SECONDARY_BUTTON_CLASS } from '../../../utils/formStyles';
import type { CatalogDetail } from '../catalogModels';
import { getCatalogDetail } from '../services/catalogService';

export function CatalogDetailPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const [detail, setDetail] = useState<CatalogDetail | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetail(null);
    setError(null);
    void getCatalogDetail(id, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setDetail(data);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(asAppError(reason));
      });
    return () => controller.abort();
  }, [id, revision]);

  const technicalFields = detail ? [
    ['Procesador', detail.item.processor],
    ['Memoria RAM', detail.item.ramCapacity],
    ['Almacenamiento', detail.item.storageCapacity],
    ['Tarjeta gráfica', detail.item.gpu],
    ['Pantalla', detail.item.screenSize],
  ].filter(([, value]) => typeof value === 'string' && value.trim().length > 0) : [];

  return (
    <section
      className="min-w-0 rounded-xl border border-brand-200 bg-white p-4 shadow-sm sm:p-5"
      aria-label="Ficha de producto"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Ficha de producto</h3>
          <p className="mt-1 text-sm text-slate-500">Características y existencias por ubicación.</p>
        </div>
        <button className={SECONDARY_BUTTON_CLASS} onClick={onClose}>
          Cerrar ficha
        </button>
      </div>

      {error ? (
        <div className="mt-4">
          <ErrorState error={error} onRetry={() => setRevision((value) => value + 1)} />
        </div>
      ) : !detail ? (
        <LoadingState message="Cargando ficha…" />
      ) : (
        <div className="mt-4 space-y-5">
          <div className="min-w-0">
            <h4 className="break-words font-semibold text-slate-900">{detail.item.brand} {detail.item.model}</h4>
            <p className="mt-1 break-words text-xs text-slate-500">Código de producto: {detail.item.sku}</p>
          </div>

          <section aria-label="Información general" className="border-t border-slate-100 pt-4">
            <h5 className="mb-3 text-sm font-semibold text-slate-900">Información general</h5>
            <dl className="grid min-w-0 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries({
                Categoría: detail.categoryName,
                Marca: detail.item.brand,
                Modelo: detail.item.model,
                'Precio base (PEN)': detail.item.basePrice,
                'Mínimo recomendado': detail.item.minStockThreshold,
                'Control de unidades': detail.item.isSerialized ? 'Por serie o código' : 'Por cantidad',
                Condición: detail.item.isSecondHand ? 'Usado' : 'Nuevo',
                Estado: detail.item.active ? 'Activo' : 'Inactivo',
              }).filter(([, value]) => value !== null && value !== undefined && (typeof value !== 'string' || value.trim().length > 0)).map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="mt-0.5 break-words font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {technicalFields.length > 0 && (
            <details className="rounded-lg border border-slate-200 p-3">
              <summary className="w-fit cursor-pointer rounded text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Características técnicas</summary>
              <dl className="mt-3 grid min-w-0 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {technicalFields.map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="mt-0.5 break-words font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}

          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">
              {`Stock total disponible: ${detail.totalStockOverall}`}
            </p>
            <p className="mt-1 text-xs text-slate-500">Total en ubicaciones activas.</p>
          </div>

          {!detail.stockSummary.length ? (
            <p className="text-sm text-slate-500">Sin existencias por ubicación.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <caption className="mb-2 text-left font-semibold text-slate-900">
                  Stock por ubicación
                </caption>
                <thead className="bg-slate-50">
                  <tr>
                    {['Ubicación', 'Tipo', 'Disponible'].map((label) => (
                      <th key={label} scope="col" className="px-3 py-2 text-left font-medium text-slate-600">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {detail.stockSummary.map((stock) => (
                    <tr key={stock.locationId}>
                      <td className="px-3 py-2 text-slate-900">{stock.locationName}</td>
                      <td className="px-3 py-2 text-slate-700">{stock.locationType === 'ALMACEN_CENTRAL' ? 'Almacén central' : stock.locationType === 'PUESTO' ? 'Puesto' : '—'}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{stock.totalAvailable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
