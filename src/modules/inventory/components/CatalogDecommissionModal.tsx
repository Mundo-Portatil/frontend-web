import { useEffect, useState, type FormEvent } from 'react';
import { asAppError } from '../../../services/api/errors';
import {
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
} from '../../../utils/formStyles';
import type { CatalogItem } from '../catalogModels';
import type { AvailableSerial, QuantityStockItem } from '../models';
import { setCatalogActive } from '../services/catalogService';
import { decommissionHardwareItem, getAvailableSerials } from '../services/hardwareItemService';
import { adjustQuantityStock, listQuantityStock } from '../services/quantityStockService';

interface CatalogDecommissionModalProps {
  item: CatalogItem;
  onClose: () => void;
  onSuccess: () => void;
}

export function CatalogDecommissionModal({
  item,
  onClose,
  onSuccess,
}: CatalogDecommissionModalProps) {
  const [activeTab, setActiveTab] = useState<'decommission_units' | 'deactivate_model'>(
    item.isSerialized ? 'decommission_units' : 'decommission_units',
  );

  // Decommission serial state
  const [serials, setSerials] = useState<AvailableSerial[]>([]);
  const [loadingSerials, setLoadingSerials] = useState<boolean>(false);
  const [selectedSerialId, setSelectedSerialId] = useState<string>('');
  const [serialReason, setSerialReason] = useState<string>('');

  // Decommission quantity stock state
  const [stockItems, setStockItems] = useState<QuantityStockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState<boolean>(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [newQuantity, setNewQuantity] = useState<string>('');
  const [stockReason, setStockReason] = useState<string>('');

  // General state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (item.isSerialized) {
      setLoadingSerials(true);
      void getAvailableSerials({ catalogId: item.id })
        .then((res) => {
          if (mounted) {
            setSerials(res);
            if (res.length > 0) setSelectedSerialId(res[0].id);
          }
        })
        .catch((e) => {
          if (mounted) setError(asAppError(e).message);
        })
        .finally(() => {
          if (mounted) setLoadingSerials(false);
        });
    } else {
      setLoadingStock(true);
      void listQuantityStock({ limit: 50 })
        .then((res) => {
          if (mounted) {
            const matches = res.items.filter((s) => s.catalogId === item.id && s.quantity > 0);
            setStockItems(matches);
            if (matches.length > 0) {
              setSelectedLocationId(matches[0].locationId);
              setNewQuantity(String(Math.max(0, matches[0].quantity - 1)));
            }
          }
        })
        .catch((e) => {
          if (mounted) setError(asAppError(e).message);
        })
        .finally(() => {
          if (mounted) setLoadingStock(false);
        });
    }

    return () => {
      mounted = false;
    };
  }, [item.id, item.isSerialized]);

  const handleDecommissionSerial = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSerialId) {
      setError('Seleccione una serie a dar de baja.');
      return;
    }
    if (!serialReason.trim()) {
      setError('El motivo de la baja es obligatorio.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await decommissionHardwareItem(selectedSerialId, serialReason.trim());
      onSuccess();
      onClose();
    } catch (err) {
      setError(asAppError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustStock = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedLocationId) {
      setError('Seleccione una ubicación.');
      return;
    }
    const qty = Number(newQuantity);
    if (!Number.isInteger(qty) || qty < 0) {
      setError('La nueva cantidad debe ser un entero mayor o igual a 0.');
      return;
    }
    if (!stockReason.trim()) {
      setError('El motivo del ajuste/baja es obligatorio.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await adjustQuantityStock({
        catalogId: item.id,
        locationId: selectedLocationId,
        newQuantity: qty,
        reason: stockReason.trim(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(asAppError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActiveModel = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await setCatalogActive(item.id, !item.active);
      onSuccess();
      onClose();
    } catch (err) {
      setError(asAppError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStockLocation = stockItems.find((s) => s.locationId === selectedLocationId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="decommission-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
        <header className="border-b border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="decommission-modal-title" className="text-lg font-semibold text-slate-900">
                Dar de Baja / Desactivar
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {item.brand} {item.model} — Cód. Etiqueta: <span className="font-mono">{item.sku}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('decommission_units');
                setError(null);
              }}
              className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'decommission_units'
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Baja de Unidades Físicas
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('deactivate_model');
                setError(null);
              }}
              className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'deactivate_model'
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Desactivar Modelo de Catálogo
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {activeTab === 'decommission_units' ? (
            item.isSerialized ? (
              <form onSubmit={handleDecommissionSerial} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Seleccione el número de serie en stock que saldrá de inventario por daño, obsolescencia o baja definitiva.
                </p>

                {loadingSerials ? (
                  <p className="text-center text-xs text-slate-400 py-3">Cargando series disponibles…</p>
                ) : serials.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                    No hay series activas en stock para este producto.
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="decommission-serial-select" className={LABEL_CLASS}>
                        Número de serie en stock <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="decommission-serial-select"
                        value={selectedSerialId}
                        onChange={(e) => setSelectedSerialId(e.target.value)}
                        className={TEXT_INPUT_CLASS}
                        disabled={submitting}
                        required
                      >
                        {serials.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.serialNumber} {s.salePrice !== null ? `(S/ ${s.salePrice.toFixed(2)})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="decommission-serial-reason" className={LABEL_CLASS}>
                        Motivo obligatorio de la baja <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="decommission-serial-reason"
                        rows={3}
                        value={serialReason}
                        onChange={(e) => setSerialReason(e.target.value)}
                        placeholder="Ej: Equipo dañado en transporte, falla irreparable en placa madre…"
                        className={`${TEXT_INPUT_CLASS} resize-none`}
                        disabled={submitting}
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className={SECONDARY_BUTTON_CLASS}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || serials.length === 0}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                      >
                        {submitting ? 'Procesando…' : 'Confirmar Baja de Serie'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            ) : (
              <form onSubmit={handleAdjustStock} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Para productos gestionados por cantidad, ajuste el saldo físico de existencias por merma o pérdida.
                </p>

                {loadingStock ? (
                  <p className="text-center text-xs text-slate-400 py-3">Cargando existencias por ubicación…</p>
                ) : stockItems.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                    No hay existencias registradas en ninguna ubicación para este producto.
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="decommission-location-select" className={LABEL_CLASS}>
                        Ubicación con stock <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="decommission-location-select"
                        value={selectedLocationId}
                        onChange={(e) => {
                          setSelectedLocationId(e.target.value);
                          const found = stockItems.find((s) => s.locationId === e.target.value);
                          if (found) setNewQuantity(String(Math.max(0, found.quantity - 1)));
                        }}
                        className={TEXT_INPUT_CLASS}
                        disabled={submitting}
                        required
                      >
                        {stockItems.map((s) => (
                          <option key={s.locationId} value={s.locationId}>
                            {s.locationName} (Stock actual: {s.quantity} uds.)
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedStockLocation && (
                      <p className="text-xs text-slate-500">
                        Cantidad actual en {selectedStockLocation.locationName}:{' '}
                        <span className="font-semibold">{selectedStockLocation.quantity} unidades</span>
                      </p>
                    )}

                    <div>
                      <label htmlFor="decommission-new-qty" className={LABEL_CLASS}>
                        Nueva cantidad total en almacén <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="decommission-new-qty"
                        type="number"
                        min="0"
                        step="1"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        className={TEXT_INPUT_CLASS}
                        disabled={submitting}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="decommission-stock-reason" className={LABEL_CLASS}>
                        Motivo obligatorio del ajuste / baja <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="decommission-stock-reason"
                        rows={3}
                        value={stockReason}
                        onChange={(e) => setStockReason(e.target.value)}
                        placeholder="Ej: Merma por rotura de empaque, desecho de piezas dañadas…"
                        className={`${TEXT_INPUT_CLASS} resize-none`}
                        disabled={submitting}
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className={SECONDARY_BUTTON_CLASS}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                      >
                        {submitting ? 'Ajustando…' : 'Confirmar Baja en Almacén'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-sm font-semibold text-slate-900">
                  Estado actual en catálogo:{' '}
                  <span className={item.active ? 'text-emerald-700' : 'text-slate-500'}>
                    {item.active ? 'Activo' : 'Dado de baja (Inactivo)'}
                  </span>
                </p>
                <p className="text-xs text-slate-600">
                  {item.active
                    ? 'Al dar de baja este modelo en el catálogo, no podrá seleccionarse para nuevas compras o ingresos al inventario. Los productos existentes en almacén conservan su historial.'
                    : 'Este modelo se encuentra actualmente dado de baja. Puede reactivarlo para permitir nuevos ingresos de mercadería.'}
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className={SECONDARY_BUTTON_CLASS}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => void handleToggleActiveModel()}
                  disabled={submitting}
                  className={
                    item.active
                      ? 'rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50'
                      : PRIMARY_BUTTON_CLASS
                  }
                >
                  {submitting
                    ? 'Actualizando…'
                    : item.active
                    ? 'Confirmar Baja del Modelo'
                    : 'Reactivar Modelo'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
