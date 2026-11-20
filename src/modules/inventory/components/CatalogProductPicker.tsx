import { useEffect, useState, type KeyboardEvent } from 'react';
import { asAppError, type AppError } from '../../../services/api/errors';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS, LABEL_CLASS } from '../../../utils/formStyles';
import { listCatalog } from '../services/catalogService';
import type { CatalogItem, CatalogPageResult } from '../catalogModels';

interface CatalogProductPickerProps {
  id: string;
  onChange: (value: string) => void;
  onSelect?: (item: CatalogItem | null) => void;
  disabled?: boolean;
  serialized?: boolean;
  label?: string;
  searchLabel?: string;
}

/** Searches the real catalogue without submitting the surrounding operation form. */
export function CatalogProductPicker({
  id,
  onChange,
  onSelect,
  disabled = false,
  serialized,
  label,
  searchLabel = 'Buscar producto por nombre o código',
}: CatalogProductPickerProps) {
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
    void listCatalog({ active: true, page, limit: 50, ...(term ? { search: term } : {}) }, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((failure: unknown) => { if (!controller.signal.aborted) setError(asAppError(failure)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [term, page, revision]);

  function searchProducts() {
    setTerm(search.trim());
    setPage(1);
    setRevision((value) => value + 1);
  }

  function handleSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      searchProducts();
    }
  }

  const options = data?.items.filter((item) => serialized === undefined || item.isSerialized === serialized) ?? [];
  const hasMore = Boolean(data && page * data.limit < data.total);

  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={`${id}-search`} className={LABEL_CLASS}>{searchLabel}</label>
      <div className="flex min-w-0 items-start gap-2">
        <input
          id={`${id}-search`}
          name={`${id}-search`}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={handleSearchKey}
          className={`${TEXT_INPUT_CLASS} min-w-0 flex-1`}
          disabled={disabled}
          autoComplete="off"
          placeholder="Nombre, marca o código…"
        />
        <button type="button" disabled={disabled} onClick={searchProducts} className={`${SECONDARY_BUTTON_CLASS} shrink-0`}>Buscar</button>
      </div>
      {error ? (
        <ErrorState error={error} onRetry={disabled ? undefined : () => setRevision((value) => value + 1)} />
      ) : loading ? (
        <p role="status" className="text-sm text-slate-500">Buscando productos…</p>
      ) : (
        <>
          <label htmlFor={id} className={LABEL_CLASS}>
            {label ?? (serialized === false ? 'Producto por cantidad' : serialized === true ? 'Producto con serie' : 'Producto')}
          </label>
          <select
            id={id}
            name={id}
            value={selected?.id ?? ''}
            disabled={disabled}
            className={`${TEXT_INPUT_CLASS} min-w-0`}
            onChange={(event) => {
              const item = options.find((entry) => entry.id === event.target.value) ?? null;
              setSelected(item);
              onChange(item?.id ?? '');
              onSelect?.(item);
            }}
          >
            <option value="">Selecciona producto</option>
            {selected && !options.some((item) => item.id === selected.id) && <option value={selected.id}>{selected.name} · {selected.sku}</option>}
            {options.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.sku}</option>)}
          </select>
          {!options.length && (
            <p role="status" className="text-sm text-slate-600">
              No hay productos compatibles entre estos resultados. Prueba otro nombre o código{hasMore ? ', o busca en más productos.' : '.'}
            </p>
          )}
          {(page > 1 || hasMore) && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Más resultados de productos">
              <button type="button" disabled={disabled || page <= 1} onClick={() => setPage((value) => value - 1)} className={SECONDARY_BUTTON_CLASS}>Productos anteriores</button>
              <button type="button" disabled={disabled || !hasMore} onClick={() => setPage((value) => value + 1)} className={SECONDARY_BUTTON_CLASS}>Más productos</button>
            </div>
          )}
        </>
      )}
      {selected && <p role="status" className="break-words text-sm text-slate-600">Seleccionado: {selected.name} · {selected.sku}</p>}
    </div>
  );
}
