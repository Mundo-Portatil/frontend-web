import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { Notification } from '../../../components/notifications/Notification';
import { asAppError, type AppError } from '../../../services/api/errors';
import { SECONDARY_BUTTON_CLASS } from '../../../utils/formStyles';
import { formatDate } from '../../../utils/formatDate';
import { ROUTES } from '../../../router/routes';
import { getTransferDetail } from '../services/transferService';
import type { TransferDetail } from '../models';

export function TransferDetailPage() {
  const { id = '' } = useParams();
  const user = useAuthStore((state) => state.user);
  const restricted = user?.role === 'VENDEDOR' || user?.role === 'TECNICO';
  const missingLocation = restricted && !user?.locationId;
  const [detail, setDetail] = useState<TransferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [revision, setRevision] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const requestKey = JSON.stringify([id, user?.id, user?.role, user?.locationId, revision]);
  useEffect(() => {
    if (!user || missingLocation) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null); setDetail(null);
    void getTransferDetail(id, controller.signal).then((data) => { if (!controller.signal.aborted) setDetail(data); }).catch((failure: unknown) => { if (!controller.signal.aborted) setError(asAppError(failure)); }).finally(() => { if (!controller.signal.aborted) { setLoadedKey(requestKey); setLoading(false); } });
    return () => controller.abort();
  }, [id, user, missingLocation, revision, requestKey]);
  return <section className="mx-auto w-full max-w-5xl space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold text-slate-900">Detalle de guía</h1><Link to={ROUTES.logistics} className={SECONDARY_BUTTON_CLASS}>Volver a guías</Link></header>
    {missingLocation ? <Notification kind="warning">No tienes un puesto asignado. Solicita su asignación al administrador para consultar las guías.</Notification> : loading || loadedKey !== requestKey ? <LoadingState message="Cargando guía…" /> : error ? <ErrorState error={error.status === 403 ? 'No tienes acceso a esta guía.' : error} onRetry={error.status === 403 || error.status === 404 ? undefined : () => setRevision((value) => value + 1)} /> : detail && <>
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-semibold">{detail.code}</h2><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">Completado</span></div><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Origen</dt><dd className="font-medium">{detail.fromLocationName ?? 'Ubicación no disponible'}</dd></div><div><dt className="text-slate-500">Destino</dt><dd className="font-medium">{detail.toLocationName ?? 'Ubicación no disponible'}</dd></div><div><dt className="text-slate-500">Responsable</dt><dd>{detail.createdByName ?? 'Sin nombre disponible'}</dd></div><div><dt className="text-slate-500">Fecha</dt><dd>{formatDate(detail.createdAt)}</dd></div>{detail.notes && <div className="min-w-0 sm:col-span-2"><dt className="text-slate-500">Observaciones</dt><dd className="whitespace-pre-wrap break-words">{detail.notes}</dd></div>}</dl></section>
      <div role="region" aria-label="Contenido de la guía" tabIndex={0} className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="bg-slate-50"><tr>{['Producto', 'Código de producto', 'Serie', 'Cantidad'].map((label) => <th key={label} scope="col" className="px-3 py-2 text-left font-medium text-slate-600">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{detail.items.map((item) => <tr key={item.id}><td className="px-3 py-3">{[item.brand, item.model].filter(Boolean).join(' ') || 'Producto'}</td><td className="px-3 py-3">{item.sku ?? 'No disponible'}</td><td className="break-all px-3 py-3">{item.serialNumber ?? 'Por cantidad'}</td><td className="px-3 py-3 tabular-nums">{item.quantity}</td></tr>)}</tbody></table></div>
    </>}
  </section>;
}
