import { useEffect, useState } from 'react';
import { asAppError, type AppError } from '../../../services/api/errors';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS, LABEL_CLASS } from '../../../utils/formStyles';
import { listCatalog } from '../services/catalogService';
import type { CatalogItem, CatalogPageResult } from '../catalogModels';

/** Searches the real paginated catalogue, exposing the requested tracking type. */
export function CatalogProductPicker({ id, onChange, disabled = false, serialized, label, searchLabel = 'Buscar producto por nombre o SKU' }: { id: string; onChange: (value: string) => void; disabled?: boolean; serialized?: boolean; label?: string; searchLabel?: string }) {
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CatalogPageResult | null>(null);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    void listCatalog({ active: true, page, limit: 50, ...(term ? { search: term } : {}) }, controller.signal).then((result) => { if (!controller.signal.aborted) setData(result); }).catch((failure: unknown) => { if (!controller.signal.aborted) setError(asAppError(failure)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [term, page, revision]);
  const options = data?.items.filter((item) => serialized === undefined || item.isSerialized === serialized) ?? [];
  return <div className="space-y-2">
    <label htmlFor={`${id}-search`} className={LABEL_CLASS}>{searchLabel}</label>
    <div className="flex gap-2"><input id={`${id}-search`} value={search} onChange={(event) => setSearch(event.target.value)} className={TEXT_INPUT_CLASS} disabled={disabled} /><button type="button" disabled={disabled} onClick={() => { setTerm(search.trim()); setPage(1); setRevision((value) => value + 1); }} className={SECONDARY_BUTTON_CLASS}>Buscar</button></div>
    {error ? <ErrorState error={error} onRetry={disabled ? undefined : () => setRevision((value) => value + 1)} /> : loading ? <p role="status" className="text-sm text-slate-500">Buscando productos…</p> : <>
      <label htmlFor={id} className={LABEL_CLASS}>{label ?? (serialized === false ? 'Producto por cantidad' : serialized === true ? 'Producto con serie' : 'Producto de catálogo')}</label><select id={id} value={selected?.id ?? ''} disabled={disabled} className={TEXT_INPUT_CLASS} onChange={(event) => { const item = options.find((entry) => entry.id === event.target.value) ?? null; setSelected(item); onChange(item?.id ?? ''); }}><option value="">Selecciona producto</option>{selected && !options.some((item) => item.id === selected.id) && <option value={selected.id}>{selected.name} · {selected.sku}</option>}{options.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.sku}</option>)}</select>
      {!options.length && <p className="text-sm text-slate-500">No hay productos del tipo requerido en esta página del catálogo. Prueba otra búsqueda o página.</p>}
      <div className="flex gap-2"><button type="button" disabled={disabled || page <= 1} onClick={() => setPage((value) => value - 1)} className={SECONDARY_BUTTON_CLASS}>Productos anteriores</button><button type="button" disabled={disabled || !data || page * data.limit >= data.total} onClick={() => setPage((value) => value + 1)} className={SECONDARY_BUTTON_CLASS}>Más productos</button></div>
    </>}
    {selected && <p className="text-sm text-slate-600">Seleccionado: {selected.name} · {selected.sku}</p>}
  </div>;
}
