import { Can } from '../../../components/guards/Can';
import { Notification } from '../../../components/notifications/Notification';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { EmptyState } from '../../../components/feedback/EmptyState';
import {
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
} from '../../../utils/formStyles';
import { InboundItemFields, RemoveDraftButton } from '../components/InboundItemFields';
import { newDraft } from '../hardwareDraft';
import { useHardwareInbound } from '../hooks/useHardwareInbound';

export function HardwareInboundPage() {
  return (
    <Can roles={['ADMIN']}>
      <InboundForm />
    </Can>
  );
}

function InboundForm() {
  const {
    locations,
    loading,
    locationId,
    setLocationId,
    items,
    setItems,
    busy,
    error,
    review,
    setReview,
    created,
    setLoading,
    setLoadRevision,
    update,
    prepare,
    confirm,
  } = useHardwareInbound();

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-slate-900">Ingresar equipos y piezas</h2>
        <p className="mt-1 text-sm text-slate-500">
          Registra equipos, piezas y sus componentes.
        </p>
      </header>

      {error && <Notification kind="error">{error}</Notification>}

      {loading ? (
        <LoadingState message="Cargando ubicaciones..." />
      ) : !locations.length ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <EmptyState message="No hay ubicaciones activas disponibles. Crea o activa una ubicación para registrar ingresos." />
          <button
            className={SECONDARY_BUTTON_CLASS}
            onClick={() => {
              setLoading(true);
              setLoadRevision((value) => value + 1);
            }}
          >
            Reintentar cargar ubicaciones
          </button>
        </div>
      ) : null}

      {created.length > 0 && (
        <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <Notification kind="success">Ingreso registrado correctamente.</Notification>
          <div>
            <h3 className="font-semibold text-slate-900">Equipos registrados</h3>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
              {created.map((item) => (
                <li key={item.id}>
                  {item.serialNumber}
                  {item.components?.length ? ` — ${item.components.length} componentes` : ''}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {review ? (
        <section className="space-y-4 rounded-xl border border-brand-200 bg-white p-4 sm:p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Confirmar ingreso</h3>
            <p className="mt-1 text-sm text-slate-500">
              Revisa los equipos antes de confirmar.
            </p>
          </div>
          <dl className="grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Ubicación</dt>
              <dd className="font-medium text-slate-900">
                {locations.find((location) => location.id === review.locationId)?.name}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Equipos</dt>
              <dd className="font-medium text-slate-900">{review.items.length}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Componentes</dt>
              <dd className="font-medium text-slate-900">
                {review.items.reduce((sum, item) => sum + (item.children?.length ?? 0), 0)}
              </dd>
            </div>
          </dl>
          <ul className="divide-y divide-slate-100">
            {review.items.map((item, index) => (
              <li key={index} className="py-2 text-sm text-slate-700">
                Equipo {index + 1} — {item.serialNumber ?? 'Sin serie: se asignará un código'}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} className={PRIMARY_BUTTON_CLASS} onClick={() => void confirm()}>
              {busy ? 'Guardando...' : 'Confirmar ingreso'}
            </button>
            <button
              disabled={busy}
              className={SECONDARY_BUTTON_CLASS}
              onClick={() => setReview(null)}
            >
              Volver a editar
            </button>
          </div>
        </section>
      ) : null}
        <form hidden={review !== null} onSubmit={(event) => void prepare(event)} noValidate className="space-y-5">
          <fieldset disabled={busy || loading || review !== null} className="space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <h3 className="font-semibold text-slate-900">Ubicación inicial</h3>
              <p className="mt-1 text-sm text-slate-500">
                Todos los equipos del ingreso se registran en esta ubicación activa.
              </p>
              <div className="mt-4 max-w-md">
                <label htmlFor="inbound-location" className={LABEL_CLASS}>
                  Ubicación inicial
                </label>
                <select
                  id="inbound-location"
                  aria-label="Ubicación inicial"
                  value={locationId}
                  onChange={(event) => setLocationId(event.target.value)}
                  className={TEXT_INPUT_CLASS}
                >
                  <option value="">Seleccionar ubicación</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <div className="space-y-4">
              {items.map((item, index) => (
                <article
                  key={item.draftId}
                  className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">Equipo {index + 1}</h3>
                      <p className="text-sm text-slate-500">
                        Producto con serie, serie y precios opcionales.
                      </p>
                    </div>
                    <RemoveDraftButton
                      onClick={() => setItems((all) => all.filter((_, position) => position !== index))}
                    />
                  </div>

                  <InboundItemFields
                    id={`inbound-item-${index}`}
                    label={`Equipo ${index + 1}`}
                    showLegend={false}
                    value={item}
                    onChange={(next) => update(index, next)}
                  />

                  <div className="mt-4 space-y-3 border-l-2 border-slate-200 pl-4">
                    <h4 className="text-sm font-semibold text-slate-900">Componentes internos</h4>
                    {item.children.map((child, childIndex) => (
                      <div
                        key={child.draftId}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900">
                            Componente {childIndex + 1}
                          </p>
                          <RemoveDraftButton
                            onClick={() =>
                              update(index, {
                                ...item,
                                children: item.children.filter(
                                  (_, position) => position !== childIndex,
                                ),
                              })
                            }
                          />
                        </div>
                        <InboundItemFields
                          id={`inbound-item-${index}-child-${childIndex}`}
                          label={`Equipo ${index + 1} componente ${childIndex + 1}`}
                          showLegend={false}
                          value={child}
                          onChange={(next) =>
                            update(index, {
                              ...item,
                              children: item.children.map((entry, position) =>
                                position === childIndex ? next : entry,
                              ),
                            })
                          }
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      className={SECONDARY_BUTTON_CLASS}
                      onClick={() =>
                        update(index, { ...item, children: [...item.children, newDraft()] })
                      }
                    >
                      Añadir componente al equipo {index + 1}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={SECONDARY_BUTTON_CLASS}
                onClick={() => setItems((all) => [...all, newDraft()])}
              >
                Añadir equipo
              </button>
              <button className={PRIMARY_BUTTON_CLASS}>
                {busy ? 'Validando...' : 'Revisar ingreso'}
              </button>
            </div>
          </fieldset>
        </form>
    </section>
  );
}
