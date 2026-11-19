import { useState, type FormEvent } from 'react';
import type { Location } from '../../foundation/locations/models';
import { useLocationStore } from '../../../stores/locationStore';
import { useAuthStore } from '../../../stores/authStore';
import { getAccessToken } from '../../../config/authToken';
import { Notification } from '../../../components/notifications/Notification';
import { asAppError } from '../../../services/api/errors';
import { LABEL_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import { inboundQuantityStock, adjustQuantityStock } from '../services/quantityStockService';
import { CatalogProductPicker } from './CatalogProductPicker';
import type { QuantityStock } from '../quantityModels';

export function QuantityStockForm({ locations, onSaved }: { locations: Location[]; onSaved: (stock: QuantityStock) => void }) {
  const currentLocation = useLocationStore((state) => state.activeLocation);
  const [mode, setMode] = useState('inbound');
  const [catalogId, setCatalogId] = useState('');
  const [locationId, setLocationId] = useState(currentLocation?.id ?? '');
  const [quantity, setQuantity] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [reason, setReason] = useState('');
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeLocations = locations.filter((location) => location.active);

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!catalogId) { setError('Selecciona un producto no serializado.'); return; }
    if (!activeLocations.some((location) => location.id === locationId)) { setError('Selecciona una ubicación activa.'); return; }
    const count = Number(quantity);
    if (!quantity.trim() || !Number.isSafeInteger(count) || count < (mode === 'inbound' ? 1 : 0)) { setError(mode === 'inbound' ? 'La entrada debe ser un entero mayor que cero.' : 'La nueva cantidad debe ser un entero igual o mayor que cero.'); return; }
    if (mode === 'adjust' && !reason.trim()) { setError('El motivo del ajuste es obligatorio.'); return; }
    if (mode === 'inbound' && [costPrice, salePrice].some((value) => value.trim() && (!Number.isFinite(Number(value)) || Number(value) < 0))) { setError('Los precios deben ser números iguales o mayores que cero.'); return; }
    setReview(true);
  }
  async function confirm() {
    if (busy || useAuthStore.getState().user?.role !== 'ADMIN') return;
    const sessionToken = getAccessToken();
    const accountId = useAuthStore.getState().user?.id;
    setBusy(true); setError(null);
    try {
      const result = mode === 'inbound' ? await inboundQuantityStock({ catalogId: catalogId.trim(), locationId, quantity: Number(quantity), ...(costPrice.trim() ? { costPrice: Number(costPrice) } : {}), ...(salePrice.trim() ? { salePrice: Number(salePrice) } : {}) }) : await adjustQuantityStock({ catalogId: catalogId.trim(), locationId, newQuantity: Number(quantity), reason: reason.trim() });
      if (getAccessToken() !== sessionToken || useAuthStore.getState().user?.id !== accountId) return;
      setReview(false); setQuantity(''); setReason(''); setCostPrice(''); setSalePrice('');
      onSaved(result);
    } catch (failure) { setError(asAppError(failure).message); }
    finally { setBusy(false); }
  }
  return <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
    <h2 className="mb-4 text-lg font-semibold">Registrar movimiento de stock</h2>
    {error && <Notification kind="error">{error}</Notification>}
    <form onSubmit={prepare} noValidate>
      <fieldset disabled={busy || review} className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="stock-mode" className={LABEL_CLASS}>Operación</label><select id="stock-mode" value={mode} onChange={(event) => setMode(event.target.value)} className={TEXT_INPUT_CLASS}><option value="inbound">Entrada de mercadería</option><option value="adjust">Ajuste de cantidad total</option></select></div>
        <CatalogProductPicker id="stock-catalog" serialized={false} onChange={setCatalogId} disabled={busy || review} />
        <div><label htmlFor="stock-location" className={LABEL_CLASS}>Ubicación de ingreso o ajuste</label><select id="stock-location" value={locationId} onChange={(event) => setLocationId(event.target.value)} className={TEXT_INPUT_CLASS} required><option value="">Selecciona ubicación</option>{activeLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></div>
        <div><label htmlFor="stock-quantity" className={LABEL_CLASS}>{mode === 'inbound' ? 'Cantidad que ingresa' : 'Nueva cantidad total'}</label><input id="stock-quantity" type="number" min={mode === 'inbound' ? 1 : 0} step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className={TEXT_INPUT_CLASS} required /></div>
        {mode === 'inbound' ? <><div><label htmlFor="stock-cost" className={LABEL_CLASS}>Costo unitario (opcional)</label><input id="stock-cost" type="number" min="0" step="any" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} className={TEXT_INPUT_CLASS} /></div><div><label htmlFor="stock-price" className={LABEL_CLASS}>Precio de venta (opcional)</label><input id="stock-price" type="number" min="0" step="any" value={salePrice} onChange={(event) => setSalePrice(event.target.value)} className={TEXT_INPUT_CLASS} /></div></> : <div className="sm:col-span-2"><label htmlFor="stock-reason" className={LABEL_CLASS}>Motivo del ajuste</label><textarea id="stock-reason" value={reason} onChange={(event) => setReason(event.target.value)} required className={TEXT_INPUT_CLASS} /></div>}
        <div className="sm:col-span-2"><button className={PRIMARY_BUTTON_CLASS}>Revisar operación</button></div>
      </fieldset>
    </form>
    {review && <div className="mt-4 space-y-3 rounded-lg border border-brand-200 p-4"><p>{mode === 'inbound' ? `Ingresar ${quantity} unidades` : `Establecer saldo total en ${quantity} unidades`} en {activeLocations.find((location) => location.id === locationId)?.name}.</p><p className="break-all text-sm text-slate-600">Producto: {catalogId.trim()}</p>{mode === 'adjust' && <p className="text-sm">Motivo: {reason}</p>}<div className="flex flex-wrap gap-2"><button type="button" disabled={busy} className={PRIMARY_BUTTON_CLASS} onClick={() => void confirm()}>{busy ? 'Guardando…' : 'Confirmar operación'}</button><button type="button" disabled={busy} className={SECONDARY_BUTTON_CLASS} onClick={() => setReview(false)}>Volver a editar</button></div></div>}
  </section>;
}
