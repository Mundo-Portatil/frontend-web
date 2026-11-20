import { useEffect, useRef, type RefObject } from 'react';

/**
 * Restores focus to the disclosure trigger after a panel closes.
 *
 * Returns a `restore` callback that must be invoked when the close is
 * intentional. This avoids stealing focus on the initial render, when the
 * panel starts closed.
 */
export function useRestoreFocus<T extends HTMLElement>(
  open: boolean,
  triggerRef: RefObject<T | null>,
): () => void {
  const pending = useRef(false);

  useEffect(() => {
    if (!open && pending.current) {
      pending.current = false;
      triggerRef.current?.focus();
    }
  }, [open, triggerRef]);

  return () => {
    pending.current = true;
  };
}
