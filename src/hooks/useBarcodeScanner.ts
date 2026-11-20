import { useEffect, useRef } from 'react';
import { createHidScanner } from '../services/scanner/hidScanner';
export function useBarcodeScanner(onCode: (code: string) => void, enabled = true) {
  const callback = useRef(onCode);
  useEffect(() => { callback.current = onCode; }, [onCode]);
  useEffect(() => {
    if (!enabled) return;
    const handler = createHidScanner((code) => callback.current(code));
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled]);
}
