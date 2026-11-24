import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CheckboxField } from '../../../components/forms/CheckboxField';
import { Notification } from '../../../components/notifications/Notification';
import { asAppError } from '../../../services/api/errors';
import { useAuthStore } from '../../../stores/authStore';
import { getAccessToken } from '../../../config/authToken';
import { LABEL_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import type { Category } from '../models';
import type { CatalogItem, CreateCatalogInput, UpdateCatalogInput } from '../catalogModels';
import { createCatalogItem, updateCatalogItem } from '../services/catalogService';

const GENERAL_FIELDS = [['brand', 'Marca'], ['model', 'Modelo']] as const;
const TECHNICAL_FIELDS = [
  ['processor', 'Procesador'], ['ramCapacity', 'Memoria RAM'],
  ['storageCapacity', 'Almacenamiento'], ['gpu', 'Tarjeta gráfica'], ['screenSize', 'Tamaño de pantalla'],
] as const;

function initialFields(item?: CatalogItem): Record<string, string> {
  if (!item) return {};
  const fields: Record<string, string> = {
    sku: item.sku, categoryId: item.categoryId,
    basePrice: String(item.basePrice), minStockThreshold: String(item.minStockThreshold),
  };
  for (const [key] of [...GENERAL_FIELDS, ...TECHNICAL_FIELDS]) fields[key] = item[key] ?? '';
  return fields;
}

interface CatalogFormProps {
  categories: Category[];
  initialItem?: CatalogItem;
  onSaved: () => void;
  /** Prepare a validated new model for a surrounding intake; does not write to the API. */
  onPrepare?: (payload: CreateCatalogInput) => void;
  onTrackingChange?: (serialized: boolean) => void;
  onCancel?: () => void;
  onBusyChange?: (busy: boolean) => void;
}

export function CatalogForm({ categories, initialItem, onSaved, onPrepare, onTrackingChange, onCancel, onBusyChange }: CatalogFormProps) {
  const [fields, setFields] = useState<Record<string, string>>(() => initialFields(initialItem));
  const [serialized, setSerialized] = useState(initialItem?.isSerialized ?? true);
  const [secondHand, setSecondHand] = useState(initialItem?.isSecondHand ?? false);
  const [active, setActive] = useState(initialItem?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const editing = Boolean(initialItem);
  const unchangedCategory = Boolean(initialItem && fields.categoryId === initialItem.categoryId);
  const currentCategory = categories.find((category) => category.id === initialItem?.categoryId);
  // Categories have no reliable product-kind discriminator; optional details stay available to every model.
  const showTechnicalFields = true;
  const effectiveSecondHand = editing ? secondHand : serialized && secondHand;
  const showCatalogCode = editing || !onPrepare || !serialized;

  function changeTracking(next: boolean) {
    if (editing || next === serialized) return;
    setSerialized(next);
    setSecondHand(false);
    setError(null);
    if (onPrepare && next) setFields((current) => ({ ...current, sku: '' }));
    onTrackingChange?.(next);
  }

  useEffect(() => { headingRef.current?.focus(); }, []);

  function reject(message: string, key: string) {
    setError(message);
    const input = formRef.current?.querySelector<HTMLElement>(`#catalog-${key}`);
    input?.closest('details')?.setAttribute('open', '');
    input?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || !['ADMIN', 'ENCARGADO_ALMACEN'].includes(useAuthStore.getState().user?.role ?? '')) return;
    setError(null);
    const required = ['brand', 'model', 'categoryId', 'basePrice'];
    const missing = required.find((key) => !(fields[key] ?? '').trim());
    if (missing) return reject('Completa marca, modelo, categoría y precio base.', missing === 'basePrice' ? 'price' : missing);
    if (!unchangedCategory && !categories.some((category) => category.id === fields.categoryId && category.active)) {
      return reject('Selecciona una categoría activa.', 'categoryId');
    }
    const price = Number(fields.basePrice);
    // The API requires an integer; zero is the neutral creation value for used models.
    const threshold = effectiveSecondHand && !editing ? 0 : Number(fields.minStockThreshold ?? '2');
    if (!Number.isFinite(price) || price < 0) return reject('El precio y el umbral deben ser números mayores o iguales a cero.', 'price');
    if (!Number.isFinite(threshold) || threshold < 0) return reject('El precio y el umbral deben ser números mayores o iguales a cero.', 'threshold');

    const payload: CreateCatalogInput = {
      ...(showCatalogCode && fields.sku?.trim() ? { sku: fields.sku.trim() } : {}), brand: fields.brand.trim(), model: fields.model.trim(),
      categoryId: fields.categoryId, basePrice: price, minStockThreshold: threshold,
      isSerialized: serialized, isSecondHand: effectiveSecondHand, active: true,
    };
    if (showTechnicalFields) {
      for (const [key] of TECHNICAL_FIELDS) if (fields[key]?.trim()) payload[key] = fields[key].trim();
    }

    if (onPrepare && !initialItem) {
      onPrepare(payload);
      return;
    }

    const update: UpdateCatalogInput = {};
    if (initialItem) {
      for (const [key] of GENERAL_FIELDS) {
        const value = fields[key] ?? '';
        if (value !== (initialItem[key] ?? '')) update[key] = value.trim();
      }
      if (showTechnicalFields) {
        for (const [key] of TECHNICAL_FIELDS) {
          const value = fields[key] ?? '';
          if (value !== (initialItem[key] ?? '')) update[key] = value.trim();
        }
      }
      if (fields.categoryId !== initialItem.categoryId) update.categoryId = fields.categoryId;
      if (price !== initialItem.basePrice) update.basePrice = price;
      if (!secondHand && threshold !== initialItem.minStockThreshold) update.minStockThreshold = threshold;
      if (secondHand !== initialItem.isSecondHand) update.isSecondHand = secondHand;
      if (active !== initialItem.active) update.active = active;
    }

    sending.current = true;
    const token = getAccessToken();
    const accountId = useAuthStore.getState().user?.id;
    setBusy(true);
    onBusyChange?.(true);
    try {
      if (initialItem) {
        if (Object.keys(update).length) await updateCatalogItem(initialItem.id, update);
      } else {
        await createCatalogItem(payload);
      }
      if (getAccessToken() !== token || useAuthStore.getState().user?.id !== accountId) return;
      if (!initialItem) {
        setFields({}); setSerialized(true); setSecondHand(false); setActive(true);
      }
      onSaved();
    } catch (failure) {
      if (getAccessToken() === token && useAuthStore.getState().user?.id === accountId) setError(asAppError(failure).message);
    } finally {
      sending.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  function field(key: string, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 ref={headingRef} tabIndex={-1} className="rounded text-lg font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">{editing ? 'Editar producto' : onPrepare ? 'Datos del modelo nuevo' : 'Registrar producto'}</h2>
      <p className="mt-1 text-sm text-slate-500">Datos del modelo. Las unidades se registran al ingresar mercancía.</p>
      {error && <div className="mt-3"><Notification kind="error">{error}</Notification></div>}
      <form ref={formRef} onSubmit={(event) => void submit(event)} noValidate className="mt-4">
        <fieldset disabled={busy} className="min-w-0 space-y-5">
          <fieldset className="min-w-0">
            <legend className="mb-3 font-medium text-slate-900">Información general</legend>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GENERAL_FIELDS.map(([key, label]) => (
                <div key={key} className="min-w-0"><label htmlFor={`catalog-${key}`} className={LABEL_CLASS}>{label} *</label><input id={`catalog-${key}`} name={key} value={fields[key] ?? ''} onChange={(event) => field(key, event.target.value)} className={TEXT_INPUT_CLASS} required /></div>
              ))}
              <div className="min-w-0">
                <label htmlFor="catalog-categoryId" className={LABEL_CLASS}>Categoría *</label>
                <select id="catalog-categoryId" name="categoryId" value={fields.categoryId ?? ''} onChange={(event) => field('categoryId', event.target.value)} className={TEXT_INPUT_CLASS} required>
                  <option value="">Seleccionar categoría</option>
                  {initialItem && !currentCategory?.active && <option value={initialItem.categoryId}>{currentCategory ? `${currentCategory.name} (inactiva)` : 'Categoría actual'}</option>}
                  {categories.filter((category) => category.active).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>
              <div><label htmlFor="catalog-price" className={LABEL_CLASS}>Precio base (PEN) *</label><input id="catalog-price" name="basePrice" type="number" inputMode="decimal" min="0" step="any" required value={fields.basePrice ?? ''} onChange={(event) => field('basePrice', event.target.value)} className={TEXT_INPUT_CLASS} /></div>
              {showCatalogCode && <div><label htmlFor="catalog-sku" className={LABEL_CLASS}>{editing ? 'Código de producto' : 'Código de producto (opcional)'}</label><input id="catalog-sku" name="sku" value={fields.sku ?? ''} readOnly={editing} onChange={(event) => field('sku', event.target.value)} className={TEXT_INPUT_CLASS} autoComplete="off" spellCheck={false} /></div>}
              {!editing && serialized && <div><label htmlFor="catalog-condition" className={LABEL_CLASS}>Condición</label><select id="catalog-condition" value={secondHand ? 'used' : 'new'} onChange={(event) => setSecondHand(event.target.value === 'used')} className={TEXT_INPUT_CLASS}><option value="new">Nuevo</option><option value="used">Segunda mano</option></select></div>}
              {!effectiveSecondHand && <div><label htmlFor="catalog-threshold" className={LABEL_CLASS}>Mínimo recomendado</label><input id="catalog-threshold" name="minStockThreshold" type="number" inputMode="decimal" min="0" step="any" value={fields.minStockThreshold ?? '2'} onChange={(event) => field('minStockThreshold', event.target.value)} className={TEXT_INPUT_CLASS} /></div>}
              <div><label htmlFor="catalog-tracking" className={LABEL_CLASS}>Cómo registrar las unidades</label><select id="catalog-tracking" name="tracking" value={String(serialized)} disabled={editing} onChange={(event) => changeTracking(event.target.value === 'true')} className={TEXT_INPUT_CLASS}><option value="true">Una por una, con serie o código</option><option value="false">Agrupadas por cantidad</option></select></div>
              {(!onPrepare || editing) && <div className="grid min-w-0 gap-3 sm:col-span-2 lg:col-span-3 sm:grid-cols-2">
                {editing && !onPrepare && <CheckboxField
                  id="catalog-second-hand"
                  label="Segunda mano"
                  description="Marca el producto como usado o reacondicionado."
                  checked={secondHand}
                  onChange={(event) => setSecondHand(event.target.checked)}
                />}
                {editing && (
                  <CheckboxField
                    id="catalog-active"
                    label="Activo"
                    description="Los productos inactivos dejan de estar disponibles para nuevos ingresos. Puedes reactivarlo cuando lo necesites."
                    checked={active}
                    onChange={(event) => setActive(event.target.checked)}
                  />
                )}
              </div>}
            </div>
          </fieldset>
          {showTechnicalFields && (
            <details className="rounded-lg border border-slate-200 p-3">
              <summary className="w-fit cursor-pointer rounded font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Características técnicas (opcional)</summary>
              <div className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {TECHNICAL_FIELDS.map(([key, label]) => (
                  <div key={key} className="min-w-0"><label htmlFor={`catalog-${key}`} className={LABEL_CLASS}>{label}</label><input id={`catalog-${key}`} name={key} value={fields[key] ?? ''} onChange={(event) => field(key, event.target.value)} className={TEXT_INPUT_CLASS} /></div>
                ))}
              </div>
            </details>
          )}
          <div className="flex flex-wrap gap-2">
            <button className={PRIMARY_BUTTON_CLASS} disabled={busy}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : onPrepare ? 'Continuar con el ingreso' : 'Crear producto'}</button>
            {onCancel && <button type="button" disabled={busy} className={SECONDARY_BUTTON_CLASS} onClick={onCancel}>Cancelar</button>}
          </div>
        </fieldset>
      </form>
    </section>
  );
}
