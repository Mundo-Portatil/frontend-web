import { useEffect, useState, type FormEvent } from 'react';
import { listActiveLocations } from '../../foundation/locations/services/locationService';
import type { Location } from '../../foundation/locations/models';
import { asAppError } from '../../../services/api/errors';
import { newDraft, type DraftHardware } from '../hardwareDraft';
import type { BatchInboundInput, HardwareItem, InboundItem } from '../hardwareModels';
import { batchInbound, validateSerials } from '../services/hardwareItemService';
import { isUuidV4 } from '../hardwareValidation';

function toItem(draft: DraftHardware): InboundItem {
  if (!isUuidV4(draft.catalogId.trim())) throw new Error('Selecciona un producto válido para cada equipo y componente.');
  for (const price of [draft.costPrice, draft.salePrice]) if (price !== '' && (!Number.isFinite(Number(price)) || Number(price) < 0)) throw new Error('Los precios deben ser números mayores o iguales a cero.');
  return { catalogId: draft.catalogId.trim(), ...(draft.serialNumber.trim() ? { serialNumber: draft.serialNumber.trim() } : {}), ...(draft.costPrice !== '' ? { costPrice: Number(draft.costPrice) } : {}), ...(draft.salePrice !== '' ? { salePrice: Number(draft.salePrice) } : {}), ...(draft.children.length ? { children: draft.children.map(toItem) } : {}) };
}
export function useHardwareInbound() {
  const [locations, setLocations] = useState<Location[]>([]); const [loading, setLoading] = useState(true);
  const [locationId, setLocationId] = useState(''); const [items, setItems] = useState<DraftHardware[]>([newDraft()]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<BatchInboundInput | null>(null); const [created, setCreated] = useState<HardwareItem[]>([]);
  const [loadRevision, setLoadRevision] = useState(0);
  useEffect(() => { let current = true; void listActiveLocations().then((data) => { if (current) { setLocations(data); setError(null); } }).catch((e) => { if (current) setError(asAppError(e).message); }).finally(() => { if (current) setLoading(false); }); return () => { current = false; }; }, [loadRevision]);
  function update(index: number, next: DraftHardware) { setItems((all) => all.map((item, i) => i === index ? next : item)); }
  async function prepare(event: FormEvent) {
    event.preventDefault(); setError(null); setCreated([]);
    try {
      if (!locations.some((location) => location.id === locationId && location.active)) throw new Error('Selecciona una ubicación activa.');
      if (!items.length) throw new Error('Agrega al menos un equipo.');
      const payload = { locationId, items: items.map(toItem) };
      const serials = payload.items.flatMap((item) => [item.serialNumber, ...(item.children ?? []).map((child) => child.serialNumber)]).filter((s): s is string => !!s);
      if (new Set(serials).size !== serials.length) throw new Error('Hay series duplicadas en el formulario.');
      setBusy(true);
      if (serials.length) { const result = await validateSerials(serials); if (!result.allValid) throw new Error(`Series ya registradas: ${result.existingSerials.join(', ')}`); }
      setReview(payload);
    } catch (e) { setError(e instanceof Error ? e.message : asAppError(e).message); } finally { setBusy(false); }
  }
  async function confirm() {
    if (!review || busy) return; setBusy(true); setError(null);
    try { const result = await batchInbound(review); setCreated(result); setReview(null); setItems([newDraft()]); }
    catch (e) { setError(asAppError(e).message); } finally { setBusy(false); }
  }
  return { locations, loading, locationId, setLocationId, items, setItems, busy, error, review, setReview, created, setLoading, setLoadRevision, update, prepare, confirm };
}
