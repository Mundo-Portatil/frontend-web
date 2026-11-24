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
  function changeDates(start: string, end: string) {
    setStartDate(start); setEndDate(end);
    if (start && end && start > end) {
      setDateError('La fecha inicial debe ser anterior o igual a la final.');
      return;
    }
    setDateError(null);
    history.setQuery((query) => ({ ...query,
      startDate: start ? new Date(`${start}T00:00:00`).toISOString() : undefined,
      endDate: end ? new Date(`${end}T23:59:59.999`).toISOString() : undefined,
    }));
  }
  const navigate = useNavigate();
  useEffect(() => {
    if (history.scoped) return;
    let active = true;
    void listLocations().then((data) => { if (active) { setLocations(data); setLocationError(null); } }).catch((failure: unknown) => { if (active) setLocationError(asAppError(failure).message); });
    return () => { active = false; };
  }, [history.scoped, referenceRevision]);
  return <section className="mx-auto w-full max-w-6xl space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold text-slate-900">Logística interna</h1><p className="mt-1 text-sm text-slate-600">Guías de distribución y devolución.</p></div><Can roles={TRANSFER_EXECUTOR_ROLES}><Link className={PRIMARY_BUTTON_CLASS} to={ROUTES.logisticsNew}>Nueva guía</Link></Can></header>
    {history.missingLocation ? <Notification kind="warning">No tienes un puesto asignado. Solicita su asignación al administrador para consultar las guías.</Notification> : <>
      {history.scoped && <p className="text-sm font-medium text-slate-700">Guías de {user?.locationName ?? 'tu puesto asignado'}</p>}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <form onSubmit={(event) => { event.preventDefault(); if (!code.trim()) { setCodeError('Introduce el código de la guía.'); return; } setCodeError(null); navigate(`${ROUTES.logistics}/${encodeURIComponent(code.trim())}`); }} className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end"><div className="min-w-0 flex-1"><label htmlFor="transfer-code" className={LABEL_CLASS}>Buscar guía por código</label><input id="transfer-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="TR-…" className={TEXT_INPUT_CLASS} autoComplete="off" /></div><button className={SECONDARY_BUTTON_CLASS}>Buscar guía</button></form>
        {codeError && <Notification kind="error">{codeError}</Notification>}
        {locationError && <ErrorState error={locationError} onRetry={() => setReferenceRevision((value) => value + 1)} />}
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {!history.scoped && <div><label htmlFor="transfer-location" className={LABEL_CLASS}>Ubicación de la guía</label><select id="transfer-location" className={TEXT_INPUT_CLASS} value={history.query.locationId ?? ''} onChange={(event) => history.setQuery((query) => ({ ...query, locationId: event.target.value || undefined }))}><option value="">Todas las ubicaciones</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}{location.active ? '' : ' (inactiva)'}</option>)}</select></div>}
          <div><label htmlFor="transfer-start" className={LABEL_CLASS}>Desde</label><input id="transfer-start" type="date" className={TEXT_INPUT_CLASS} value={startDate} onChange={(event) => changeDates(event.target.value, endDate)} /></div>
          <div><label htmlFor="transfer-end" className={LABEL_CLASS}>Hasta</label><input id="transfer-end" type="date" className={TEXT_INPUT_CLASS} value={endDate} onChange={(event) => changeDates(startDate, event.target.value)} /></div>
        </div>
        {dateError && <Notification kind="error">{dateError}</Notification>}
        <div className="flex flex-wrap gap-2"><button className={SECONDARY_BUTTON_CLASS} onClick={history.reload} disabled={history.loading}>Actualizar guías</button><button className={SECONDARY_BUTTON_CLASS} onClick={() => { setStartDate(''); setEndDate(''); setDateError(null); history.setQuery({}); }}>Limpiar filtros</button></div>
      </div>
      {history.loading ? <LoadingState message="Cargando guías…" /> : history.error ? <ErrorState error={history.error} onRetry={history.reload} /> : !history.rows.length ? <EmptyState message="No hay guías para estos filtros." /> : <div role="region" aria-label="Historial de guías" tabIndex={0} className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="bg-slate-50"><tr>{['Guía', 'Origen', 'Destino', 'Responsable', 'Fecha', 'Contenido', 'Acciones'].map((title) => <th key={title} scope="col" className="px-3 py-2 text-left font-medium text-slate-600">{title}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{history.rows.map((row) => <tr key={row.id}><td className="px-3 py-3 font-medium">{row.code}</td><td className="px-3 py-3">{row.fromLocationName ?? 'Ubicación no disponible'}</td><td className="px-3 py-3">{row.toLocationName ?? 'Ubicación no disponible'}</td><td className="px-3 py-3">{row.createdByName ?? 'Sin nombre disponible'}</td><td className="px-3 py-3">{formatDate(row.createdAt)}</td><td className="px-3 py-3">{row.itemsCount} líneas</td><td className="px-3 py-3"><Link className={SECONDARY_BUTTON_CLASS} to={`${ROUTES.logistics}/${encodeURIComponent(row.id)}`}>Ver guía {row.code}</Link></td></tr>)}</tbody></table></div>}
    </>}
  </section>;
}
