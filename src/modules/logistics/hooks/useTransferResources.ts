import { useEffect, useRef, useState } from 'react';
import { listQuantityStock, lookupHardware, scanHardware, type HardwareItem } from '../../inventory';
import { listActiveLocations } from '../../foundation/locations/services/locationService';
import type { Location } from '../../foundation/locations/models';
import { asAppError } from '../../../services/api/errors';
export async function readAvailable(locationId: string, catalogItemId: string, signal?: AbortSignal): Promise<number> {
  const result = await listQuantityStock({ locationId, catalogItemId, page: 1, limit: 50 }, signal);
  if (!result || !Array.isArray(result.items)) throw new Error('Invalid stock response');
  const rows = result.items.filter(item => item.locationId === locationId && item.catalogId === catalogItemId);
  if (rows.length > 1) throw new Error('Ambiguous stock response');
  const quantity = rows[0]?.quantity ?? 0;
  if (!Number.isFinite(quantity) || quantity < 0) throw new Error('Invalid stock balance');
  return quantity;
}
export function useTransferLocations() {
  const [data, setData] = useState<Location[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    listActiveLocations().then(items => { if (active) setData(items); }).catch(cause => { if (active) setError(asAppError(cause).message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { data, error, loading };
}
export function useOriginAvailability(locationId: string, catalogId: string, revision: number) {
  const [state, setState] = useState<{ key: string; quantity: number | null; error: string }>({ key: '', quantity: null, error: '' });
  const key = `${locationId}/${catalogId}/${revision}`;
  useEffect(() => {
    if (!locationId || !catalogId) return;
    const controller = new AbortController();
    readAvailable(locationId, catalogId, controller.signal).then(quantity => { if (!controller.signal.aborted) setState({ key, quantity, error: '' }); }).catch(cause => { if (!controller.signal.aborted) setState({ key, quantity: null, error: asAppError(cause).message }); });
    return () => controller.abort();
  }, [locationId, catalogId, key]);
  return state.key === key ? state : { key, quantity: null, error: '' };
}
export function useSerializedLookup() {
  const request = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => () => request.current?.abort(), []);
  async function find(code: string, originId: string, existingIds: string[], fallbackCatalogName?: string): Promise<HardwareItem | null> {
    if (!code.trim()) return null;
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setLoading(true); setError('');
    try {
      let item: HardwareItem;
      try {
        item = await lookupHardware(code.trim(), controller.signal);
      } catch {
        item = await scanHardware(code.trim(), controller.signal);
      }
      if (fallbackCatalogName && !item.catalogName) {
        item = { ...item, catalogName: fallbackCatalogName };
      }
      if (controller.signal.aborted) return null;
      if (existingIds.includes(item.id)) { setError('Esta unidad ya está agregada.'); return null; }
      if (item.locationId !== originId || item.status !== 'EN_STOCK' || item.parentChassisId) { setError('La unidad no está disponible para salir de este origen.'); return null; }
      return item;
    } catch (cause) { if (!controller.signal.aborted) setError(asAppError(cause).message); return null; }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }
  return { find, error, loading };
}
