import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { asAppError, type AppError } from '../../../services/api/errors';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS, LABEL_CLASS } from '../../../utils/formStyles';
import { listCatalog } from '../services/catalogService';
import type { CatalogItem } from '../catalogModels';

interface CatalogProductPickerProps {
  id: string;
  onChange: (value: string) => void;
  onSelect?: (item: CatalogItem | null) => void;
  disabled?: boolean;
  serialized?: boolean;
  label?: string;
  searchLabel?: string;
  /** Entry forms require active products; stock queries may include inactive ones. */
  activeOnly?: boolean;
}

interface ProductResults {
  items: CatalogItem[];
  nextPage: number;
  hasMore: boolean;
  hasOtherType: boolean;
  hasInactive: boolean;
}

const EMPTY_RESULTS: ProductResults = {
  items: [], nextPage: 1, hasMore: false, hasOtherType: false, hasInactive: false,
};

/** Skip pages without selectable products instead of announcing a false empty result. */
async function findProducts(
  term: string,
  firstPage: number,
  serialized: boolean | undefined,
  activeOnly: boolean,
  signal: AbortSignal,
): Promise<ProductResults> {
  const found: ProductResults = { ...EMPTY_RESULTS, items: [], nextPage: firstPage };
  do {
    const page = found.nextPage;
    const result = await listCatalog({ page, limit: 50, ...(activeOnly ? { active: true } : {}), ...(term ? { search: term } : {}) }, signal);
    if (signal.aborted) return found;
    found.nextPage = page + 1;
    found.hasMore = result.items.length > 0 && page * (result.limit > 0 ? result.limit : 50) < result.total;
    for (const item of result.items) {
      if (serialized !== undefined && item.isSerialized !== serialized) {
        found.hasOtherType = true;
      } else if (activeOnly && item.active !== true) {
        found.hasInactive = true;
      } else {
        found.items.push(item);
      }
    }
  } while (!found.items.length && found.hasMore && !signal.aborted);
  return found;
}

