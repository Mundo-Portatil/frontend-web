import { useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../router/routes';
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

interface CatalogPageProps {
  mode?: 'manage' | 'consult';
  onSearchCode?: (value: string) => void;
  onSearchChange?: () => void;
  lookupResult?: ReactNode;
  hasExactMatch?: boolean;
}

export function CatalogPage({ mode = 'manage', onSearchCode, onSearchChange, lookupResult, hasExactMatch = false }: CatalogPageProps) {
  const managing = mode === 'manage';
  const [consultSearch, setConsultSearch] = useState('');
  const categories = useCategories();
  const { query, setQuery, result, loading, error, reload } = useCatalog();
  const activeLocation = useLocationStore((state) => state.activeLocation);
  const availability = useCatalogAvailability(result.items, !loading && !error);
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

      {lookupResult}
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
              if (managing) return;
              const search = consultSearch.trim();
              setQuery({ ...query, search: search || undefined, page: 1 });
              if (search) onSearchCode?.(search);
              else onSearchChange?.();
            }}>
            <label htmlFor="catalog-search" className={LABEL_CLASS}>
              {managing ? 'Buscar producto' : 'Marca, modelo, código o serie'}
            </label>
            <div className="flex min-w-0 gap-2">
            <input
              id="catalog-search"
              type="search"
              value={managing ? query.search ?? '' : consultSearch}
              onChange={(event) => {
                onSearchChange?.();
                if (managing) setQuery({ ...query, search: event.target.value || undefined, page: 1 });
                else setConsultSearch(event.target.value);
              }}
              className={TEXT_INPUT_CLASS}
              placeholder={managing ? 'Marca, modelo o código…' : 'Marca, modelo, código o serie…'}
            />
            {!managing && <button type="submit" className={`${SECONDARY_BUTTON_CLASS} shrink-0`}>Buscar</button>}
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

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <LoadingState message="Cargando catálogo..." />
        ) : (
          <>
            {!result.items.length ? (
              hasExactMatch ? null : <EmptyState message={managing ? 'No hay productos disponibles.' : 'No hay modelos que coincidan con esta búsqueda. Prueba también una serie o código y pulsa Buscar.'} />
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
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-slate-900"><span className="block font-medium">{item.name}</span><span className="block text-xs text-slate-500">{item.brand} · {item.model}</span></td>
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
