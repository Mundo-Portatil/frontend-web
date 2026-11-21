import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Notification } from '../../../components/notifications/Notification';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import { asAppError } from '../../../services/api/errors';
import { LABEL_CLASS, PRIMARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import { BarcodeLabelsPanel } from '../components/BarcodeLabelsPanel';
import { CatalogProductPicker } from '../components/CatalogProductPicker';
import { useLocationStore } from '../../../stores/locationStore';
import type { ModelBarcodeLabel } from '../barcodeLabelModels';
import { getModelLabels } from '../services/barcodeLabelService';
import type { HardwareItem } from '../hardwareModels';
import { lookupHardware } from '../services/hardwareLookupService';

/** Separate label selection preserves server-issued identifiers and reprinting. */
export function InventoryLabelsPage() {
  const [mode, setMode] = useState<'units' | 'model'>('units');
  const [code, setCode] = useState('');
  const [item, setItem] = useState<HardwareItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  async function search(value: string) {
    const term = value.trim();
    if (!term) { setError('Escribe o escanea una serie o código.'); return; }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setCode(term);
    setBusy(true);
    setError(null);
    setItem(null);
    try {
      const result = await lookupHardware(term, controller.signal);
      if (!controller.signal.aborted) setItem(result);
    } catch (failure) {
      if (!controller.signal.aborted) setError(asAppError(failure).message);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  useBarcodeScanner((value) => { void search(value); }, mode === 'units');

  function submit(event: FormEvent) {
    event.preventDefault();
    void search(code);
  }

  return (
    <section className="min-w-0 space-y-5">
      <fieldset className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">Tipo de etiqueta</legend>
        <label className="flex min-h-10 items-center gap-2 text-sm"><input type="radio" name="label-mode" checked={mode === 'units'} onChange={() => setMode('units')} />Unidad con serie o código</label>
        <label className="flex min-h-10 items-center gap-2 text-sm"><input type="radio" name="label-mode" checked={mode === 'model'} onChange={() => setMode('model')} />Modelo por cantidad</label>
      </fieldset>
      {mode === 'model' ? <ModelLabelsForm /> : <>
      <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Seleccionar equipos y piezas</h2>
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="label-unit-code" className={LABEL_CLASS}>Serie o código del equipo o pieza</label>
            <input id="label-unit-code" name="code" value={code} onChange={(event) => setCode(event.target.value)} className={TEXT_INPUT_CLASS} autoComplete="off" spellCheck={false} placeholder="Escanea o escribe el código…" />
          </div>
          <button className={PRIMARY_BUTTON_CLASS} disabled={busy}>{busy ? 'Buscando…' : 'Buscar unidad'}</button>
        </div>
      </form>
      {error && <Notification kind="error">{error}</Notification>}
      {item && <p role="status" className="break-words text-sm text-slate-700">{item.catalogName ?? 'Equipo o pieza'} · {item.serialNumber}{item.locationName ? ` · ${item.locationName}` : ''}</p>}
      <BarcodeLabelsPanel hardwareItem={item} />
      </>}
    </section>
  );
}

function ModelLabelsForm() {
  const [catalogId, setCatalogId] = useState('');
  const [copies, setCopies] = useState('1');
  const [labels, setLabels] = useState<ModelBarcodeLabel[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requestPending = useRef(false);
  const activeLocation = useLocationStore((state) => state.activeLocation);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (requestPending.current) return;
    setError(null);
    setLabels(null);
    if (!catalogId) { setError('Selecciona un modelo por cantidad.'); return; }
    const count = Number(copies);
    if (!copies.trim() || !Number.isSafeInteger(count) || count < 1 || count > 100) {
      setError('Indica entre 1 y 100 copias, sin decimales.');
      return;
    }
    requestPending.current = true;
    setBusy(true);
    try {
      setLabels(await getModelLabels({ catalogId, copies: count, ...(activeLocation ? { locationId: activeLocation.id } : {}) }));
    } catch (failure) {
      setError(asAppError(failure).message);
    } finally {
      requestPending.current = false;
      setBusy(false);
    }
  }

  return <section className="min-w-0 space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
    <header><h2 className="text-lg font-semibold text-slate-900">Etiquetas por modelo</h2><p className="mt-1 text-sm text-slate-500">Cada copia utiliza el código del modelo. Vista previa; impresión aún no disponible.</p></header>
    {error && <Notification kind="error">{error}</Notification>}
    <form onSubmit={(event) => void submit(event)} noValidate>
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        <CatalogProductPicker id="label-model" activeOnly={false} label="Modelo para etiquetas" disabled={busy} onChange={(value) => { setCatalogId(value); setLabels(null); setError(null); }} />
        <div className="max-w-xs"><label htmlFor="label-copies" className={LABEL_CLASS}>Número de copias</label><input id="label-copies" name="copies" type="number" min="1" max="100" step="1" inputMode="numeric" value={copies} onChange={(event) => { setCopies(event.target.value); setLabels(null); }} className={TEXT_INPUT_CLASS} /></div>
        <p className="text-sm text-slate-500">Ubicación: {activeLocation?.name ?? 'Almacén Central'}</p>
        <button className={PRIMARY_BUTTON_CLASS}>{busy ? 'Cargando…' : 'Preparar etiquetas'}</button>
      </fieldset>
    </form>
    {labels?.length === 0 && <p role="status" className="text-sm text-slate-600">No se devolvieron etiquetas para el modelo.</p>}
    {labels && labels.length > 0 && <section aria-label="Vista previa de etiquetas por modelo" className="grid gap-3 sm:grid-cols-2">
      {labels.map((label) => <article key={`${label.catalogId}-${label.copyNumber}`} className="min-w-0 space-y-1 rounded-lg border border-slate-200 p-3">
        <h3 className="break-words font-semibold text-slate-900">{label.title}</h3>
        <p className="break-all font-mono text-sm text-slate-700">{label.barcodeValue}</p>
        <p className="break-words text-sm text-slate-600">{label.specsSummary}</p>
        <p className="break-words text-sm text-slate-600">{label.locationName}</p>
        <p className="text-xs text-slate-500">Copia {label.copyNumber} de {label.totalCopies}</p>
      </article>)}
    </section>}
  </section>;
}
