import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { Can } from '../../../components/guards/Can';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { Notification } from '../../../components/notifications/Notification';
import { listLocations } from '../../foundation/locations/services/locationService';
import type { Location } from '../../foundation/locations/models';
import { asAppError } from '../../../services/api/errors';
import { LABEL_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import { formatDate } from '../../../utils/formatDate';
import { ROUTES } from '../../../router/routes';
import { TRANSFER_EXECUTOR_ROLES } from '../permissions';
import { useTransferHistory } from '../hooks/useTransferHistory';

export function TransferHistoryPage() {
  const history = useTransferHistory();
  const user = useAuthStore((state) => state.user);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [referenceRevision, setReferenceRevision] = useState(0);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);
  const navigate = useNavigate();

  function changeDates(start: string, end: string) {
    setStartDate(start);
    setEndDate(end);
    if (start && end && start > end) {
      setDateError('La fecha inicial debe ser anterior o igual a la final.');
      return;
    }
    setDateError(null);
    history.setQuery((query) => ({
      ...query,
      startDate: start ? new Date(`${start}T00:00:00`).toISOString() : undefined,
      endDate: end ? new Date(`${end}T23:59:59.999`).toISOString() : undefined,
    }));
  }

  useEffect(() => {
    if (history.scoped) return;
    let active = true;
    void listLocations()
      .then((data) => {
        if (active) {
          setLocations(data);
          setLocationError(null);
        }
      })
      .catch((failure: unknown) => {
        if (active) setLocationError(asAppError(failure).message);
      });
    return () => { active = false; };
  }, [history.scoped, referenceRevision]);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Traslados</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Historial de envíos a puestos y devoluciones al almacén.
          </p>
        </div>
        <Can roles={TRANSFER_EXECUTOR_ROLES}>
          <Link className={PRIMARY_BUTTON_CLASS} to={ROUTES.logisticsNew}>
            Nuevo traslado
          </Link>
        </Can>
      </header>

      {history.missingLocation ? (
        <Notification kind="warning">
          No tienes un puesto asignado. Solicita su asignación al administrador para consultar los traslados.
        </Notification>
      ) : (
        <>
          {history.scoped && (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-700">
              Mostrando traslados de tu puesto: <span className="text-slate-900">{user?.locationName ?? 'Puesto asignado'}</span>
            </p>
          )}

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!code.trim()) {
                    setCodeError('Introduce el código de la guía.');
                    return;
                  }
                  setCodeError(null);
                  navigate(`${ROUTES.logistics}/${encodeURIComponent(code.trim())}`);
                }}
                className="flex min-w-0 flex-1 items-end gap-2"
              >
                <div className="min-w-0 flex-1">
                  <label htmlFor="transfer-code" className={LABEL_CLASS}>
                    Buscar guía por código
                  </label>
                  <input
                    id="transfer-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="Ej. TR-000001"
                    className={TEXT_INPUT_CLASS}
                    autoComplete="off"
                  />
                </div>
                <button className={SECONDARY_BUTTON_CLASS}>Buscar guía</button>
              </form>

              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {!history.scoped && (
                  <div>
                    <label htmlFor="transfer-location" className={LABEL_CLASS}>
                      Ubicación de la guía
                    </label>
                    <select
                      id="transfer-location"
                      className={TEXT_INPUT_CLASS}
                      value={history.query.locationId ?? ''}
                      onChange={(event) =>
                        history.setQuery((query) => ({
                          ...query,
                          locationId: event.target.value || undefined,
                        }))
                      }
                    >
                      <option value="">Todas las ubicaciones</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                          {location.active ? '' : ' (inactiva)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label htmlFor="transfer-start" className={LABEL_CLASS}>
                    Desde
                  </label>
                  <input
                    id="transfer-start"
                    type="date"
                    className={TEXT_INPUT_CLASS}
                    value={startDate}
                    onChange={(event) => changeDates(event.target.value, endDate)}
                  />
                </div>
                <div>
                  <label htmlFor="transfer-end" className={LABEL_CLASS}>
                    Hasta
                  </label>
                  <input
                    id="transfer-end"
                    type="date"
                    className={TEXT_INPUT_CLASS}
                    value={endDate}
                    onChange={(event) => changeDates(startDate, event.target.value)}
                  />
                </div>
              </div>
            </div>

            {codeError && <Notification kind="error">{codeError}</Notification>}
            {locationError && (
              <ErrorState
                error={locationError}
                onRetry={() => setReferenceRevision((value) => value + 1)}
              />
            )}
            {dateError && <Notification kind="error">{dateError}</Notification>}

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                className={SECONDARY_BUTTON_CLASS}
                onClick={history.reload}
                disabled={history.loading}
              >
                Actualizar guías
              </button>
              <button
                type="button"
                className={SECONDARY_BUTTON_CLASS}
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setDateError(null);
                  history.setQuery({});
                }}
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {history.loading ? (
            <LoadingState message="Cargando guías…" />
          ) : history.error ? (
            <ErrorState error={history.error} onRetry={history.reload} />
          ) : !history.rows.length ? (
            <EmptyState message="No hay guías para estos filtros." />
          ) : (
            <div
              role="region"
              aria-label="Historial de traslados"
              tabIndex={0}
              className="overflow-x-auto rounded-xl border border-slate-200 bg-white"
            >
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Guía', 'Origen', 'Destino', 'Responsable', 'Fecha', 'Contenido', 'Acciones'].map(
                      (title) => (
                        <th
                          key={title}
                          scope="col"
                          className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                        >
                          {title}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.rows.map((row) => {
                    const isIncoming = history.scoped && user?.locationId === row.toLocationId;
                    const isOutgoing = history.scoped && user?.locationId === row.fromLocationId;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs font-semibold text-slate-900">
                          {row.code}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {row.fromLocationName ?? 'Ubicación no disponible'}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-medium text-slate-900">
                              {row.toLocationName ?? 'Ubicación no disponible'}
                            </span>
                            {isIncoming && (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                Recibido
                              </span>
                            )}
                            {isOutgoing && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                                Devuelto
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {row.createdByName ?? 'Sin nombre disponible'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                          {formatDate(row.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate-700">
                          {row.itemsCount} {row.itemsCount === 1 ? 'línea' : 'líneas'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <Link
                            className={SECONDARY_BUTTON_CLASS}
                            to={`${ROUTES.logistics}/${encodeURIComponent(row.id)}`}
                          >
                            Ver guía {row.code}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
