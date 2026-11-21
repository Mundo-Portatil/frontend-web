import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { asAppError, type AppError } from '../../../services/api/errors';
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import type { Category } from '../catalogModels';
import { CategoryFormModal } from '../components/CategoryFormModal';
import { listCategories } from '../services/categoryService';

export function InventoryCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [screenError, setScreenError] = useState<AppError | null>(null);
  const [search, setSearch] = useState('');
  const [modalCategory, setModalCategory] = useState<Category | null | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    setScreenError(null);
    try {
      const data = await listCategories();
      setCategories(data);
    } catch (err) {
      setScreenError(asAppError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)),
    );
  }, [categories, search]);

  const handleSaved = (saved: Category) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setModalCategory(undefined);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Categorías</h2>
          <p className="mt-1 text-sm text-slate-500">
            Administre las clasificaciones y categorías de productos del catálogo de inventario.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalCategory(null)}
          className={PRIMARY_BUTTON_CLASS}
        >
          + Nueva Categoría
        </button>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="w-full max-w-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar categoría…"
              className={TEXT_INPUT_CLASS}
            />
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className={SECONDARY_BUTTON_CLASS}
          >
            Actualizar
          </button>
        </div>

        {screenError ? (
          <ErrorState error={screenError} onRetry={() => void loadData()} />
        ) : loading ? (
          <LoadingState message="Cargando categorías…" />
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            message={
              search.trim()
                ? 'No se encontraron categorías con el criterio de búsqueda.'
                : 'No hay categorías registradas.'
            }
          />
        ) : (
          <div
            role="region"
            aria-label="Listado de categorías"
            tabIndex={0}
            className="overflow-x-auto rounded-lg border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
          >
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase text-xs text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Nombre</th>
                  <th scope="col" className="px-4 py-3">Descripción</th>
                  <th scope="col" className="px-4 py-3 text-center">Productos Vinculados</th>
                  <th scope="col" className="px-4 py-3 text-center">Estado</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{cat.name}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-md truncate">
                      {cat.description || <span className="italic text-slate-400">Sin descripción</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {cat.productsCount !== undefined ? `${cat.productsCount} productos` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          cat.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {cat.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setModalCategory(cat)}
                        className={SECONDARY_BUTTON_CLASS}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalCategory !== undefined && (
        <CategoryFormModal
          category={modalCategory}
          onClose={() => setModalCategory(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
