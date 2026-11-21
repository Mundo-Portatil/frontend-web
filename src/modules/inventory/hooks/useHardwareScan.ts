import { useEffect, useRef, useState } from 'react';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import { asAppError } from '../../../services/api/errors';
import { lookupHardware } from '../services/hardwareLookupService';
import type { HardwareItem } from '../hardwareModels';

/** Read-only lookup; component mutations are unavailable in the current API. */
export function useHardwareScan() {
  const [code, setCode] = useState('');
  const [item, setItem] = useState<HardwareItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | undefined>();
  const request = useRef(0);

  useEffect(() => () => { request.current += 1; }, []);

  function clearLookup() {
    request.current += 1;
    setItem(null);
    setError(null);
    setErrorStatus(undefined);
    setBusy(false);
  }

  async function search(value: string) {
    const trimmed = value.trim();
    if (!trimmed) { clearLookup(); setError('Introduce o escanea un código.'); return; }
    const revision = ++request.current;
    setCode(trimmed);
    setBusy(true);
    setItem(null);
    setError(null);
    setErrorStatus(undefined);
    try {
      const result = await lookupHardware(trimmed);
      if (revision === request.current) setItem(result);
    } catch (reason) {
      if (revision === request.current) {
        const failure = asAppError(reason);
        setError(failure.message);
        setErrorStatus(failure.status);
      }
    } finally {
      if (revision === request.current) setBusy(false);
    }
  }
  useBarcodeScanner((value) => { void search(value); });
  return { code, setCode, item, busy, error, search, errorStatus, clearLookup };
}
