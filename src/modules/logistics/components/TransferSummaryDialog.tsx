import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { TransferDraft } from '../draftModels';
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '../../../utils/formStyles';

export function TransferSummaryDialog({
  draft,
  origin,
  destination,
  busy,
  onClose,
  onConfirm,
}: {
  draft: TransferDraft;
  origin: string;
  destination: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const latest = useRef({ busy, onClose });
  useEffect(() => {
    latest.current = { busy, onClose };
  }, [busy, onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const root = document.getElementById('root');
    const wasInert = root?.inert;
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!latest.current.busy) latest.current.onClose();
      }
      if (event.key !== 'Tab') return;
      const controls = Array.from(
        dialog.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]',
        ) ?? [],
      );
      const first = controls[0];
      const last = controls.at(-1);
      if (!first) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = overflow;
      if (root) root.inert = wasInert ?? false;
      previous?.focus();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-summary-title"
        aria-describedby="transfer-summary-effect"
        tabIndex={-1}
        ref={dialog}
        className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl focus:outline-none"
      >
        <h2 id="transfer-summary-title" className="text-lg font-bold text-slate-900">
          Confirmar traslado
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand-200 bg-brand-50/70 px-3 py-2 text-sm">
          <span className="font-semibold text-slate-900">{origin}</span>
          <span aria-hidden="true" className="font-bold text-brand-700">→</span>
          <span className="font-semibold text-slate-900">{destination}</span>
        </div>

        <ul className="my-4 divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
          {draft.serials.map((item) => (
            <li className="px-3 py-2 text-slate-800" key={item.id}>
              {item.catalogName || 'Unidad'} · {item.serialNumber}
            </li>
          ))}
          {draft.quantities.map((line) => (
            <li className="px-3 py-2 text-slate-800" key={line.catalog.id}>
              {line.catalog.name} · {line.quantity} {line.quantity === 1 ? 'unidad' : 'unidades'}
            </li>
          ))}
        </ul>

        {draft.notes.trim() && (
          <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Observaciones: </span>
            <span className="whitespace-pre-wrap break-words">{draft.notes.trim()}</span>
          </div>
        )}

        <p id="transfer-summary-effect" className="text-sm text-slate-600">
          Al confirmar, las existencias y ubicaciones se actualizarán de inmediato en un solo paso.
        </p>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" className={SECONDARY_BUTTON_CLASS} disabled={busy} onClick={onClose}>
            Volver a editar
          </button>
          <button type="button" className={PRIMARY_BUTTON_CLASS} disabled={busy} onClick={onConfirm}>
            {busy ? 'Registrando…' : 'Confirmar traslado'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
