import { useEffect, useState, type FormEvent } from 'react';
import { asAppError } from '../../../services/api/errors';
import {
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
} from '../../../utils/formStyles';
import { listActiveLocations } from '../../foundation/locations/services/locationService';
import type { Location } from '../../foundation/locations/models';
import { approveUsedItem } from '../services/hardwareItemService';

interface ApproveUsedItemModalProps {
  hardwareItemId: string;
  serialNumber: string;
  brand?: string;
  model?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApproveUsedItemModal({
  hardwareItemId,
  serialNumber,
  brand,
  model,
  onClose,
  onSuccess,
}: ApproveUsedItemModalProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void listActiveLocations().then((locs) => {
      if (active) {
        setLocations(locs);
        if (locs.length > 0) setLocationId(locs[0].id);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!locationId) {
      setError('Selecciona una ubicación activa.');
      return;
    }
    const priceNum = Number(salePrice);
    if (!salePrice.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      setError('El precio de venta debe ser un número mayor o igual a 0.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // NOTE: Uses itemId, NOT hardwareItemId
      await approveUsedItem({
        itemId: hardwareItemId,
        locationId,
        salePrice: priceNum,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(asAppError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approve-used-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <header className="mb-4">
          <h3 id="approve-used-title" className="text-lg font-semibold text-slate-900">
            Aprobar Pieza de Segunda Mano
          </h3>
          <p className="text-sm text-slate-600">
            {brand && model ? `${brand} ${model} — ` : ''}
            <span className="font-mono font-medium">Serie: {serialNumber}</span>
          </p>
        </header>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="approve-location" className={LABEL_CLASS}>
              Ubicación de destino <span className="text-red-500">*</span>
            </label>
            <select
              id="approve-location"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              disabled={submitting}
              className={TEXT_INPUT_CLASS}
              required
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="approve-price" className={LABEL_CLASS}>
              Precio de venta establecido (S/) <span className="text-red-500">*</span>
            </label>
            <input
              id="approve-price"
              type="number"
              min="0"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              disabled={submitting}
              placeholder="0.00"
              className={TEXT_INPUT_CLASS}
              required
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className={SECONDARY_BUTTON_CLASS}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`${PRIMARY_BUTTON_CLASS} bg-emerald-600 hover:bg-emerald-700`}
            >
              {submitting ? 'Aprobando…' : 'Aprobar e Ingresar a Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
