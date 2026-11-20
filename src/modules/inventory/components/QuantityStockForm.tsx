import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Location } from '../../foundation/locations/models';
import { useLocationStore } from '../../../stores/locationStore';
import { useAuthStore } from '../../../stores/authStore';
import { getAccessToken } from '../../../config/authToken';
import { Notification } from '../../../components/notifications/Notification';
import { asAppError } from '../../../services/api/errors';
import { LABEL_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import { inboundQuantityStock, adjustQuantityStock } from '../services/quantityStockService';
import { CatalogProductPicker } from './CatalogProductPicker';
import type { CatalogItem } from '../catalogModels';
import type { QuantityStock } from '../quantityModels';

export function QuantityStockForm({ locations, onSaved, onBusyChange }: { locations: Location[]; onSaved: (stock: QuantityStock) => void; onBusyChange?: (busy: boolean) => void }) {
  const currentLocation = useLocationStore((state) => state.activeLocation);
  const [mode, setMode] = useState('inbound');
  const [catalogId, setCatalogId] = useState('');
  const [product, setProduct] = useState<CatalogItem | null>(null);
  const [locationId, setLocationId] = useState(currentLocation?.id ?? '');
  const [quantity, setQuantity] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [reason, setReason] = useState('');
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sendingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);
  const reviewButtonRef = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const returnToEditRef = useRef(false);
  const activeLocations = locations.filter((location) => location.active);
  const placeName = activeLocations.find((location) => location.id === locationId)?.name;

  useEffect(() => {
    if (review) reviewHeadingRef.current?.focus();
    else if (returnToEditRef.current) {
      returnToEditRef.current = false;
      reviewButtonRef.current?.focus();
    }
  }, [review]);

  useEffect(() => {
    if (error && review) errorRef.current?.focus();
  }, [error, review]);

  function reject(message: string, fieldId: string) {
    setError(message);
    formRef.current?.querySelector<HTMLElement>(`#${fieldId}`)?.focus();
  }

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current || review) return;
    setError(null);
    if (!catalogId) return reject('Selecciona un producto por cantidad.', 'stock-catalog');
    if (!activeLocations.some((location) => location.id === locationId)) {
      return reject('Selecciona una ubicación activa.', 'stock-location');
    }
    const count = Number(quantity);
    if (!quantity.trim() || !Number.isSafeInteger(count) || count < (mode === 'inbound' ? 1 : 0)) {
      return reject(mode === 'inbound' ? 'Ingresa una cantidad entera mayor que cero.' : 'Ingresa el conteo total: un número entero igual o mayor que cero.', 'stock-quantity');
    }
    if (mode === 'adjust' && !reason.trim()) {
      return reject('El motivo del ajuste es obligatorio.', 'stock-reason');
    }
    if (mode === 'inbound') {
      if (costPrice.trim() && (!Number.isFinite(Number(costPrice)) || Number(costPrice) < 0)) {
        return reject('El costo debe ser un número igual o mayor que cero.', 'stock-cost');
      }
      if (salePrice.trim() && (!Number.isFinite(Number(salePrice)) || Number(salePrice) < 0)) {
        return reject('El precio de venta debe ser un número igual o mayor que cero.', 'stock-price');
      }
    }
    setReview(true);
  }

  async function confirm() {
    if (!review || sendingRef.current || useAuthStore.getState().user?.role !== 'ADMIN') return;
    const sessionToken = getAccessToken();
    const accountId = useAuthStore.getState().user?.id;
    sendingRef.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setError(null);
    try {
      const result = mode === 'inbound'
        ? await inboundQuantityStock({
            catalogId: catalogId.trim(), locationId, quantity: Number(quantity),
            ...(costPrice.trim() ? { costPrice: Number(costPrice) } : {}),
            ...(salePrice.trim() ? { salePrice: Number(salePrice) } : {}),
          })
        : await adjustQuantityStock({ catalogId: catalogId.trim(), locationId, newQuantity: Number(quantity), reason: reason.trim() });
      if (getAccessToken() !== sessionToken || useAuthStore.getState().user?.id !== accountId) return;
      setReview(false);
      setQuantity('');
      setReason('');
      setCostPrice('');
      setSalePrice('');
      onSaved(result);
    } catch (failure) {
      if (getAccessToken() === sessionToken && useAuthStore.getState().user?.id === accountId) {
        setError(asAppError(failure).message);
      }
    } finally {
      sendingRef.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-slate-900">Agregar o corregir cantidades</h2>
      {error && (
        <div ref={errorRef} tabIndex={-1} className="mt-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          <Notification kind="error">{error}</Notification>
        </div>
      )}
      <form ref={formRef} onSubmit={prepare} noValidate hidden={review} className="mt-4">
        <fieldset disabled={busy || review} className="min-w-0 space-y-5">
          <div className="grid min-w-0 items-start gap-5 lg:grid-cols-2">
            <div className="min-w-0 space-y-4">
              <div>
                <label htmlFor="stock-mode" className={LABEL_CLASS}>Operación</label>
                <select id="stock-mode" name="operation" value={mode} onChange={(event) => { setMode(event.target.value); setError(null); }} className={TEXT_INPUT_CLASS}>
                  <option value="inbound">Agregar unidades</option>
                  <option value="adjust">Corregir conteo</option>
                </select>
              </div>
              <CatalogProductPicker id="stock-catalog" serialized={false} onChange={setCatalogId} onSelect={setProduct} disabled={busy || review} />
            </div>
            <div className="min-w-0 space-y-4 border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
              <div>
                <label htmlFor="stock-location" className={LABEL_CLASS}>Ubicación de ingreso o ajuste</label>
                <select id="stock-location" name="location" value={locationId} onChange={(event) => setLocationId(event.target.value)} className={TEXT_INPUT_CLASS} required>
                  <option value="">Selecciona ubicación</option>
                  {activeLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="stock-quantity" className={LABEL_CLASS}>{mode === 'inbound' ? 'Cantidad que ingresa' : 'Nueva cantidad total'}</label>
                <input id="stock-quantity" name="quantity" type="number" inputMode="numeric" min={mode === 'inbound' ? 1 : 0} step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className={TEXT_INPUT_CLASS} aria-describedby="stock-quantity-help" required />
                <p id="stock-quantity-help" className="mt-1 text-sm text-slate-500">
                  {mode === 'inbound' ? 'Se suma a las unidades de esta ubicación.' : 'Reemplaza el saldo por el total contado en esta ubicación.'}
                </p>
              </div>
              {mode === 'inbound' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="stock-cost" className={LABEL_CLASS}>Costo unitario (opcional)</label>
                    <input id="stock-cost" name="costPrice" type="number" inputMode="decimal" min="0" step="any" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} className={TEXT_INPUT_CLASS} />
                  </div>
                  <div>
                    <label htmlFor="stock-price" className={LABEL_CLASS}>Precio de venta (opcional)</label>
                    <input id="stock-price" name="salePrice" type="number" inputMode="decimal" min="0" step="any" value={salePrice} onChange={(event) => setSalePrice(event.target.value)} className={TEXT_INPUT_CLASS} />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="stock-reason" className={LABEL_CLASS}>Motivo del ajuste</label>
                  <textarea id="stock-reason" name="reason" value={reason} onChange={(event) => setReason(event.target.value)} required rows={3} className={`${TEXT_INPUT_CLASS} h-24 max-h-24 resize-none overflow-y-auto`} />
                </div>
              )}
            </div>
          </div>
          <button ref={reviewButtonRef} className={`${PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}>Revisar operación</button>
        </fieldset>
      </form>
      {review && (
        <section aria-labelledby="stock-review-heading" className="mt-4 space-y-4 rounded-lg border border-brand-200 bg-brand-50/40 p-4">
          <h3 ref={reviewHeadingRef} id="stock-review-heading" tabIndex={-1} className="rounded font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Revisar operación</h3>
          <dl className="grid min-w-0 gap-3 text-sm sm:grid-cols-2">
            <div className="min-w-0"><dt className="text-slate-500">Producto</dt><dd className="break-words font-medium text-slate-900">{product?.name ?? 'Producto seleccionado'}{product?.sku && <span className="block font-normal text-slate-600">{product.sku}</span>}</dd></div>
            <div className="min-w-0"><dt className="text-slate-500">Ubicación</dt><dd className="break-words font-medium text-slate-900">{placeName}</dd></div>
            <div><dt className="text-slate-500">Operación</dt><dd className="font-medium text-slate-900">{mode === 'inbound' ? `Agregar ${quantity} unidades` : `Dejar ${quantity} unidades en total`}</dd></div>
            {mode === 'adjust' && <div className="min-w-0"><dt className="text-slate-500">Motivo</dt><dd className="whitespace-pre-wrap break-words font-medium text-slate-900">{reason.trim()}</dd></div>}
            {mode === 'inbound' && costPrice.trim() && <div><dt className="text-slate-500">Costo unitario</dt><dd className="font-medium text-slate-900">{Number(costPrice)}</dd></div>}
            {mode === 'inbound' && salePrice.trim() && <div><dt className="text-slate-500">Precio de venta</dt><dd className="font-medium text-slate-900">{Number(salePrice)}</dd></div>}
          </dl>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} className={PRIMARY_BUTTON_CLASS} onClick={() => void confirm()}>{busy ? 'Guardando…' : 'Confirmar operación'}</button>
            <button type="button" disabled={busy} className={SECONDARY_BUTTON_CLASS} onClick={() => { setError(null); returnToEditRef.current = true; setReview(false); }}>Volver a editar</button>
          </div>
        </section>
      )}
    </section>
  );
}
