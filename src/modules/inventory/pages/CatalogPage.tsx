import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../router/routes';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import { useRestoreFocus } from '../../../hooks/useRestoreFocus';
import { Can } from '../../../components/guards/Can';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Notification } from '../../../components/notifications/Notification';
import {
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
} from '../../../utils/formStyles';
import { useCategories } from '../hooks/useCategories';
import { useCatalog } from '../hooks/useCatalog';
import { getAvailabilityDisplay, useCatalogAvailability } from '../hooks/useCatalogAvailability';
import { useLocationStore } from '../../../stores/locationStore';
import { CatalogAvailabilityCell } from '../components/CatalogAvailabilityCell';
import { CatalogForm } from '../components/CatalogForm';
import { CatalogDetailPanel } from '../components/CatalogDetailPanel';
import { InventoryBadge } from '../components/InventoryBadge';
import type { CatalogItem } from '../catalogModels';

const COLUMNS = [
  'Producto',
  'Categoría',
  'Control de unidades',
  'Precio base (PEN)',
  'Cantidad disponible',
  'Estado',
  'Acciones',
] as const;

const UNIT_STATUS = { EN_STOCK: 'En stock', VENDIDO: 'Vendido', SEGUNDA_MANO_PENDIENTE: 'Segunda mano pendiente', EN_GARANTIA: 'En garantía', DE_BAJA: 'De baja' } as const;

interface CatalogPageProps { mode?: 'manage' | 'consult'; searchUnits?: boolean }

