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
  const userId = user?.id;
  const userRole = user?.role;
  const userLocationId = user?.locationId;
  const restricted = userRole === 'VENDEDOR' || userRole === 'TECNICO';
  const missingLocation = restricted && !userLocationId;
  const [detail, setDetail] = useState<TransferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [revision, setRevision] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const requestKey = JSON.stringify([id, userId, userRole, userLocationId, revision]);

  useEffect(() => {
    if (!userId || missingLocation) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    setDetail(null);
    void getTransferDetail(id, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setDetail(data);
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) setError(asAppError(failure));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadedKey(requestKey);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [id, userId, missingLocation, requestKey]);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Detalle de guía</h1>
          <p className="mt-0.5 text-sm text-slate-600">Comprobante de traslado en solo lectura.</p>
        </div>
        <Link to={ROUTES.logistics} className={SECONDARY_BUTTON_CLASS}>
          Volver a traslados
        </Link>
      </header>

      {missingLocation ? (
        <Notification kind="warning">
          No tienes un puesto asignado. Solicita su asignación al administrador para consultar las guías.
        </Notification>
      ) : loading || loadedKey !== requestKey ? (
        <LoadingState message="Cargando guía…" />
      ) : error ? (
        <ErrorState
          error={error.status === 403 ? 'No tienes acceso a esta guía.' : error}
          onRetry={
            error.status === 403 || error.status === 404
              ? undefined
              : () => setRevision((value) => value + 1)
          }
        />
      ) : (
        detail && (
          <>
            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h2 className="font-mono text-lg font-semibold text-slate-900">{detail.code}</h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  Completado
                </span>
              </div>
              <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-slate-500">Origen</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">
                    {detail.fromLocationName ?? 'Ubicación no disponible'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Destino</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">
                    {detail.toLocationName ?? 'Ubicación no disponible'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Responsable</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {detail.createdByName ?? 'Sin nombre disponible'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Fecha</dt>
                  <dd className="mt-0.5 text-slate-900">{formatDate(detail.createdAt)}</dd>
                </div>
                {detail.notes && (
                  <div className="min-w-0 sm:col-span-2 lg:col-span-4">
                    <dt className="text-slate-500">Observaciones</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap break-words text-slate-800">
                      {detail.notes}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            <div
              role="region"
              aria-label="Contenido de la guía"
              tabIndex={0}
              className="overflow-x-auto rounded-xl border border-slate-200 bg-white"
            >
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Producto', 'Código de producto', 'Serie', 'Cantidad'].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detail.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2.5 font-medium text-slate-900">
                        {[item.brand, item.model].filter(Boolean).join(' ') || 'Producto'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{item.sku ?? 'No disponible'}</td>
                      <td className="break-all px-3 py-2.5 text-slate-700">
                        {item.serialNumber ?? 'Por cantidad'}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-slate-900">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      )}
    </section>
  );
}
