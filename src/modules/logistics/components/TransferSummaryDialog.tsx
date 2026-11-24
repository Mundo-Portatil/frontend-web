import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { TransferDraft } from '../draftModels';
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '../../../utils/formStyles';
import { SERIAL_TRANSFER_BLOCK } from '../validation';
export function TransferSummaryDialog({ draft, origin, destination, busy, onClose, onConfirm }: { draft: TransferDraft; origin: string; destination: string; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  const latest = useRef({ busy, onClose });
  useEffect(() => { latest.current = { busy, onClose }; }, [busy, onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const root = document.getElementById('root');
    const wasInert = root?.inert;
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); if (!latest.current.busy) latest.current.onClose(); }
      if (event.key !== 'Tab') return;
      const controls = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]') ?? []);
      const first = controls[0]; const last = controls.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = overflow; if (root) root.inert = wasInert ?? false; previous?.focus(); };
  }, []);
  return createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
    <div role="dialog" aria-modal="true" aria-labelledby="transfer-summary-title" aria-describedby="transfer-summary-effect" tabIndex={-1} ref={dialog} className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl focus:outline-none">
      <h2 id="transfer-summary-title" className="text-lg font-bold">Confirmar traslado</h2>
      <p className="mt-3 font-medium">{origin} → {destination}</p>
      <ul className="my-4 divide-y divide-slate-100">{draft.quantities.map(line => <li className="py-2" key={line.catalog.id}>{line.catalog.name} · {line.quantity} unidades</li>)}{draft.serials.map(item => <li className="py-2" key={item.id}>{item.catalogName || 'Unidad'} · {item.serialNumber}</li>)}</ul>
      {draft.notes.trim() && <p className="mb-3 whitespace-pre-wrap break-words text-sm">{draft.notes.trim()}</p>}
      <p id="transfer-summary-effect" className="text-sm text-slate-600">Al confirmar, las existencias se trasladan inmediatamente.</p>
      {draft.serials.length > 0 && <p role="alert" className="mt-3 text-sm text-amber-800">{SERIAL_TRANSFER_BLOCK}</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" className={SECONDARY_BUTTON_CLASS} disabled={busy} onClick={onClose}>Volver a editar</button><button type="button" className={PRIMARY_BUTTON_CLASS} disabled={busy || draft.serials.length > 0} onClick={onConfirm}>{busy ? 'Registrando…' : 'Confirmar traslado'}</button></div>
    </div>
  </div>, document.body);
}
