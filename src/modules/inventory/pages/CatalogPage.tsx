import { useState } from 'react';
import { Can } from '../../../components/guards/Can';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Notification } from '../../../components/notifications/Notification';
import { LABEL_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import { useCategories } from '../hooks/useCategories';
import { useCatalog } from '../hooks/useCatalog';
import { CatalogForm } from '../components/CatalogForm';
import { CatalogDetailPanel } from '../components/CatalogDetailPanel';
export function CatalogPage() {
  const categories = useCategories();
  const { query, setQuery, result, loading, error, reload } = useCatalog();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  return <section className="mx-auto w-full max-w-6xl">
    <header className="mb-6"><h1 className="text-2xl font-semibold text-slate-900">Catálogo maestro</h1><p className="mt-2 text-sm text-slate-500">Consulta productos y existencias por ubicación.</p></header>
    {categories.error ? <ErrorState error={categories.error} onRetry={categories.reload} /> : categories.loading ? <LoadingState message="Cargando categorías..." /> : <Can roles={['ADMIN']}><CatalogForm categories={categories.items} onSaved={() => { setMessage('Producto creado correctamente.'); reload(); }} /></Can>}
    {message && <div className="mb-4"><Notification kind="success">{message}</Notification></div>}
    {selectedId && <CatalogDetailPanel key={selectedId} id={selectedId} onClose={() => setSelectedId(null)} />}
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><label htmlFor="catalog-search" className={LABEL_CLASS}>Buscar producto</label><input id="catalog-search" type="search" value={query.search ?? ''} onChange={(event) => setQuery({ ...query, search: event.target.value || undefined, page: 1 })} className={TEXT_INPUT_CLASS} placeholder="SKU, nombre, marca o modelo" /></div>
        <div><label htmlFor="catalog-filter-category" className={LABEL_CLASS}>Categoría del catálogo</label><select id="catalog-filter-category" value={query.categoryId ?? ''} onChange={(event) => setQuery({ ...query, categoryId: event.target.value || undefined, page: 1 })} className={TEXT_INPUT_CLASS}><option value="">Todas</option>{categories.items.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
        <div><label htmlFor="catalog-status" className={LABEL_CLASS}>Estado del producto</label><select id="catalog-status" value={query.active === undefined ? 'all' : String(query.active)} onChange={(event) => setQuery({ ...query, active: event.target.value === 'all' ? undefined : event.target.value === 'true', page: 1 })} className={TEXT_INPUT_CLASS}><option value="all">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select></div>
        <div><label htmlFor="catalog-limit" className={LABEL_CLASS}>Productos por página</label><select id="catalog-limit" value={query.limit} onChange={(event) => setQuery({ ...query, limit: Number(event.target.value), page: 1 })} className={TEXT_INPUT_CLASS}>{[10, 20, 50].map((limit) => <option key={limit} value={limit}>{limit}</option>)}</select></div>
      </div>
      <button className={`${SECONDARY_BUTTON_CLASS} mb-4`} disabled={loading} onClick={reload}>Recargar catálogo</button>
      {error ? <ErrorState error={error} onRetry={reload} /> : loading ? <LoadingState message="Cargando catálogo..." /> : <>
        {!result.items.length ? <EmptyState message="No hay productos disponibles." /> : <div role="region" aria-label="Listado del catálogo" tabIndex={0} className="overflow-x-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"><table className="min-w-full text-sm"><thead><tr>{['SKU', 'Producto', 'Categoría', 'Seguimiento', 'Precio base (PEN)', 'Estado', 'Acciones'].map((label) => <th key={label} scope="col" className="p-2 text-left">{label}</th>)}</tr></thead><tbody>{result.items.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="p-2">{item.sku}</td><td className="p-2">{item.name}</td><td className="p-2">{categories.items.find((category) => category.id === item.categoryId)?.name ?? item.categoryId}</td><td className="p-2">{item.isSerialized ? 'Serializado' : 'Por cantidad'}</td><td className="p-2">{item.basePrice}</td><td className="p-2">{item.active ? 'Activo' : 'Inactivo'}</td><td className="p-2"><button className={SECONDARY_BUTTON_CLASS} onClick={() => setSelectedId(item.id)}>Ver ficha</button></td></tr>)}</tbody></table></div>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600">Página {result.page} · {result.total} productos</p><div className="flex gap-2"><button className={SECONDARY_BUTTON_CLASS} disabled={result.page <= 1} onClick={() => setQuery({ ...query, page: result.page - 1 })}>Anterior</button><button className={SECONDARY_BUTTON_CLASS} disabled={result.page * result.limit >= result.total} onClick={() => setQuery({ ...query, page: result.page + 1 })}>Siguiente</button></div></div>
      </>}
    </section>
  </section>;
}