export function CatalogPage({ mode = 'manage', searchUnits = false }: CatalogPageProps) {
  const managing = mode === 'manage';
  const [searchInput, setSearchInput] = useState('');
  const categories = useCategories();
  const { query, setQuery, result, loading, error, reload, cancelPending, applySearch: commitSearch, unit, detail, unitError } = useCatalog(searchUnits);
  const pendingTerm = searchInput.trim() !== (query.search ?? '');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showUnit, setShowUnit] = useState(false);
  function applySearch(value: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    commitSearch(value);
  }
  useEffect(() => {
    searchTimer.current = setTimeout(() => {
      commitSearch(searchInput);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchInput, commitSearch]);
  useBarcodeScanner((value) => { cancelPending(); setSearchInput(value); setShowUnit(false); applySearch(value); }, searchUnits);
  const activeLocation = useLocationStore((state) => state.activeLocation);
  const availability = useCatalogAvailability(result.items, !loading && !error && !pendingTerm, detail);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [editingItem, setEditingItem] = useState<CatalogItem | undefined>();
  const [formBusy, setFormBusy] = useState(false);
  const formPending = useRef(false);
  const [detailRevision, setDetailRevision] = useState(0);
  const createTriggerRef = useRef<HTMLButtonElement>(null);
  const restoreCreateFocus = useRestoreFocus(showCreate, createTriggerRef);
  const availabilityPending =
    !loading && !error && result.items.some((item) => availability.entries[item.id] === undefined);
  const availabilityError = result.items.some(
    (item) => availability.entries[item.id]?.status === 'error',
  );

  function closeCreate() {
    setShowCreate(false);
    setEditingItem(undefined);
    setCreateKey((value) => value + 1);
    restoreCreateFocus();
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{managing ? 'Productos y modelos' : 'Buscar mercancía'}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {managing ? 'Modelos, características y precios.' : 'Busca por marca, modelo, código o número de serie.'}
          </p>
        </div>
        {managing && <Can roles={['ADMIN', 'ENCARGADO_ALMACEN']}><Link to={ROUTES.inventoryInbound} className={PRIMARY_BUTTON_CLASS}>Ingresar mercancía</Link></Can>}
      </header>

      {categories.error && <ErrorState error={categories.error} onRetry={categories.reload} />}
      {categories.loading && <LoadingState message="Cargando categorías..." />}

      {managing && <Can roles={['ADMIN', 'ENCARGADO_ALMACEN']}>
        <div
          id="catalog-create-panel"
          hidden={!showCreate || categories.loading || Boolean(categories.error)}
        >
          {showCreate && editingItem && !categories.loading && !categories.error && (
            <CatalogForm
              key={`${editingItem?.id ?? 'new'}-${createKey}`}
              categories={categories.items}
              initialItem={editingItem}
              onCancel={closeCreate}
              onBusyChange={(value) => { formPending.current = value; setFormBusy(value); }}
              onSaved={() => {
                setMessage('Producto actualizado correctamente.');
                closeCreate();
                setDetailRevision((value) => value + 1);
                reload();
              }}
            />
          )}
        </div>
      </Can>}

      {unitError && !pendingTerm && !loading && <Notification kind="warning">{unitError}</Notification>}
      {message && <Notification kind="success">{message}</Notification>}

      {selectedId && (
        <CatalogDetailPanel key={`${selectedId}-${detailRevision}`} id={selectedId} onClose={() => setSelectedId(null)} />
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-slate-900">Productos</h3>
            <p className="mt-1 text-sm text-slate-600">{activeLocation ? `Cantidades en ${activeLocation.name}` : 'Cantidad total en ubicaciones activas'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {availabilityPending && (
              <span className="text-xs text-slate-500" role="status">
                Actualizando cantidades…
              </span>
            )}
            {availabilityError && (
              <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={availability.retry}>
                Reintentar cantidades
              </button>
            )}
            <button className={SECONDARY_BUTTON_CLASS} disabled={loading} onClick={reload}>
              Recargar catálogo
            </button>
          </div>
        </div>

        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <form onSubmit={(event) => {
              event.preventDefault();
              applySearch(searchInput);
            }}>
            <label htmlFor="catalog-search" className={LABEL_CLASS}>
              {searchUnits ? 'Marca, modelo, código o serie' : 'Buscar producto'}
            </label>
            <div className="flex min-w-0 gap-2">
            <input
              id="catalog-search"
              type="search"
              value={searchInput}
              onChange={(event) => {
                const value = event.target.value;
                if (value.trim() !== (query.search ?? '')) cancelPending();
                setSearchInput(value);
                setShowUnit(false);
                if (!value.trim()) applySearch('');
              }}
              className={`${TEXT_INPUT_CLASS} min-w-0 flex-1`}
              placeholder={searchUnits ? 'Marca, modelo, código o serie…' : 'Marca, modelo o código…'}
            />
            </div>
            </form>
          </div>
          <div>
            <label htmlFor="catalog-filter-category" className={LABEL_CLASS}>
              Categoría
            </label>
            <select
              id="catalog-filter-category"
              value={query.categoryId ?? ''}
              onChange={(event) =>
                setQuery({ ...query, categoryId: event.target.value || undefined, page: 1 })
              }
              className={TEXT_INPUT_CLASS}
            >
              <option value="">Todas</option>
              {categories.items.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="catalog-status" className={LABEL_CLASS}>
              Estado del producto
            </label>
            <select
              id="catalog-status"
              value={query.active === undefined ? 'all' : String(query.active)}
              onChange={(event) =>
                setQuery({
                  ...query,
                  active: event.target.value === 'all' ? undefined : event.target.value === 'true',
                  page: 1,
                })
              }
              className={TEXT_INPUT_CLASS}
            >
              <option value="all">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
          <div>
            <label htmlFor="catalog-limit" className={LABEL_CLASS}>
              Productos por página
            </label>
            <select
              id="catalog-limit"
              value={query.limit}
              onChange={(event) =>
                setQuery({ ...query, limit: Number(event.target.value), page: 1 })
              }
              className={TEXT_INPUT_CLASS}
            >
              {[10, 20, 50].map((limit) => (
                <option key={limit} value={limit}>
                  {limit}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && !pendingTerm ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading || pendingTerm ? (
          <LoadingState message="Cargando catálogo..." />
        ) : (
          <>
            {!result.items.length ? (
              <EmptyState message={managing ? 'No hay productos disponibles.' : 'No hay modelos o series que coincidan con esta búsqueda.'} />
            ) : (
              <div
                role="region"
                aria-label="Listado del catálogo"
                tabIndex={0}
                className="overflow-x-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <table className="min-w-[56rem] divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {COLUMNS.map((label) => (
                        <th key={label} scope="col" className="px-3 py-2 text-left font-medium text-slate-600">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {result.items.map((item) => (
                      <tr key={item.id} className={unit?.catalogId === item.id ? 'bg-brand-50/40' : undefined}>
                        <td className="px-3 py-2 text-slate-900"><span className="block font-medium">{item.name}</span><span className="block text-xs text-slate-500">{item.brand} · {item.model}</span>
                          {unit?.catalogId === item.id && <div className="mt-2 space-y-1 text-xs"><p className="break-all font-semibold text-brand-800">Serie encontrada: {unit.serialNumber}</p><p>{unit.locationName ?? 'Ubicación no disponible'} · {UNIT_STATUS[unit.status]}</p>
                            <button type="button" className="rounded text-brand-800 underline focus-visible:ring-2" aria-expanded={showUnit} aria-controls={`catalog-unit-${unit.id}`} onClick={() => setShowUnit((value) => !value)}>{showUnit ? 'Ocultar unidad' : 'Ver unidad'}</button>
                            {showUnit && <dl id={`catalog-unit-${unit.id}`} className="space-y-1"><div><dt className="inline font-medium">Equipo asociado: </dt><dd className="inline">{unit.parentChassis?.serialNumber ?? (unit.parentChassisId ? 'Equipo asociado' : 'Sin equipo asociado')}</dd></div><div><dt className="font-medium">Componentes</dt><dd>{unit.components?.length ? unit.components.map((child) => child.serialNumber).join(', ') : 'Sin componentes asociados'}</dd></div></dl>}
                          </div>}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {categories.items.find((category) => category.id === item.categoryId)
                            ?.name ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {item.isSerialized ? 'Por serie' : 'Por cantidad'}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{item.basePrice}</td>
                        <td className="px-3 py-2">
                          <CatalogAvailabilityCell
                            itemName={item.name}
                            display={getAvailabilityDisplay(
                              availability.entries[item.id],
                              activeLocation?.id,
                            )}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <InventoryBadge tone={item.active ? 'success' : 'neutral'}>
                            {item.active ? 'Activo' : 'Inactivo'}
                          </InventoryBadge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="inline-flex flex-nowrap items-center gap-2 whitespace-nowrap">
                            <button
                              type="button"
                              className={SECONDARY_BUTTON_CLASS}
                              aria-label={`Ver ficha de ${item.name}`}
                              onClick={() => setSelectedId(item.id)}
                            >
                              Ver ficha
                            </button>
                            {managing && <Can roles={['ADMIN', 'ENCARGADO_ALMACEN']}>
                              <button
                                type="button"
                                className={SECONDARY_BUTTON_CLASS}
                                disabled={formBusy}
                                aria-label={`Editar ${item.name}`}
                                onClick={(event) => {
                                  if (formPending.current) return;
                                  createTriggerRef.current = event.currentTarget;
                                  setEditingItem(item);
                                  setShowCreate(true);
                                  setMessage(null);
                                }}
                              >
                                Editar
                              </button>
                            </Can>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                Página {result.page} · {result.total} productos
              </p>
              <div className="flex gap-2">
                <button
                  className={SECONDARY_BUTTON_CLASS}
                  disabled={result.page <= 1}
                  onClick={() => setQuery({ ...query, page: result.page - 1 })}
                >
                  Anterior
                </button>
                <button
                  className={SECONDARY_BUTTON_CLASS}
                  disabled={result.page * result.limit >= result.total}
                  onClick={() => setQuery({ ...query, page: result.page + 1 })}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </section>
  );
}
