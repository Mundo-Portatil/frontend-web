import { useRef, useState, type FormEvent } from 'react';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import { asAppError } from '../../../services/api/errors';
import { scanHardware, attachChildren, detachChild } from '../services/hardwareItemService';
import type { HardwareItem } from '../hardwareModels';
import { isUuidV4 } from '../hardwareValidation';

export function useHardwareScan() {
  const [code, setCode] = useState(''); const [item, setItem] = useState<HardwareItem | null>(null); const [busy, setBusy] = useState(false); const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null); const [message, setMessage] = useState<string | null>(null); const [childIds, setChildIds] = useState('');
  const request = useRef(0);
  async function search(value: string) { if (mutating) return; const trimmed = value.trim(); if (!trimmed) { setError('Introduce o escanea un código.'); return; } const revision = ++request.current; setCode(trimmed); setBusy(true); setItem(null); setError(null); setMessage(null);
    try { const result = await scanHardware(trimmed); if (revision === request.current) setItem(result); } catch (e) { if (revision === request.current) setError(asAppError(e).message); } finally { if (revision === request.current) setBusy(false); }
  }
  useBarcodeScanner((value) => { void search(value); }, !mutating);
  async function attach(event: FormEvent) { event.preventDefault(); if (!item || mutating) return; setError(null); setMessage(null); const ids = [...new Set(childIds.split(/[\s,]+/).filter(Boolean))];
    if (!ids.length) { setError('Introduce series de componentes para acoplar.'); return; }
    setMutating(true); try {
      const resolvedIds = await Promise.all(ids.map(async (value) => isUuidV4(value) ? value : (await scanHardware(value)).id));
      setItem(await attachChildren(item.id, [...new Set(resolvedIds)])); setChildIds(''); setMessage('Componentes acoplados correctamente.');
    } catch (e) { setError(asAppError(e).message); } finally { setMutating(false); }
  }
  async function detach(child: HardwareItem) { if (!item || mutating) return; setMutating(true); setError(null); setMessage(null);
    try { await detachChild(item.id, child.id); setItem({ ...item, components: item.components?.filter((entry) => entry.id !== child.id) }); setMessage('Componente desacoplado correctamente.'); } catch (e) { setError(asAppError(e).message); } finally { setMutating(false); }
  }
  return { code, setCode, item, busy, mutating, error, message, childIds, setChildIds, search, attach, detach };
}
