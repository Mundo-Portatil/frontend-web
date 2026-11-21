import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Notification } from '../../../components/notifications/Notification';
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '../../../utils/formStyles';

interface LabelPreviewDialogProps {
  sheets: readonly string[];
  labels: readonly { title: string; barcodeValue: string }[];
  returnFocus?: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onPrint: () => void;
}

/** The preview uses the same printable sheets, without a browser PDF toolbar. */
export function LabelPreviewDialog({ sheets, labels, returnFocus, onClose, onPrint }: LabelPreviewDialogProps) {
  const overlay = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previousFocus = returnFocus?.current ?? document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const siblings = [...document.body.children].filter((element): element is HTMLElement => element instanceof HTMLElement && element !== overlay.current);
    const inertValues = siblings.map((element) => element.inert);
    siblings.forEach((element) => { element.inert = true; });
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const elements = dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]');
      if (!elements?.length) return;
      const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      document.body.style.overflow = previousOverflow;
      siblings.forEach((element, index) => { element.inert = inertValues[index]; });
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose, returnFocus]);

  return createPortal(
    <div ref={overlay} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-2 sm:p-5" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="label-preview-title" className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div><h2 id="label-preview-title" className="text-lg font-semibold text-slate-900">Vista previa de etiquetas</h2><p className="text-sm text-slate-500">{labels.length} etiquetas · {sheets.length} {sheets.length === 1 ? 'hoja' : 'hojas'}</p></div>
          <button ref={closeButton} type="button" className={SECONDARY_BUTTON_CLASS} onClick={onClose}>Cerrar vista previa</button>
        </header>
        <div className="min-h-0 min-w-0 overflow-auto overscroll-contain bg-slate-100 p-3 sm:p-5" tabIndex={0} aria-label="Hojas de etiquetas">
          <ul className="sr-only" aria-label="Etiquetas incluidas">{labels.map((label, index) => <li key={index}>{label.title} · {label.barcodeValue}</li>)}</ul>
          <div className="mx-auto w-full min-w-[42rem] max-w-2xl space-y-4">{sheets.map((sheet, index) => <img key={index} src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(sheet)}`} alt={`Hoja ${index + 1} de etiquetas`} className="block h-auto w-full bg-white shadow-sm" />)}</div>
        </div>
        <footer className="space-y-3 border-t border-slate-200 px-4 py-3 sm:px-5">
          {error && <Notification kind="error">{error}</Notification>}
          <div className="flex justify-end"><button type="button" className={PRIMARY_BUTTON_CLASS} onClick={() => { setError(null); try { onPrint(); } catch (failure) { setError(failure instanceof Error ? failure.message : 'No se pudo abrir la impresión.'); } }}>Imprimir etiquetas</button></div>
        </footer>
      </section>
    </div>, document.body,
  );
}
