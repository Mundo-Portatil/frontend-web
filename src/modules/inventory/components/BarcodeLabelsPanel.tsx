import { useState, type FormEvent } from 'react';
import { Notification } from '../../../components/notifications/Notification';
import { asAppError } from '../../../services/api/errors';
import {
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
} from '../../../utils/formStyles';
import { getBatchLabels } from '../services/barcodeLabelService';
import type { BarcodeLabel, HardwareItem } from '../hardwareModels';
import { isUuidV4 } from '../hardwareValidation';

export function BarcodeLabelsPanel({ hardwareItem }: { hardwareItem?: HardwareItem | null }) {
  const [ids, setIds] = useState('');
  const [busy, setBusy] = useState(false);
  const [labels, setLabels] = useState<BarcodeLabel[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setLabels(null);
    const values = [...new Set(ids.split(/[\s,]+/).filter(Boolean))];
    if (!values.length || values.some((id) => !isUuidV4(id))) {
      setError('Añade un equipo desde la búsqueda o revisa las referencias ingresadas.');
      return;
    }
    setBusy(true);
    try {
      setLabels(await getBatchLabels(values));
    } catch (failure) {
      setError(asAppError(failure).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <header>
        <h3 className="text-lg font-semibold text-slate-900">Etiquetas de equipos y piezas</h3>
        <p className="mt-1 text-sm text-slate-500">Vista previa; impresión aún no disponible.</p>
      </header>

      {error && <Notification kind="error">{error}</Notification>}

      {hardwareItem && (
        <button
          type="button"
          className={SECONDARY_BUTTON_CLASS}
          disabled={busy}
          onClick={() =>
            setIds((value) =>
              [...new Set([...value.split(/[\s,]+/).filter(Boolean), hardwareItem.id])].join('\n'),
            )
          }
        >
          Añadir {hardwareItem.serialNumber} a etiquetas
        </button>
      )}

      <form onSubmit={(event) => void submit(event)}>
        <p role="status" className="mb-3 text-sm text-slate-600">
          Equipos y piezas seleccionados: {new Set(ids.split(/[\s,]+/).filter(Boolean)).size}
        </p>
        <details className="rounded-lg border border-slate-200 p-3">
          <summary className="cursor-pointer rounded text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            Agregar referencias manualmente
          </summary>
        <label className="block">
          <span className={`${LABEL_CLASS} mt-3`}>Referencias para etiquetas</span>
          <textarea
            aria-label="Referencias para etiquetas"
            rows={3}
            value={ids}
            onChange={(event) => setIds(event.target.value)}
            disabled={busy}
            className={`${TEXT_INPUT_CLASS} h-24 max-h-24 max-w-full resize-none overflow-y-auto`}
            placeholder="Una referencia por línea…"
            spellCheck={false}
          />
        </label>
        </details>
        <button disabled={busy} className={`${PRIMARY_BUTTON_CLASS} mt-3`}>
          {busy ? 'Cargando…' : 'Ver etiquetas'}
        </button>
      </form>

      {labels?.length === 0 && (
        <p className="text-sm text-slate-500">No hay etiquetas disponibles.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {labels?.map((label) => (
          <article key={label.hardwareItemId} className="space-y-1 rounded-lg border border-slate-200 p-3">
            <h4 className="font-semibold text-slate-900">{label.title}</h4>
            <p className="break-all font-mono text-sm text-slate-700">{label.barcodeValue}</p>
            <p className="text-sm text-slate-600">{label.specsSummary}</p>
            <p className="text-sm text-slate-600">{label.locationName}</p>
            <p className="text-sm font-medium text-slate-900">
              Precio: {label.price ?? 'No definido'}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
