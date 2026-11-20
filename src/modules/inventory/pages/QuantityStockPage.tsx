import { useEffect, useRef, useState, type FormEvent } from 'react';
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
import type { QuantityStock } from '../quantityModels';
import { useQuantityStock } from '../hooks/useQuantityStock';
import { CatalogProductPicker } from '../components/CatalogProductPicker';
import { QuantityStockForm } from '../components/QuantityStockForm';
import { InventoryBadge } from '../components/InventoryBadge';

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
  const [showMovement, setShowMovement] = useState(false);
  const [movementKey, setMovementKey] = useState(0);
  const movementTriggerRef = useRef<HTMLButtonElement>(null);
  const restoreMovementFocus = useRestoreFocus(showMovement, movementTriggerRef);

  function closeMovement() {
    setShowMovement(false);
    setMovementKey((value) => value + 1);
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

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilterError(null);
    if (
      catalogItemId.trim() &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        catalogItemId.trim(),
      )
    ) {
      setFilterError('Selecciona un producto válido para filtrar.');
      return;
    }
    if (!limit.trim() || !Number.isSafeInteger(Number(limit)) || Number(limit) < 1) {
      setFilterError('El tamaño de página debe ser un entero mayor que cero.');
      return;
    }
    setQuery({
      page: 1,
      limit: Number(limit),
      ...(locationId ? { locationId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(catalogItemId.trim() ? { catalogItemId: catalogItemId.trim() } : {}),
      ...(lowStock ? { lowStock: true } : {}),
    });
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Stock por cantidad</h2>
          <p className="mt-1 text-sm text-slate-500">
            Unidades disponibles por ubicación.
          </p>
        </div>
        <Can roles={['ADMIN']}>
          <button
            ref={movementTriggerRef}
            type="button"
            aria-expanded={showMovement}
            aria-controls="stock-movement-panel"
            onClick={() => {
              if (showMovement) {
                closeMovement();
              } else {
                setShowMovement(true);
              }
            }}
            className={showMovement ? SECONDARY_BUTTON_CLASS : PRIMARY_BUTTON_CLASS}
          >
            {showMovement ? 'Cerrar registro' : 'Registrar movimiento'}
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
          {!referenceLoading && !referenceError && (
            <QuantityStockForm
              key={movementKey}
              locations={locations}
              onSaved={(result) => {
                setSaved(result);
                closeMovement();
                reload();
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

      <form
        onSubmit={applyFilters}
        noValidate
        className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900">Filtros</h3>
          <button
            type="button"
            className={SECONDARY_BUTTON_CLASS}
            onClick={reload}
            disabled={loading}
          >
            Recargar
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="quantity-location-filter" className={LABEL_CLASS}>
              Filtrar por ubicación
            </label>
            <select
              id="quantity-location-filter"
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
              className={TEXT_INPUT_CLASS}
            >
              <option value="">Todas las ubicaciones</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                  {location.active ? '' : ' (inactiva)'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="quantity-category-filter" className={LABEL_CLASS}>
              Filtrar por categoría
            </label>
            <select
              id="quantity-category-filter"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className={TEXT_INPUT_CLASS}
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <CatalogProductPicker
            id="quantity-product-filter"
            serialized={false}
            label="Filtrar por producto"
            searchLabel="Buscar producto para filtrar"
            onChange={setCatalogItemId}
          />
          <div>
            <label htmlFor="quantity-limit" className={LABEL_CLASS}>
              Registros por página
            </label>
            <input
              id="quantity-limit"
              type="number"
              min="1"
              step="1"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              className={TEXT_INPUT_CLASS}
            />
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(event) => setLowStock(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Solo stock bajo
          </label>
          <div className="flex items-end">
            <button className={`${PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}>Aplicar filtros</button>
          </div>
          {filterError && (
            <div className="sm:col-span-2 lg:col-span-3">
              <Notification kind="error">{filterError}</Notification>
            </div>
          )}
        </div>
      </form>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <LoadingState message="Cargando stock…" />
      ) : (
        <>
          {!data.items.length ? (
            <EmptyState message="No hay existencias para estos filtros." />
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
                      'SKU',
                      'Ubicación',
                      'Cantidad',
                      'Umbral',
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
