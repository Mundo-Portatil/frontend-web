import { Can } from '../../../components/guards/Can';
import { Notification } from '../../../components/notifications/Notification';
import {
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
} from '../../../utils/formStyles';
import { BarcodeLabelsPanel } from '../components/BarcodeLabelsPanel';
import { InventoryBadge, type BadgeTone } from '../components/InventoryBadge';
import { useHardwareScan } from '../hooks/useHardwareScan';
import type { ItemStatus } from '../hardwareModels';

const STATUS_LABELS: Record<ItemStatus, string> = {
  EN_STOCK: 'En stock',
  VENDIDO: 'Vendido',
  SEGUNDA_MANO_PENDIENTE: 'Segunda mano pendiente',
  EN_GARANTIA: 'En garantía',
  DE_BAJA: 'De baja',
};

const STATUS_TONE: Record<ItemStatus, BadgeTone> = {
  EN_STOCK: 'success',
  VENDIDO: 'neutral',
  SEGUNDA_MANO_PENDIENTE: 'warning',
  EN_GARANTIA: 'info',
  DE_BAJA: 'danger',
};

export function InventoryPage() {
  const {
    code,
    setCode,
    item,
    busy,
    mutating,
    error,
    message,
    childIds,
    setChildIds,
    search,
    attach,
    detach,
  } = useHardwareScan();

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-slate-900">Buscar equipo o pieza</h2>
        <p className="mt-1 text-sm text-slate-500">
          Escanea o escribe la serie para localizar un equipo o pieza.
        </p>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void search(code);
        }}
        className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className={LABEL_CLASS}>Serie o código</span>
            <input
              aria-label="Serie o código"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              disabled={mutating}
              className={TEXT_INPUT_CLASS}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button
            disabled={busy || mutating}
            className={`${PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}
          >
            {busy ? 'Buscando...' : 'Buscar equipo o pieza'}
          </button>
        </div>
      </form>

      {error && <Notification kind="error">{error}</Notification>}
      {message && <Notification kind="success">{message}</Notification>}

      {item && (
        <article className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-slate-900">
                {item.catalogName ?? 'Equipo o pieza'}
              </h3>
              <p className="mt-1 break-all text-sm text-slate-600">Serie: {item.serialNumber}</p>
            </div>
            <InventoryBadge tone={STATUS_TONE[item.status]}>
              {STATUS_LABELS[item.status]}
            </InventoryBadge>
          </header>

          <dl className="grid gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Ubicación</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {item.locationName ?? 'Ubicación no disponible'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Equipo al que pertenece</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {item.parentChassis?.serialNumber ?? (item.parentChassisId ? 'Equipo asociado' : 'Sin equipo asociado')}
              </dd>
            </div>
          </dl>

          <section aria-labelledby="hardware-components-heading" className="border-t border-slate-100 pt-4">
            <h4 id="hardware-components-heading" className="font-semibold text-slate-900">
              Componentes
            </h4>
            {!item.components?.length ? (
              <p className="mt-2 text-sm text-slate-500">Sin componentes asociados.</p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100">
                {item.components.map((child) => (
                  <li
                    key={child.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-2"
                  >
                    <span className="text-sm text-slate-700">
                      {child.serialNumber} — {STATUS_LABELS[child.status]}
                    </span>
                    <Can roles={['ADMIN']}>
                      <button
                        type="button"
                        disabled={mutating || busy}
                        className={SECONDARY_BUTTON_CLASS}
                        onClick={() => void detach(child)}
                      >
                        Desacoplar {child.serialNumber}
                      </button>
                    </Can>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Can roles={['ADMIN']}>
            <form
              onSubmit={(event) => void attach(event)}
              className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <div>
                <h4 className="font-semibold text-slate-900">Acoplar componentes</h4>
                <p className="mt-1 text-sm text-slate-600">
                  El equipo y las piezas deben estar disponibles en la misma ubicación.
                </p>
              </div>
              <label className="block">
                <span className={LABEL_CLASS}>Series de los componentes</span>
                <input
                  aria-label="Series de los componentes"
                  value={childIds}
                  onChange={(event) => setChildIds(event.target.value)}
                  disabled={mutating || busy}
                  className={TEXT_INPUT_CLASS}
                  autoComplete="off"
                  placeholder="Series separadas por comas…"
                  spellCheck={false}
                />
              </label>
              <button
                className={PRIMARY_BUTTON_CLASS}
                disabled={mutating || busy}
              >
                {mutating ? 'Guardando...' : 'Acoplar componentes'}
              </button>
            </form>
          </Can>
        </article>
      )}

      <BarcodeLabelsPanel hardwareItem={item} />
    </section>
  );
}
