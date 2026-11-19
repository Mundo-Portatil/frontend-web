import { useState } from 'react';
import { Can } from '../../../components/guards/Can';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { Notification } from '../../../components/notifications/Notification';
import { LABEL_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import { formatDate } from '../../../utils/formatDate';
import { CategoryForm } from '../components/CategoryForm';
import { useCategories, type CategoryFilter } from '../hooks/useCategories';
import type { Category } from '../models';

export function CategoriesPage() {
  const { filter, setFilter, items, loading, error, reload } = useCategories();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  function saved() {
    setMessage(editing ? 'Categoría actualizada correctamente.' : 'Categoría creada correctamente.');
    setEditing(null); reload();
  }
  return <section className="mx-auto w-full max-w-6xl">
    <header className="mb-6"><h1 className="text-2xl font-semibold text-slate-900">Categorías</h1><p className="mt-2 text-sm text-slate-500">Organiza los productos del inventario.</p></header>
    <Can roles={['ADMIN']}><CategoryForm key={editing?.id ?? 'new'} category={editing} onSaved={saved} onBusyChange={setSaving} onCancel={() => setEditing(null)} /></Can>
    {message && <div className="mb-4"><Notification kind="success">{message}</Notification></div>}
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4"><div><label htmlFor="category-filter" className={LABEL_CLASS}>Estado de categorías</label><select id="category-filter" value={filter} onChange={(event) => setFilter(event.target.value as CategoryFilter)} className={TEXT_INPUT_CLASS}><option value="all">Todas</option><option value="active">Activas</option><option value="inactive">Inactivas</option></select></div><button className={SECONDARY_BUTTON_CLASS} onClick={reload} disabled={loading}>Recargar</button></div>
      {error ? <ErrorState error={error} onRetry={reload} /> : loading ? <LoadingState message="Cargando categorías..." /> : !items.length ? <EmptyState message="No hay categorías disponibles." /> :
        <div role="region" aria-label="Listado de categorías" tabIndex={0} className="overflow-x-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          <table className="min-w-full text-sm"><thead><tr className="border-b text-left text-slate-600"><th scope="col" className="p-2">Nombre</th><th scope="col" className="p-2">Descripción</th><th scope="col" className="p-2">Estado</th><th scope="col" className="p-2">Productos</th><th scope="col" className="p-2">Creada</th><Can roles={['ADMIN']}><th scope="col" className="p-2">Acciones</th></Can></tr></thead>
          <tbody>{items.map((category) => <tr key={category.id} className="border-b border-slate-100"><td className="p-2">{category.name}</td><td className="p-2">{category.description ?? '—'}</td><td className="p-2">{category.active ? 'Activa' : 'Inactiva'}</td><td className="p-2">{category.productsCount ?? '—'}</td><td className="p-2">{formatDate(category.createdAt)}</td><Can roles={['ADMIN']}><td className="p-2"><button className={SECONDARY_BUTTON_CLASS} disabled={saving} onClick={() => { setEditing(category); setMessage(null); }}>Editar</button></td></Can></tr>)}</tbody></table>
        </div>}
    </section>
  </section>;
}
