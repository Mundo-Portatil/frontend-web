import { useState, type FormEvent } from 'react';
import { Notification } from '../../../components/notifications/Notification';
import { asAppError } from '../../../services/api/errors';
import { LABEL_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import { useAuthStore } from '../../../stores/authStore';
import type { Category } from '../models';
import { createCategory, updateCategory } from '../services/categoryService';

export function CategoryForm({ category, onSaved, onCancel, onBusyChange }: { category: Category | null; onSaved: () => void; onCancel: () => void; onBusyChange: (busy: boolean) => void }) {
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [active, setActive] = useState(category?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || useAuthStore.getState().user?.role !== 'ADMIN') return;
    if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
    setError(null); setBusy(true); onBusyChange(true);
    try {
      const payload = { name: name.trim(), description: description.trim(), active };
      if (category) await updateCategory(category.id, payload);
      else await createCategory(payload);
      setName(''); setDescription(''); setActive(true);
      onSaved();
    } catch (reason) { setError(asAppError(reason).message); }
    finally { setBusy(false); onBusyChange(false); }
  }
  return <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
    <h2 className="text-lg font-semibold">{category ? 'Editar categoría' : 'Registrar categoría'}</h2>
    {error && <div className="mt-3"><Notification kind="error">{error}</Notification></div>}
    <form onSubmit={(event) => void submit(event)} noValidate className="mt-4">
      <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div><label htmlFor="category-name" className={LABEL_CLASS}>Nombre</label><input id="category-name" required value={name} onChange={(event) => setName(event.target.value)} className={TEXT_INPUT_CLASS} /></div>
        <div><label htmlFor="category-description" className={LABEL_CLASS}>Descripción</label><input id="category-description" value={description} onChange={(event) => setDescription(event.target.value)} className={TEXT_INPUT_CLASS} /></div>
        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />Activa</label>
        <div className="flex flex-wrap gap-2 sm:col-span-2"><button disabled={busy} className={PRIMARY_BUTTON_CLASS}>{busy ? 'Guardando...' : category ? 'Guardar cambios' : 'Crear categoría'}</button>{category && <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={onCancel}>Cancelar</button>}</div>
      </fieldset>
    </form>
  </section>;
}
