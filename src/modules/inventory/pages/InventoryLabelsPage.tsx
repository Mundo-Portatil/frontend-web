import { useEffect, useRef, useState } from 'react';
import { Notification } from '../../../components/notifications/Notification';
import { asAppError } from '../../../services/api/errors';
import { LABEL_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import { CatalogProductPicker } from '../components/CatalogProductPicker';
import { useLocationStore } from '../../../stores/locationStore';
import { getBatchLabels, getModelLabels } from '../services/barcodeLabelService';
import { listHardwareUnits } from '../services/hardwareReadService';
import type { CatalogItem } from '../catalogModels';
import type { HardwareItem, ItemStatus } from '../hardwareModels';

const STATUS: Record<ItemStatus, string> = { EN_STOCK: 'Disponible', VENDIDO: 'Vendido', SEGUNDA_MANO_PENDIENTE: 'Pendiente de aprobación', EN_GARANTIA: 'En garantía', DE_BAJA: 'De baja' };
class LabelSelectionError extends Error {}
type LabelData = { barcodeValue: string; title: string; specsSummary?: string; locationName?: string };

export function InventoryLabelsPage() {
  const [model, setModel] = useState<CatalogItem | null>(null);
  const activeLocation = useLocationStore((state) => state.activeLocation);
  return <section className="min-w-0 space-y-5">
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Imprimir etiquetas</h2>
      <CatalogProductPicker id="label-product" activeOnly={false} label="Buscar producto para etiquetas" onChange={() => undefined} onSelect={setModel} />
    </section>
    {model && <LabelSelection key={`${model.id}-${activeLocation?.id ?? 'all'}`} model={model} locationId={activeLocation?.id} locationName={activeLocation?.name} />}
  </section>;
}

function LabelSelection({ model, locationId, locationName }: { model: CatalogItem; locationId?: string; locationName?: string }) {
  const [copies, setCopies] = useState('1');
  const [units, setUnits] = useState<HardwareItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [includeUnavailable, setIncludeUnavailable] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [labels, setLabels] = useState<LabelData[] | null>(null);
  const [loading, setLoading] = useState(model.isSerialized);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const sending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const query = { catalogItemId: model.id, ...(locationId ? { locationId } : {}), ...(!includeUnavailable ? { status: 'EN_STOCK' as const } : {}), limit: 50 };

  useEffect(() => {
    if (!model.isSerialized) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setUnits([]);
    setError(null);
    void listHardwareUnits({ catalogItemId: model.id, ...(locationId ? { locationId } : {}), ...(!includeUnavailable ? { status: 'EN_STOCK' as const } : {}), page, limit: 50 }, controller.signal)
      .then((data) => { if (!controller.signal.aborted) { setUnits(data.items); setTotal(data.total); } })
      .catch((failure: unknown) => { if (!controller.signal.aborted) setError(failure instanceof LabelSelectionError ? failure.message : asAppError(failure).message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [model.id, model.isSerialized, locationId, page, includeUnavailable, revision]);

  function toggle(item: HardwareItem) {
    setSelected((current) => { const next = { ...current }; if (next[item.id]) delete next[item.id]; else next[item.id] = item.serialNumber; return next; });
    setLabels(null);
  }

  async function selectAll() {
    if (sending.current || loading) return;
    sending.current = true; setBusy(true); setError(null);
    try {
      const all: Record<string, string> = {};
      let nextPage = 1;
      let loaded = 0;
      while (true) {
        const data = await listHardwareUnits({ ...query, page: nextPage });
        if (!mounted.current) return;
        for (const item of data.items) all[item.id] = item.serialNumber;
        loaded += data.items.length;
        if (loaded >= data.total) break;
        if (!data.items.length) throw new LabelSelectionError('No se pudieron cargar todas las unidades. Intenta nuevamente.');
        nextPage += 1;
      }
      setSelected(all); setLabels(null);
    } catch (failure) { if (mounted.current) setError(failure instanceof LabelSelectionError ? failure.message : asAppError(failure).message); }
    finally { sending.current = false; if (mounted.current) setBusy(false); }
  }

  async function generate(open = false) {
    if (sending.current) return;
    setError(null);
    const count = Number(copies);
    if (!model.isSerialized && (!copies.trim() || !Number.isSafeInteger(count) || count < 1 || count > 100)) { setError('Indica entre 1 y 100 copias.'); return; }
    if (model.isSerialized && !Object.keys(selected).length) { setError('Selecciona al menos una unidad.'); return; }
    sending.current = true; setBusy(true);
    try {
      const data = labels ?? (model.isSerialized
        ? await getBatchLabels(Object.keys(selected))
        : await getModelLabels({ catalogId: model.id, copies: count, ...(locationId ? { locationId } : {}) }));
      if (!mounted.current) return;
      if (!data.length) throw new LabelSelectionError('No se recibieron etiquetas. Intenta nuevamente.');
      if (model.isSerialized && (!data.every((label) => 'hardwareItemId' in label && Object.hasOwn(selected, String(label.hardwareItemId)) && label.barcodeValue === selected[String(label.hardwareItemId)]) || data.length !== Object.keys(selected).length || new Set(data.map((label) => 'hardwareItemId' in label ? String(label.hardwareItemId) : '')).size !== data.length)) throw new LabelSelectionError('Las etiquetas recibidas no coinciden con las unidades seleccionadas.');
      if (!model.isSerialized && (data.length !== count || !data.every((label) => label.barcodeValue === model.sku))) throw new LabelSelectionError('Las etiquetas recibidas no coinciden con el producto y las copias solicitadas.');
      const printer = await import('../../../services/printer/labelPdfService');
      if (!mounted.current) return;
      try { if (open) printer.openLabelsPdf(data); else printer.downloadLabelsPdf(data); }
      catch (failure) { throw new LabelSelectionError(failure instanceof Error ? failure.message : 'No se pudo generar el PDF. Intenta nuevamente.'); }
      setLabels(data);
    } catch (failure) { if (mounted.current) setError(failure instanceof LabelSelectionError ? failure.message : asAppError(failure).message); }
    finally { sending.current = false; if (mounted.current) setBusy(false); }
  }

  return <section className="min-w-0 space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
    <header><h3 className="break-words font-semibold text-slate-900">{model.name}</h3><p className="mt-1 text-sm text-slate-500">{model.isSerialized ? 'Una etiqueta para cada unidad seleccionada.' : 'Las copias comparten el código del producto.'}</p><p className="mt-1 text-sm text-slate-500">{locationName ? `Ubicación: ${locationName}` : model.isSerialized ? 'Todas las ubicaciones' : 'Ubicación: Almacén Central'}</p></header>
    {error && <Notification kind="error">{error}</Notification>}
    {model.isSerialized ? <fieldset disabled={busy} className="min-w-0 space-y-3">
      <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={includeUnavailable} onChange={(event) => { setIncludeUnavailable(event.target.checked); setPage(1); setSelected({}); setLabels(null); }} />Incluir unidades vendidas y otros estados para reimprimir</label>
      {loading ? <p role="status">Cargando unidades…</p> : error && !units.length ? <button className={SECONDARY_BUTTON_CLASS} onClick={() => setRevision((value) => value + 1)}>Reintentar</button> : <>
        {!units.length ? <p role="status" className="text-sm text-slate-600">No hay unidades para estos filtros.</p> : <>
          <div className="flex flex-wrap gap-2"><button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => void selectAll()}>Seleccionar todas ({total})</button><button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => { setSelected({}); setLabels(null); }}>Limpiar selección</button></div>
          <ul aria-label="Unidades para imprimir" className="divide-y divide-slate-100">{units.map((item) => <li key={item.id}><label className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm"><span className="flex min-w-0 items-center gap-3"><input type="checkbox" checked={Boolean(selected[item.id])} onChange={() => toggle(item)} /><span className="break-all">{item.serialNumber}</span></span><span className="shrink-0 text-xs text-slate-500">{STATUS[item.status]}</span></label></li>)}</ul>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>Página {page} · {total} unidades</span><div className="flex gap-2"><button type="button" className={SECONDARY_BUTTON_CLASS} disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Anterior</button><button type="button" className={SECONDARY_BUTTON_CLASS} disabled={page * 50 >= total} onClick={() => setPage((value) => value + 1)}>Siguiente</button></div></div>
        </>}
      </>}
      <p role="status" className="text-sm font-medium text-slate-700">{Object.keys(selected).length} unidades seleccionadas</p>
    </fieldset> : <div className="max-w-xs"><label htmlFor="label-copies" className={LABEL_CLASS}>Número de copias</label><input id="label-copies" type="number" min="1" max="100" step="1" inputMode="numeric" disabled={busy} value={copies} onChange={(event) => { setCopies(event.target.value); setLabels(null); }} className={TEXT_INPUT_CLASS} /></div>}
    <div className="flex flex-wrap gap-2"><button type="button" disabled={busy || loading} onClick={() => void generate()} className={PRIMARY_BUTTON_CLASS}>{busy ? 'Generando…' : labels ? 'Descargar PDF nuevamente' : 'Generar PDF de etiquetas'}</button>{labels && <button type="button" disabled={busy} onClick={() => void generate(true)} className={SECONDARY_BUTTON_CLASS}>Abrir PDF para imprimir</button>}</div>
    {labels && <Notification kind="success">PDF preparado: {labels.length} etiquetas sin precio.</Notification>}
  </section>;
}
