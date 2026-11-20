import { useState, type FormEvent } from 'react';
import { Notification } from '../../../components/notifications/Notification';
import { asAppError } from '../../../services/api/errors';
import { useAuthStore } from '../../../stores/authStore';
import { LABEL_CLASS, PRIMARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import type { Category } from '../models';
import type { CreateCatalogInput } from '../catalogModels';
import { createCatalogItem } from '../services/catalogService';
const TEXT_FIELDS = [ ['sku', 'SKU'], ['name', 'Nombre'], ['brand', 'Marca'], ['model', 'Modelo'], ['processor', 'Procesador'], ['ramCapacity', 'RAM'], ['storageCapacity', 'Almacenamiento'], ['gpu', 'GPU'], ['screenSize', 'Pantalla'] ] as const;
export function CatalogForm({ categories, onSaved }: { categories: Category[]; onSaved: () => void }) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [serialized, setSerialized] = useState(true);
  const [secondHand, setSecondHand] = useState(false);
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || useAuthStore.getState().user?.role !== 'ADMIN') return;
    const required = ['sku', 'name', 'brand', 'model', 'categoryId', 'basePrice'];
    if (required.some((key) => !(fields[key] ?? '').trim())) { setError('Completa SKU, nombre, marca, modelo, categoría y precio base.'); return; }
    if (!categories.some((item) => item.id === fields.categoryId && item.active)) { setError('Selecciona una categoría activa.'); return; }
    const price = Number(fields.basePrice);
    const threshold = Number(fields.minStockThreshold ?? '2');
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(threshold) || threshold < 0) { setError('El precio y el umbral deben ser números mayores o iguales a cero.'); return; }
    const payload: CreateCatalogInput = { sku: fields.sku.trim(), name: fields.name.trim(), brand: fields.brand.trim(), model: fields.model.trim(), categoryId: fields.categoryId, basePrice: price, minStockThreshold: threshold, isSerialized: serialized, isSecondHand: secondHand, active };
    for (const key of ['processor', 'ramCapacity', 'storageCapacity', 'gpu', 'screenSize'] as const) {
      if (fields[key]?.trim()) payload[key] = fields[key].trim();
    }
    setBusy(true); setError(null);
    try { await createCatalogItem(payload); setFields({}); setSerialized(true); setSecondHand(false); setActive(true); onSaved(); }
    catch (reason) { setError(asAppError(reason).message); }
    finally { setBusy(false); }
  }
  function field(key: string, value: string) { setFields((current) => ({ ...current, [key]: value })); }
  return <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"><h2 className="text-lg font-semibold text-slate-900">Registrar producto</h2><p className="mt-1 text-sm text-slate-500">Completa los datos del producto maestro. La categoría debe estar activa.</p>
    {error && <Notification kind="error">{error}</Notification>}
    <form onSubmit={(event) => void submit(event)} noValidate className="mt-4"><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {TEXT_FIELDS.map(([key, label], index) => <div key={key}><label htmlFor={`catalog-${key}`} className={LABEL_CLASS}>{label}{index < 4 ? ' *' : ''}</label><input id={`catalog-${key}`} value={fields[key] ?? ''} onChange={(event) => field(key, event.target.value)} className={TEXT_INPUT_CLASS} required={index < 4} /></div>)}
      <div><label htmlFor="catalog-category" className={LABEL_CLASS}>Categoría *</label><select id="catalog-category" value={fields.categoryId ?? ''} onChange={(event) => field('categoryId', event.target.value)} className={TEXT_INPUT_CLASS} required><option value="">Seleccionar categoría</option>{categories.filter((category) => category.active).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
      <div><label htmlFor="catalog-price" className={LABEL_CLASS}>Precio base (PEN) *</label><input id="catalog-price" type="number" min="0" step="any" required value={fields.basePrice ?? ''} onChange={(event) => field('basePrice', event.target.value)} className={TEXT_INPUT_CLASS} /></div>
      <div><label htmlFor="catalog-threshold" className={LABEL_CLASS}>Umbral mínimo</label><input id="catalog-threshold" type="number" min="0" step="any" value={fields.minStockThreshold ?? '2'} onChange={(event) => field('minStockThreshold', event.target.value)} className={TEXT_INPUT_CLASS} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={serialized} onChange={(event) => setSerialized(event.target.checked)} />Control serializado</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={secondHand} onChange={(event) => setSecondHand(event.target.checked)} />Segunda mano</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />Activo</label>
      <div className="sm:col-span-2 lg:col-span-3"><button className={PRIMARY_BUTTON_CLASS} disabled={busy}>{busy ? 'Guardando...' : 'Crear producto'}</button></div>
    </fieldset></form>
  </section>;
}