/** One searchable selection control for both entry forms and stock filters. */
export function CatalogProductPicker({
  id,
  onChange,
  onSelect,
  disabled = false,
  serialized,
  label,
  searchLabel,
  activeOnly = true,
}: CatalogProductPickerProps) {
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<ProductResults>(EMPTY_RESULTS);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [revision, setRevision] = useState(0);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const controllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searching = !selected && search.trim() !== term;
  const busy = loading || searching;
  const expanded = open && !disabled;
  const visibleOptions = expanded && !busy ? results.items : [];
  const inputLabel = label ?? (serialized === false ? 'Producto por cantidad' : serialized === true ? 'Producto con serie' : searchLabel ?? 'Producto');

  useEffect(() => {
    if (selected) return;
    const timeout = setTimeout(() => setTerm(search.trim()), 250);
    return () => clearTimeout(timeout);
  }, [search, selected]);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setResults(EMPTY_RESULTS);
    setError(null);
    setActiveIndex(-1);
    void findProducts(term, 1, serialized, activeOnly, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setResults(data); })
      .catch((failure: unknown) => { if (!controller.signal.aborted) setError(asAppError(failure)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [term, revision, serialized, activeOnly]);

  useEffect(() => {
    if (expanded && activeIndex >= 0) {
      document.getElementById(`${id}-option-${activeIndex}`)?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [activeIndex, expanded, id]);

  function choose(item: CatalogItem) {
    if (disabled) return;
    setSelected(item);
    setSearch(`${item.name} · ${item.sku}`);
    setActiveIndex(-1);
    onChange(item.id);
    onSelect?.(item);
    inputRef.current?.focus();
    setOpen(false);
  }

  function clear() {
    if (disabled) return;
    setSelected(null);
    setSearch('');
    setOpen(true);
    setActiveIndex(-1);
    onChange('');
    onSelect?.(null);
    inputRef.current?.focus();
  }

  async function loadMore() {
    const controller = controllerRef.current;
    if (!controller || controller.signal.aborted || busy || !results.hasMore || disabled) return;
    setLoading(true);
    setError(null);
    try {
      const next = await findProducts(term, results.nextPage, serialized, activeOnly, controller.signal);
      if (!controller.signal.aborted) {
        setResults((current) => ({
          ...next,
          items: [...new Map([...current.items, ...next.items].map((item) => [item.id, item])).values()],
          hasOtherType: current.hasOtherType || next.hasOtherType,
          hasInactive: current.hasInactive || next.hasInactive,
        }));
      }
    } catch (failure) {
      if (!controller.signal.aborted) setError(asAppError(failure));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      if (!busy && results.items.length) {
        setActiveIndex((current) => event.key === 'ArrowDown'
          ? (current + 1) % results.items.length
          : (current <= 0 ? results.items.length - 1 : current - 1));
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (expanded && !busy && activeIndex >= 0 && results.items[activeIndex]) {
        choose(results.items[activeIndex]);
      } else if (!selected) {
        setTerm(search.trim());
        setRevision((value) => value + 1);
        setOpen(true);
        setActiveIndex(-1);
      }
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const emptyMessage = results.hasInactive
    ? 'Los productos encontrados están inactivos. Solicita su activación para registrar unidades.'
    : results.hasOtherType
      ? serialized === false ? 'Los productos encontrados se registran por serie o código.' : 'Los productos encontrados se registran por cantidad.'
      : activeOnly ? 'No se encontraron productos activos. Prueba otro nombre o código.' : 'No se encontraron productos. Prueba otro nombre o código.';

  return (
    <div className="min-w-0 space-y-2" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setActiveIndex(-1); }
    }}>
      <label htmlFor={id} className={LABEL_CLASS}>{inputLabel}</label>
      <div className="flex min-w-0 items-start gap-2">
        <input
          ref={inputRef}
          id={id}
          name={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={`${id}-options`}
          aria-activedescendant={visibleOptions[activeIndex] ? `${id}-option-${activeIndex}` : undefined}
          aria-describedby={`${id}-feedback`}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
            if (selected) { setSelected(null); onChange(''); onSelect?.(null); }
          }}
          onFocus={() => { if (!selected) setOpen(true); }}
          onClick={() => { if (!selected) setOpen(true); }}
          onKeyDown={handleKey}
          className={`${TEXT_INPUT_CLASS} min-w-0 flex-1`}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          placeholder="Busca por marca, modelo o código…"
        />
        {selected && <button type="button" disabled={disabled} onClick={clear} className={`${SECONDARY_BUTTON_CLASS} shrink-0`}>Cambiar producto</button>}
      </div>
      {expanded && (
        <div className="space-y-2">
          {serialized !== undefined && (
            <p className="text-xs text-slate-500">
              {activeOnly ? 'Productos activos' : 'Productos activos e inactivos'} {serialized ? 'por serie o código' : 'por cantidad'}
            </p>
          )}
          <ul id={`${id}-options`} role="listbox" aria-label={`Resultados de ${inputLabel.toLowerCase()}`} className={visibleOptions.length ? 'max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1' : undefined}>
            {visibleOptions.map((item, index) => (
              <li key={item.id} role="none">
                <button
                  id={`${id}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={selected?.id === item.id}
                  tabIndex={-1}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(item)}
                  className={`w-full break-words rounded-md px-3 py-2 text-left text-sm text-slate-900 hover:bg-brand-50 ${activeIndex === index ? 'bg-brand-50 ring-1 ring-inset ring-brand-300' : ''}`}
                >
                  {item.name} · {item.sku}{!item.active && !activeOnly ? ' (inactivo)' : ''}
                </button>
              </li>
            ))}
          </ul>
          {results.hasMore && !busy && <button type="button" disabled={disabled} onClick={() => void loadMore()} className={SECONDARY_BUTTON_CLASS}>Más productos</button>}
        </div>
      )}
      <div id={`${id}-feedback`}>
        {error ? <ErrorState error={error} onRetry={disabled ? undefined : () => setRevision((value) => value + 1)} />
          : busy && expanded ? <p role="status" className="text-sm text-slate-500">Buscando productos…</p>
          : expanded && !selected && !results.items.length ? <p role="status" className="text-sm text-slate-600">{emptyMessage}</p>
          : selected ? <p role="status" className="sr-only">Seleccionado: {selected.name} · {selected.sku}</p> : null}
      </div>
    </div>
  );
}
