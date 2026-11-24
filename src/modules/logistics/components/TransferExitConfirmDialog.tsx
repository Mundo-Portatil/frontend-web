import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DANGER_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '../../../utils/formStyles';

interface TransferExitConfirmDialogProps {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export function TransferExitConfirmDialog({
  isOpen,
  onStay,
  onLeave,
}: TransferExitConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    stayButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onStay();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex="0"]',
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onStay]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-exit-dialog-title"
      aria-describedby="transfer-exit-dialog-description"
      ref={dialogRef}
    >
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="p-6">
          <h2
            id="transfer-exit-dialog-title"
            className="text-lg font-bold text-slate-900"
          >
            ¿Salir del traslado?
          </h2>
          <p
            id="transfer-exit-dialog-description"
            className="mt-2 text-sm text-slate-600"
          >
            Si sales ahora, perderás los cambios del traslado que todavía no has registrado.
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3">
          <button
            ref={stayButtonRef}
            type="button"
            className={SECONDARY_BUTTON_CLASS}
            onClick={onStay}
          >
            Seguir editando
          </button>
          <button
            type="button"
            className={DANGER_BUTTON_CLASS}
            onClick={onLeave}
          >
            Salir sin guardar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
