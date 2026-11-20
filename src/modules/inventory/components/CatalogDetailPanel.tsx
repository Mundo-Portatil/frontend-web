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

  return (
    <section
      className="rounded-xl border border-brand-200 bg-white p-4 shadow-sm sm:p-5"
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
        <LoadingState message="Cargando ficha..." />
      ) : (
        <div className="mt-4 space-y-5">
          <div>
            <h4 className="font-semibold text-slate-900">{detail.item.name}</h4>
            <p className="text-sm text-slate-500">
              {detail.item.brand} · {detail.item.model} · {detail.categoryName}
            </p>
          </div>

          <dl className="grid gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries({
              'Código de producto': detail.item.sku,
              Categoría: detail.categoryName,
              Marca: detail.item.brand,
              Modelo: detail.item.model,
              Procesador: detail.item.processor,
              RAM: detail.item.ramCapacity,
              Almacenamiento: detail.item.storageCapacity,
              GPU: detail.item.gpu,
              Pantalla: detail.item.screenSize,
              'Precio base (PEN)': detail.item.basePrice,
              'Mínimo recomendado': detail.item.minStockThreshold,
              'Control de unidades': detail.item.isSerialized ? 'Por serie' : 'Por cantidad',
              Condición: detail.item.isSecondHand ? 'Usado' : 'Nuevo',
              Estado: detail.item.active ? 'Activo' : 'Inactivo',
            }).map(([label, value]) => (
              <div key={label}>
                <dt className="text-slate-500">{label}</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{value ?? '—'}</dd>
              </div>
            ))}
          </dl>

          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-900">
              {`Stock total disponible: ${detail.totalStockOverall}`}
            </p>
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
                    {['Ubicación', 'Tipo', 'Con serie', 'Cantidad', 'Disponible'].map((label) => (
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
                      <td className="px-3 py-2 text-slate-700">{stock.serializedCount}</td>
                      <td className="px-3 py-2 text-slate-700">{stock.quantityCount}</td>
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
