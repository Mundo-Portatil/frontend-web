import { useEffect, useState, type FormEvent } from 'react';
import { Can } from '../../../components/guards/Can';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Notification } from '../../../components/notifications/Notification';
import { asAppError, type AppError } from '../../../services/api/errors';
import { LABEL_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import { formatDate } from '../../../utils/formatDate';
import { listLocations } from '../../foundation/locations/services/locationService';
import type { Location } from '../../foundation/locations/models';
import { listCategories } from '../services/categoryService';
import type { Category } from '../models';
import type { QuantityStock } from '../quantityModels';
import { useQuantityStock } from '../hooks/useQuantityStock';
import { QuantityStockForm } from '../components/QuantityStockForm';

export function QuantityStockPage() {
  const { query, setQuery, data, loading, error, reload } = useQuantityStock();
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [referenceError, setReferenceError] = useState<AppError | null>(null);
  const [referenceRevision, setReferenceRevision] = useState(0);
  const [referenceLoading, setReferenceLoading] = useState(true);
  const [locationId, setLocationId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [catalogItemId, setCatalogItemId] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [limit, setLimit] = useState('50');
  const [filterError, setFilterError] = useState<string | null>(null);
  const [saved, setSaved] = useState<QuantityStock | null>(null);
  useEffect(() => {
    let ignore = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReferenceLoading(true);
    setReferenceError(null);
    void Promise.all([listLocations(), listCategories()]).then(([places, groups]) => {
      if (!ignore) { setLocations(places); setCategories(groups); }
    }).catch((failure: unknown) => { if (!ignore) setReferenceError(asAppError(failure)); })
      .finally(() => { if (!ignore) setReferenceLoading(false); });
    return () => { ignore = true; };
  }, [referenceRevision]);
  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilterError(null);
    if (catalogItemId.trim() && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(catalogItemId.trim())) { setFilterError('Introduce un ID de producto válido (UUID v4).'); return; }
    if (!limit.trim() || !Number.isSafeInteger(Number(limit)) || Number(limit) < 1) { setFilterError('El tamaño de página debe ser un entero mayor que cero.'); return; }
    setQuery({ page: 1, limit: Number(limit), ...(locationId ? { locationId } : {}), ...(categoryId ? { categoryId } : {}), ...(catalogItemId.trim() ? { catalogItemId: catalogItemId.trim() } : {}), ...(lowStock ? { lowStock: true } : {}) });
  }
  return <section className="mx-auto w-full max-w-6xl space-y-6">
    <header><h1 className="text-2xl font-semibold text-slate-900">Stock por cantidad</h1><p className="mt-2 text-sm text-slate-500">Consulta existencias de productos no serializados por ubicación.</p></header>
    {referenceError && <ErrorState error={referenceError} onRetry={() => setReferenceRevision((value) => value + 1)} />}
    {referenceLoading && <LoadingState message="Cargando ubicaciones y categorías…" />}
    {!referenceLoading && !referenceError && <Can roles={['ADMIN']}><QuantityStockForm locations={locations} onSaved={(result) => { setSaved(result); reload(); }} /></Can>}
    {saved && <Notification kind="success">Operación registrada. Saldo confirmado: {saved.quantity} unidades de {saved.catalogName ?? saved.catalogId} en {saved.locationName ?? saved.locationId}.</Notification>}
    <form onSubmit={applyFilters} noValidate className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
      <div><label htmlFor="quantity-location-filter" className={LABEL_CLASS}>Filtrar por ubicación</label><select id="quantity-location-filter" value={locationId} onChange={(event) => setLocationId(event.target.value)} className={TEXT_INPUT_CLASS}><option value="">Todas las ubicaciones</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}{location.active ? '' : ' (inactiva)'}</option>)}</select></div>
      <div><label htmlFor="quantity-category-filter" className={LABEL_CLASS}>Filtrar por categoría</label><select id="quantity-category-filter" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={TEXT_INPUT_CLASS}><option value="">Todas las categorías</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
      <div><label htmlFor="quantity-product-filter" className={LABEL_CLASS}>Filtrar por ID de producto</label><input id="quantity-product-filter" value={catalogItemId} onChange={(event) => setCatalogItemId(event.target.value)} className={TEXT_INPUT_CLASS} /></div>
      <div><label htmlFor="quantity-limit" className={LABEL_CLASS}>Registros por página</label><input id="quantity-limit" type="number" min="1" step="1" value={limit} onChange={(event) => setLimit(event.target.value)} className={TEXT_INPUT_CLASS} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lowStock} onChange={(event) => setLowStock(event.target.checked)} />Solo stock bajo</label>
      <div className="flex items-end gap-2"><button className={PRIMARY_BUTTON_CLASS}>Aplicar filtros</button><button type="button" className={SECONDARY_BUTTON_CLASS} onClick={reload} disabled={loading}>Recargar</button></div>
      {filterError && <div className="sm:col-span-2"><Notification kind="error">{filterError}</Notification></div>}
    </form>
    {error ? <ErrorState error={error} onRetry={reload} /> : loading ? <LoadingState message="Cargando stock…" /> : <>
      {!data.items.length ? <EmptyState message="No hay existencias para estos filtros." /> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white" role="region" aria-label="Listado de stock" tabIndex={0}>
        <table className="min-w-full text-sm"><thead><tr className="border-b text-left text-slate-600">{['Producto', 'SKU', 'Ubicación', 'Cantidad', 'Umbral', 'Stock bajo', 'Costo', 'Precio', 'Actualizado'].map((title) => <th key={title} scope="col" className="p-3">{title}</th>)}</tr></thead><tbody>{data.items.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="p-3">{item.catalogName ?? item.catalogId}</td><td className="p-3">{item.catalogSku ?? '—'}</td><td className="p-3">{item.locationName ?? item.locationId}</td><td className="p-3">{item.quantity}</td><td className="p-3">{item.minStockThreshold ?? '—'}</td><td className="p-3">{item.isLowStock === undefined ? '—' : item.isLowStock ? 'Sí' : 'No'}</td><td className="p-3">{item.costPrice ?? '—'}</td><td className="p-3">{item.salePrice ?? '—'}</td><td className="p-3">{formatDate(item.updatedAt)}</td></tr>)}</tbody></table>
      </div>}
      <nav aria-label="Paginación de stock" className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600">Página {data.page} · {data.total} registros</p><div className="flex gap-2"><button className={SECONDARY_BUTTON_CLASS} disabled={data.page <= 1} onClick={() => setQuery({ ...query, page: data.page - 1 })}>Anterior</button><button className={SECONDARY_BUTTON_CLASS} disabled={data.page * data.limit >= data.total} onClick={() => setQuery({ ...query, page: data.page + 1 })}>Siguiente</button></div></nav>
    </>}
  </section>;
}
