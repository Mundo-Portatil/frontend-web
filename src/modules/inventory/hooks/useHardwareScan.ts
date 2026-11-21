import { useRef, useState } from 'react';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import { asAppError } from '../../../services/api/errors';
import type { HardwareItem } from '../hardwareModels';
import { scanHardware } from '../services/hardwareItemService';

export function useHardwareScan() {
  const [code, setCode] = useState('');
  const [item, setItem] = useState<HardwareItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const request = useRef(0);

  async function search(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Introduce o escanea un código.');
      return;
    }
    const revision = ++request.current;
    setCode(trimmed);
    setBusy(true);
    setItem(null);
    setError(null);
    setMessage(null);

    try {
      const result = await scanHardware(trimmed);
      if (revision === request.current) setItem(result);
    } catch (e) {
      if (revision === request.current) setError(asAppError(e).message);
    } finally {
      if (revision === request.current) setBusy(false);
    }
  }

  useBarcodeScanner((value) => {
    void search(value);
  }, !busy);

  const clear = () => {
    setCode('');
    setItem(null);
    setError(null);
    setMessage(null);
  };

  return {
    code,
    setCode,
    item,
    busy,
    error,
    message,
    search,
    clear,
  };
}
