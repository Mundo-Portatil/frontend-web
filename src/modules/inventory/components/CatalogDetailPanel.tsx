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
    setDetail(null); setError(null);
    void getCatalogDetail(id, controller.signal).then((data) => { if (!controller.signal.aborted) setDetail(data); }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(asAppError(reason)); });
    return () => controller.abort();
  }, [id, revision]);
  return <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4" aria-label="Ficha de producto">
    <div className="flex justify-between gap-3"><h2 className="text-lg font-semibold">Ficha de producto</h2><button className={SECONDARY_BUTTON_CLASS} onClick={onClose}>Cerrar ficha</button></div>
    {error ? <ErrorState error={error} onRetry={() => setRevision((value) => value + 1)} /> : !detail ? <LoadingState message="Cargando ficha..." /> : <div className="mt-4 space-y-4">
      <h3 className="font-semibold">{detail.item.name}</h3><dl className="grid gap-2 text-sm sm:grid-cols-2">
        {Object.entries({ SKU: detail.item.sku, Categoría: detail.categoryName, Marca: detail.item.brand, Modelo: detail.item.model, Procesador: detail.item.processor, RAM: detail.item.ramCapacity, Almacenamiento: detail.item.storageCapacity, GPU: detail.item.gpu, Pantalla: detail.item.screenSize, 'Precio base (PEN)': detail.item.basePrice, 'Umbral mínimo': detail.item.minStockThreshold, Seguimiento: detail.item.isSerialized ? 'Serializado' : 'Por cantidad', Condición: detail.item.isSecondHand ? 'Usado' : 'Nuevo', Estado: detail.item.active ? 'Activo' : 'Inactivo' }).map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd>{value ?? '—'}</dd></div>)}
      </dl><p className="font-medium">Stock total disponible: {detail.totalStockOverall}</p>
      {!detail.stockSummary.length ? <p className="text-sm text-slate-500">Sin existencias por ubicación.</p> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><caption className="text-left font-semibold">Stock por ubicación</caption><thead><tr>{['Ubicación', 'Tipo', 'Serializados', 'Cantidad', 'Disponible'].map((label) => <th key={label} scope="col" className="p-2 text-left">{label}</th>)}</tr></thead><tbody>{detail.stockSummary.map((stock) => <tr key={stock.locationId}><td className="p-2">{stock.locationName}</td><td className="p-2">{stock.locationType}</td><td className="p-2">{stock.serializedCount}</td><td className="p-2">{stock.quantityCount}</td><td className="p-2">{stock.totalAvailable}</td></tr>)}</tbody></table></div>}
    </div>}
  </section>;
}
