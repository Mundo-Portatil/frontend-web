import { useState, type FormEvent } from 'react';
import { CatalogProductPicker, getAvailableSerials, type AvailableSerialItem, type CatalogItem, type HardwareItem } from '../../inventory';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import { LABEL_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import { useOriginAvailability, useSerializedLookup } from '../hooks/useTransferResources';
import type { QuantityLine } from '../draftModels';

export function QuantityItemPicker({
  originId,
  onAdd,
  existing,
}: {
  originId: string;
  onAdd: (line: QuantityLine) => void;
  existing: QuantityLine[];
}) {
  const [catalog, setCatalog] = useState<CatalogItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [revision, setRevision] = useState(0);
  const available = useOriginAvailability(originId, catalog?.id ?? '', revision);
  const already = existing.find((line) => line.catalog.id === catalog?.id)?.quantity ?? 0;
  const valid =
    catalog &&
    !catalog.isSerialized &&
    Number.isInteger(quantity) &&
    quantity > 0 &&
    available.quantity !== null &&
    quantity + already <= available.quantity;

  return (
    <section
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
      aria-label="Agregar productos por cantidad"
    >
      <h2 className="text-base font-semibold text-slate-900">Productos por cantidad</h2>
      <CatalogProductPicker
        id="transfer-product"
        serialized={false}
        onChange={() => setCatalog(null)}
        onSelect={setCatalog}
      />
      <div className="flex flex-wrap items-end gap-2">
        <label className="w-36">
          <span className={LABEL_CLASS}>Cantidad a trasladar</span>
          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className={TEXT_INPUT_CLASS}
          />
        </label>
        <button
          type="button"
          className={PRIMARY_BUTTON_CLASS}
          disabled={!valid}
          onClick={() => {
            if (valid && catalog) {
              onAdd({ catalog, quantity, available: available.quantity });
              setQuantity(1);
            }
          }}
        >
          Agregar producto
        </button>
        {catalog && (
          <button
            type="button"
            className={SECONDARY_BUTTON_CLASS}
            onClick={() => setRevision((value) => value + 1)}
          >
            Consultar disponibilidad
          </button>
        )}
      </div>
      {catalog && (
        <p role="status" className="text-sm text-slate-600">
          {available.error ||
            (available.quantity === null
              ? 'Consultando disponibilidad…'
              : `Disponibles en origen: ${available.quantity}${already ? ` · En esta guía: ${already}` : ''}`)}
        </p>
      )}
    </section>
  );
}

export function SerializedItemPicker({
  originId,
  serials,
  onAdd,
  enabled,
}: {
  originId: string;
  serials: HardwareItem[];
  onAdd: (item: HardwareItem) => void;
  enabled: boolean;
}) {
  const [code, setCode] = useState('');
  const [catalog, setCatalog] = useState<CatalogItem | null>(null);
  const [availableSerials, setAvailableSerials] = useState<AvailableSerialItem[]>([]);
  const [loadingSerials, setLoadingSerials] = useState(false);
  const [selectedSerialId, setSelectedSerialId] = useState('');
  const lookup = useSerializedLookup();

  async function add(value: string) {
    const item = await lookup.find(value, originId, serials.map((unit) => unit.id));
    if (item) {
      onAdd(item);
      setCode('');
    }
  }

  useBarcodeScanner((value) => {
    void add(value);
  }, enabled && !lookup.loading);

  function submit(event: FormEvent) {
    event.preventDefault();
    void add(code);
  }

  async function handleSelectCatalog(selected: CatalogItem | null) {
    setCatalog(selected);
    setSelectedSerialId('');
    if (!selected) {
      setAvailableSerials([]);
      return;
    }
    setLoadingSerials(true);
    try {
      const items = await getAvailableSerials(selected.id, originId);
      setAvailableSerials(items);
    } catch {
      setAvailableSerials([]);
    } finally {
      setLoadingSerials(false);
    }
  }

  async function addFromCatalog() {
    if (!selectedSerialId) return;
    const found = availableSerials.find((s) => s.id === selectedSerialId);
    if (!found) return;
    await add(found.serialNumber);
    setSelectedSerialId('');
  }

  const existingIds = new Set(serials.map((s) => s.id));
  const unselectedAvailable = availableSerials.filter((s) => !existingIds.has(s.id));

  return (
    <section
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
      aria-label="Agregar productos con número de serie"
    >
      <h2 className="text-base font-semibold text-slate-900">Productos con número de serie</h2>

      <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
        <label className="min-w-48 flex-1">
          <span className={LABEL_CLASS}>Serie o código de unidad (escáner o teclado)</span>
          <input
            className={TEXT_INPUT_CLASS}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="off"
            placeholder="Escanea o escribe el número de serie"
          />
        </label>
        <button className={SECONDARY_BUTTON_CLASS} disabled={lookup.loading || !code.trim()}>
          {lookup.loading ? 'Buscando…' : 'Agregar unidad'}
        </button>
      </form>

      <div className="space-y-3 border-t border-slate-100 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          O buscar por producto
        </p>
        <CatalogProductPicker
          id="transfer-serialized-catalog"
          serialized={true}
          onChange={() => handleSelectCatalog(null)}
          onSelect={handleSelectCatalog}
        />
        {catalog && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-48 flex-1">
              <span className={LABEL_CLASS}>
                Series disponibles en origen ({unselectedAvailable.length})
              </span>
              <select
                className={TEXT_INPUT_CLASS}
                value={selectedSerialId}
                onChange={(e) => setSelectedSerialId(e.target.value)}
                disabled={loadingSerials || unselectedAvailable.length === 0}
              >
                <option value="">
                  {loadingSerials
                    ? 'Cargando series…'
                    : unselectedAvailable.length === 0
                      ? 'Sin unidades disponibles en origen'
                      : 'Selecciona una serie'}
                </option>
                {unselectedAvailable.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.serialNumber}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={PRIMARY_BUTTON_CLASS}
              disabled={!selectedSerialId || lookup.loading}
              onClick={addFromCatalog}
            >
              Agregar seleccionada
            </button>
          </div>
        )}
      </div>

      {lookup.error && (
        <p role="alert" className="text-sm text-red-700">
          {lookup.error}
        </p>
      )}
    </section>
  );
}
