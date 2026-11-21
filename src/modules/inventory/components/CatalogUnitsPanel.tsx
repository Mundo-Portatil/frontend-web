import { useEffect, useState } from 'react';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { asAppError, type AppError } from '../../../services/api/errors';
import { formatDate } from '../../../utils/formatDate';
import { LABEL_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import { formatAuditAction } from '../../foundation/audit-logs/actionTranslations';
import { formatAuditModule } from '../../foundation/audit-logs/moduleTranslations';
import type { CatalogDetail } from '../catalogModels';
import type { ItemStatus } from '../hardwareModels';
import type { HardwareLifecycle, HardwareLifecycleEvent, HardwareListResult } from '../hardwareReadModels';
import { getHardwareLifecycle, listHardwareUnits } from '../services/hardwareReadService';

const STATUS_LABELS: Record<ItemStatus, string> = {
  EN_STOCK: 'En stock', VENDIDO: 'Vendido', SEGUNDA_MANO_PENDIENTE: 'Segunda mano pendiente',
  EN_GARANTIA: 'En garantía', DE_BAJA: 'De baja',
};
const DISCLOSURE_CLASS = 'w-fit cursor-pointer rounded text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';
type StockLocations = CatalogDetail['stockSummary'];

/** Both queries are mounted on demand; opening a product never preloads all its units. */
export function CatalogUnitsPanel({ catalogId, locations }: { catalogId: string; locations: StockLocations }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="min-w-0 rounded-lg border border-slate-200 p-3" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className={DISCLOSURE_CLASS}>Ver unidades</summary>
      {open && <UnitsList catalogId={catalogId} locations={locations} />}
    </details>
  );
}

function UnitsList({ catalogId, locations }: { catalogId: string; locations: StockLocations }) {
  const [locationId, setLocationId] = useState('');
  const [status, setStatus] = useState<ItemStatus | ''>('EN_STOCK');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<HardwareListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    void listHardwareUnits({ catalogItemId: catalogId, page, limit: 50, ...(locationId ? { locationId } : {}), ...(status ? { status } : {}) }, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setResult(data); })
      .catch((failure: unknown) => { if (!controller.signal.aborted) setError(asAppError(failure)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [catalogId, locationId, status, page, revision]);

  return (
    <section aria-label="Unidades del modelo" className="mt-3 min-w-0 space-y-3">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <label className="min-w-0"><span className={LABEL_CLASS}>Ubicación de las unidades</span><select value={locationId} onChange={(event) => { setLocationId(event.target.value); setPage(1); }} className={TEXT_INPUT_CLASS}><option value="">Todas las ubicaciones</option>{locations.map((place) => <option key={place.locationId} value={place.locationId}>{place.locationName}</option>)}</select></label>
        <label className="min-w-0"><span className={LABEL_CLASS}>Estado de las unidades</span><select value={status} onChange={(event) => { setStatus(event.target.value as ItemStatus | ''); setPage(1); }} className={TEXT_INPUT_CLASS}><option value="">Todos los estados</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      {error ? <ErrorState error={error} onRetry={() => setRevision((value) => value + 1)} /> : loading ? <LoadingState message="Cargando unidades…" /> : result && (
        <>
          {!result.items.length ? <EmptyState message="No hay unidades para estos filtros." /> : <ul className="divide-y divide-slate-100">
            {result.items.map((item) => (
              <li key={item.id} className="min-w-0 space-y-2 py-3">
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                  <p className="break-words text-sm font-semibold text-slate-900">Serie: {item.serialNumber}</p>
                  <span className="text-xs text-slate-600">{STATUS_LABELS[item.status]}</span>
                </div>
                <p className="break-words text-sm text-slate-600">{locations.find((place) => place.locationId === item.locationId)?.locationName ?? 'Ubicación no disponible'}</p>
                {item.parentChassisId && <p className="text-xs text-slate-500">Componente asociado a un equipo.</p>}
                {item.components?.length ? <div><p className="text-xs font-medium text-slate-600">Componentes del equipo</p><ul className="ml-3 list-inside list-disc text-sm text-slate-700">{item.components.map((child) => <li key={child.id} className="break-words">{child.serialNumber} · {STATUS_LABELS[child.status]}</li>)}</ul></div> : null}
                <UnitHistory id={item.id} serial={item.serialNumber} />
              </li>
            ))}
          </ul>}
          <nav aria-label="Paginación de unidades" className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-slate-600">Página {result.page} · {result.total} unidades</p>
            <div className="flex gap-2"><button type="button" disabled={result.page <= 1} onClick={() => setPage(result.page - 1)} className={SECONDARY_BUTTON_CLASS}>Unidades anteriores</button><button type="button" disabled={result.page * result.limit >= result.total} onClick={() => setPage(result.page + 1)} className={SECONDARY_BUTTON_CLASS}>Más unidades</button></div>
          </nav>
        </>
      )}
    </section>
  );
}

function UnitHistory({ id, serial }: { id: string; serial: string }) {
  const [open, setOpen] = useState(false);
  return <details onToggle={(event) => setOpen(event.currentTarget.open)} className="rounded border border-slate-100 p-2"><summary className={DISCLOSURE_CLASS}>Historial de {serial}</summary>{open && <HistoryEvents id={id} />}</details>;
}

function describeEvent(event: HardwareLifecycleEvent) {
  const payload = typeof event.payload === 'object' && event.payload !== null && !Array.isArray(event.payload) ? event.payload as Record<string, unknown> : {};
  return formatAuditAction({ id: event.id, action: event.action, module: event.module, payload, userId: event.userId ?? null, ipAddress: event.ipAddress ?? null, createdAt: event.timestamp });
}

function HistoryEvents({ id }: { id: string }) {
  const [history, setHistory] = useState<HardwareLifecycle | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    void getHardwareLifecycle(id, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setHistory(data); })
      .catch((failure: unknown) => { if (!controller.signal.aborted) setError(asAppError(failure)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, revision]);
  if (error) return <div className="mt-2"><ErrorState error={error} onRetry={() => setRevision((value) => value + 1)} /></div>;
  if (loading) return <LoadingState message="Cargando historial…" />;
  if (!history?.events.length) return <p className="mt-2 text-sm text-slate-500">Sin movimientos registrados.</p>;
  return <ol className="mt-2 space-y-3 border-l border-slate-200 pl-3">{history.events.map((event) => <li key={event.id} className="min-w-0 text-sm"><p className="break-words font-medium text-slate-900">{describeEvent(event)}</p><p className="break-words text-slate-600">{formatAuditModule(event.module)} · {event.userName ?? 'Usuario no disponible'}</p><time dateTime={event.timestamp} className="text-xs text-slate-500">{formatDate(event.timestamp)}</time></li>)}</ol>;
}
