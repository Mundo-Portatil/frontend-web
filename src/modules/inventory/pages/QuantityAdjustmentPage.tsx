import { useEffect, useState } from 'react';
import { Can } from '../../../components/guards/Can';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Notification } from '../../../components/notifications/Notification';
import { asAppError, type AppError } from '../../../services/api/errors';
import { listActiveLocations } from '../../foundation/locations/services/locationService';
import type { Location } from '../../foundation/locations/models';
import { QuantityStockForm } from '../components/QuantityStockForm';
import type { QuantityStock } from '../quantityModels';

export function QuantityAdjustmentPage() {
  return <Can roles={['ADMIN', 'ENCARGADO_ALMACEN']}><AdjustmentForm /></Can>;
}

function AdjustmentForm() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [revision, setRevision] = useState(0);
  const [saved, setSaved] = useState<QuantityStock | null>(null);
  useEffect(() => {
    let current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    void listActiveLocations().then((items) => { if (current) setLocations(items); })
      .catch((failure: unknown) => { if (current) setError(asAppError(failure)); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [revision]);
  if (loading) return <LoadingState message="Cargando ubicaciones…" />;
  if (error) return <ErrorState error={error} onRetry={() => setRevision((value) => value + 1)} />;
  return <section className="space-y-4">
    {saved && <Notification kind="success">Conteo actualizado: {saved.quantity} unidades de {saved.catalogName ?? 'producto seleccionado'} en {saved.locationName ?? 'ubicación seleccionada'}.</Notification>}
    <QuantityStockForm locations={locations} operation="adjust" onSaved={setSaved} />
  </section>;
}
