import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRestoreFocus } from '../../../hooks/useRestoreFocus';
import { Can } from '../../../components/guards/Can';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Notification } from '../../../components/notifications/Notification';
import { asAppError, type AppError } from '../../../services/api/errors';
import {
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
} from '../../../utils/formStyles';
import { formatDate } from '../../../utils/formatDate';
import { listLocations } from '../../foundation/locations/services/locationService';
import type { Location } from '../../foundation/locations/models';
import { listCategories } from '../services/categoryService';
import type { Category } from '../models';
import type { QuantityStockQuery, QuantityStock } from '../quantityModels';
import { useQuantityStock } from '../hooks/useQuantityStock';
import { CatalogProductPicker } from '../components/CatalogProductPicker';
import { QuantityStockForm } from '../components/QuantityStockForm';
import { InventoryBadge } from '../components/InventoryBadge';

export function QuantityStockPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { query, setQuery, data, loading, error, reload } = useQuantityStock();
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [referenceError, setReferenceError] = useState<AppError | null>(null);
  const [referenceRevision, setReferenceRevision] = useState(0);
  const [referenceLoading, setReferenceLoading] = useState(true);
  const [limit, setLimit] = useState('50');
  const [filterError, setFilterError] = useState<string | null>(null);
  const [filterKey, setFilterKey] = useState(0);
  const [saved, setSaved] = useState<QuantityStock | null>(null);
  const showMovement = searchParams.get('operation') === 'inbound';
  const [movementBusy, setMovementBusy] = useState(false);
  const movementPending = useRef(false);
  const movementTriggerRef = useRef<HTMLButtonElement>(null);
  const restoreMovementFocus = useRestoreFocus(showMovement, movementTriggerRef);

  function closeMovement() {
    if (searchParams.has('operation')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('operation');
      setSearchParams(nextParams, { replace: true });
    }
    restoreMovementFocus();
  }

  useEffect(() => {
    let ignore = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReferenceLoading(true);
    setReferenceError(null);
    void Promise.all([listLocations(), listCategories()])
      .then(([places, groups]) => {
        if (!ignore) {
          setLocations(places);
          setCategories(groups);
        }
      })
      .catch((failure: unknown) => {
        if (!ignore) setReferenceError(asAppError(failure));
      })
      .finally(() => {
        if (!ignore) setReferenceLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [referenceRevision]);

  function updateFilters(updates: Partial<QuantityStockQuery>) {
    setQuery((current) => ({ ...current, ...updates, page: 1 }));
  }

  function clearFilters() {
    setLimit('50');
    setFilterError(null);
    setFilterKey((value) => value + 1);
    setQuery({ page: 1, limit: 50 });
  }

  const secondaryFilterCount = Number(Boolean(query.categoryId)) + Number(Boolean(query.lowStock)) + Number(query.limit !== 50);
  const hasFilters = Boolean(query.locationId || query.categoryId || query.catalogItemId || query.lowStock || query.limit !== 50);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Stock por cantidad</h2>
          <p className="mt-1 text-sm text-slate-500">
            Cantidades registradas por ubicación.
          </p>
        </div>
        <Can roles={['ADMIN']}>
          <button
            ref={movementTriggerRef}
            type="button"
            disabled={movementBusy}
            aria-expanded={showMovement}
            aria-controls="stock-movement-panel"
            onClick={() => {
              if (movementPending.current) return;
              if (showMovement) {
                closeMovement();
              } else {
                const nextParams = new URLSearchParams(searchParams);
                nextParams.set('operation', 'inbound');
                setSearchParams(nextParams);
              }
            }}
            className={showMovement ? SECONDARY_BUTTON_CLASS : PRIMARY_BUTTON_CLASS}
          >
            {showMovement ? 'Cerrar registro' : 'Agregar o corregir cantidades'}
          </button>
        </Can>
      </header>

      {referenceError && (
        <ErrorState
          error={referenceError}
          onRetry={() => setReferenceRevision((value) => value + 1)}
        />
      )}
      {referenceLoading && <LoadingState message="Cargando ubicaciones y categorías…" />}

      <Can roles={['ADMIN']}>
        <div
          id="stock-movement-panel"
          hidden={!showMovement || referenceLoading || Boolean(referenceError)}
        >
          {showMovement && !referenceLoading && !referenceError && (
            <QuantityStockForm
              locations={locations}
              onBusyChange={(value) => {
                movementPending.current = value;
                setMovementBusy(value);
              }}
              onSaved={(result) => {
                setSaved(result);
                closeMovement();
                setQuery((current) => ({ ...current, page: 1 }));
              }}
            />
          )}
        </div>
      </Can>

      {saved && (
        <Notification kind="success">
          Operación registrada. Saldo confirmado: {saved.quantity} unidades de{' '}
          {saved.catalogName ?? 'producto seleccionado'} en {saved.locationName ?? 'ubicación seleccionada'}.
        </Notification>
      )}

      <section aria-label="Filtros de cantidades" className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900">Buscar cantidades disponibles</h3>
          <div className="flex flex-wrap gap-2">
            {hasFilters && <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={clearFilters}>Limpiar filtros</button>}
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={reload} disabled={loading}>Actualizar</button>
          </div>
        </div>
        <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <CatalogProductPicker
            key={filterKey}
            id="quantity-product-filter"
            serialized={false}
            activeOnly={false}
            label="Filtrar por producto"
            onChange={(catalogItemId) => updateFilters({ catalogItemId: catalogItemId || undefined })}
          />
          <div className="min-w-0">
            <label htmlFor="quantity-location-filter" className={LABEL_CLASS}>Filtrar por ubicación</label>
            <select id="quantity-location-filter" value={query.locationId ?? ''} onChange={(event) => updateFilters({ locationId: event.target.value || undefined })} className={TEXT_INPUT_CLASS}>
              <option value="">Todas las ubicaciones</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}{location.active ? '' : ' (inactiva)'}</option>)}
            </select>
          </div>
        </div>
        <details className="mt-3 border-t border-slate-100 pt-3">
          <summary className="w-fit cursor-pointer rounded text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            Más filtros{secondaryFilterCount ? ` (${secondaryFilterCount})` : ''}
          </summary>
          <div className="mt-3 grid min-w-0 items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="min-w-0">
              <label htmlFor="quantity-category-filter" className={LABEL_CLASS}>Filtrar por categoría</label>
              <select id="quantity-category-filter" value={query.categoryId ?? ''} onChange={(event) => updateFilters({ categoryId: event.target.value || undefined })} className={TEXT_INPUT_CLASS}>
                <option value="">Todas las categorías</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
            <div className="min-w-0">
              <label htmlFor="quantity-limit" className={LABEL_CLASS}>Registros por página</label>
              <input id="quantity-limit" type="number" min="1" step="1" value={limit} className={TEXT_INPUT_CLASS} onChange={(event) => {
                const next = event.target.value;
                setLimit(next);
                if (!next.trim() || !Number.isSafeInteger(Number(next)) || Number(next) < 1) {
                  setFilterError('Indica un número entero mayor que cero.');
                  return;
                }
                setFilterError(null);
                updateFilters({ limit: Number(next) });
              }} />
            </div>
            <label className="flex min-h-10 items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={query.lowStock ?? false} onChange={(event) => updateFilters({ lowStock: event.target.checked || undefined })} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              Solo stock bajo
            </label>
          </div>
          {filterError && <div className="mt-3"><Notification kind="error">{filterError}</Notification></div>}
        </details>
      </section>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <LoadingState message="Cargando stock…" />
      ) : (
        <>
          {!data.items.length ? (
            <div className="space-y-2">
              <EmptyState message="No hay existencias para estos filtros." />
              <p className="text-sm text-slate-600">{hasFilters ? 'Prueba otra ubicación o limpia los filtros.' : 'Los productos del catálogo aparecen aquí después de registrar cantidades.'}</p>
            </div>
          ) : (
            <div
              className="overflow-x-auto rounded-xl border border-slate-200 bg-white"
              role="region"
              aria-label="Listado de stock"
              tabIndex={0}
            >
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600">
                    {[
                      'Producto',
                      'Código de producto',
                      'Ubicación',
                      'Cantidad',
                      'Mínimo recomendado',
                      'Stock bajo',
                      'Costo',
                      'Precio',
                      'Actualizado',
                    ].map((title) => (
                      <th key={title} scope="col" className="px-3 py-2 font-medium">
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {data.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-slate-900">
                        {item.catalogName ?? 'Producto sin nombre'}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{item.catalogSku ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {item.locationName ?? 'Ubicación no disponible'}
                      </td>
                      <td className="px-3 py-2 text-slate-900">{item.quantity}</td>
                      <td className="px-3 py-2 text-slate-700">{item.minStockThreshold ?? '—'}</td>
                      <td className="px-3 py-2">
                        {item.isLowStock === undefined ? (
                          '—'
                        ) : (
                          <InventoryBadge tone={item.isLowStock ? 'warning' : 'success'}>
                            {item.isLowStock ? 'Sí' : 'No'}
                          </InventoryBadge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{item.costPrice ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-700">{item.salePrice ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-700">{formatDate(item.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <nav
            aria-label="Paginación de stock"
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <p className="text-sm text-slate-600">
              Página {data.page} · {data.total} registros
            </p>
            <div className="flex gap-2">
              <button
                className={SECONDARY_BUTTON_CLASS}
                disabled={data.page <= 1}
                onClick={() => setQuery({ ...query, page: data.page - 1 })}
              >
                Anterior
              </button>
              <button
                className={SECONDARY_BUTTON_CLASS}
                disabled={data.page * data.limit >= data.total}
                onClick={() => setQuery({ ...query, page: data.page + 1 })}
              >
                Siguiente
              </button>
            </div>
          </nav>
        </>
      )}
    </section>
  );
}
