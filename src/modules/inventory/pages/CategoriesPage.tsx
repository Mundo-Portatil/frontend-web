import { useRef, useState } from 'react';
import { useRestoreFocus } from '../../../hooks/useRestoreFocus';
import { Can } from '../../../components/guards/Can';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { Notification } from '../../../components/notifications/Notification';
import {
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
} from '../../../utils/formStyles';
import { formatDate } from '../../../utils/formatDate';
import { CategoryForm } from '../components/CategoryForm';
import { InventoryBadge } from '../components/InventoryBadge';
import { useCategories, type CategoryFilter } from '../hooks/useCategories';
import type { Category } from '../models';

export function CategoriesPage() {
  const { filter, setFilter, items, loading, error, reload } = useCategories();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const formTriggerRef = useRef<HTMLButtonElement>(null);
  const restoreFormFocus = useRestoreFocus(showForm, formTriggerRef);

  function saved() {
    setMessage(editing ? 'Categoría actualizada correctamente.' : 'Categoría creada correctamente.');
    closeForm();
    reload();
  }

  function startCreate() {
    setEditing(null);
    setShowForm(true);
    setMessage(null);
  }

  function startEdit(category: Category) {
    setEditing(category);
    setShowForm(true);
    setMessage(null);
  }

  function closeForm() {
    setEditing(null);
    setShowForm(false);
    setCreateKey((value) => value + 1);
    restoreFormFocus();
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Categorías</h2>
          <p className="mt-1 text-sm text-slate-500">
            Agrupa los productos por tipo.
          </p>
        </div>
        <Can roles={['ADMIN']}>
          <button
            ref={formTriggerRef}
            type="button"
            aria-expanded={showForm}
            aria-controls="category-form-panel"
            onClick={showForm ? closeForm : startCreate}
            className={showForm ? SECONDARY_BUTTON_CLASS : PRIMARY_BUTTON_CLASS}
          >
            {showForm ? 'Cerrar formulario' : 'Registrar categoría'}
          </button>
        </Can>
      </header>

      <Can roles={['ADMIN']}>
        <div id="category-form-panel" hidden={!showForm}>
          <CategoryForm
            key={editing?.id ?? `new-${createKey}`}
            category={editing}
            onSaved={saved}
            onBusyChange={setSaving}
            onCancel={closeForm}
          />
        </div>
      </Can>

      {message && <Notification kind="success">{message}</Notification>}

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <label htmlFor="category-filter" className={LABEL_CLASS}>
              Estado de categorías
            </label>
            <select
              id="category-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value as CategoryFilter)}
              className={TEXT_INPUT_CLASS}
            >
              <option value="all">Todas</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
          <button className={SECONDARY_BUTTON_CLASS} onClick={reload} disabled={loading}>
            Recargar
          </button>
        </div>

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <LoadingState message="Cargando categorías..." />
        ) : !items.length ? (
          <EmptyState message="No hay categorías disponibles." />
        ) : (
          <div
            role="region"
            aria-label="Listado de categorías"
            tabIndex={0}
            className="overflow-x-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th scope="col" className="px-3 py-2 font-medium">Nombre</th>
                  <th scope="col" className="px-3 py-2 font-medium">Descripción</th>
                  <th scope="col" className="px-3 py-2 font-medium">Estado</th>
                  <th scope="col" className="px-3 py-2 font-medium">Productos</th>
                  <th scope="col" className="px-3 py-2 font-medium">Creada</th>
                  <Can roles={['ADMIN']}>
                    <th scope="col" className="px-3 py-2 font-medium">Acciones</th>
                  </Can>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((category) => (
                  <tr key={category.id}>
                    <td className="px-3 py-2 text-slate-900">{category.name}</td>
                    <td className="px-3 py-2 text-slate-700">{category.description ?? '—'}</td>
                    <td className="px-3 py-2">
                      <InventoryBadge tone={category.active ? 'success' : 'neutral'}>
                        {category.active ? 'Activa' : 'Inactiva'}
                      </InventoryBadge>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{category.productsCount ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-700">{formatDate(category.createdAt)}</td>
                    <Can roles={['ADMIN']}>
                      <td className="px-3 py-2">
                        <button
                          className={SECONDARY_BUTTON_CLASS}
                          disabled={saving}
                          onClick={() => startEdit(category)}
                        >
                          Editar
                        </button>
                      </td>
                    </Can>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
