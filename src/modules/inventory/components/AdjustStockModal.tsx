import { useState, type FormEvent } from 'react';
import { asAppError } from '../../../services/api/errors';
import {
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
} from '../../../utils/formStyles';
import { adjustQuantityStock } from '../services/quantityStockService';

interface AdjustStockModalProps {
  catalogId: string;
  catalogBrand: string;
  catalogModel: string;
  locationId: string;
  locationName: string;
  currentQuantity: number;
  onClose: () => void;
  onSuccess: (newQuantity: number) => void;
}

export function AdjustStockModal({
  catalogId,
  catalogBrand,
  catalogModel,
  locationId,
  locationName,
  currentQuantity,
  onClose,
  onSuccess,
}: AdjustStockModalProps) {
  const [newQuantity, setNewQuantity] = useState<number>(currentQuantity);
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('El motivo del ajuste es obligatorio.');
      return;
    }
    if (newQuantity < 0 || !Number.isInteger(newQuantity)) {
      setError('La nueva cantidad debe ser un entero mayor o igual a 0.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await adjustQuantityStock({
        catalogId,
        locationId,
        newQuantity,
        reason: reason.trim(),
      });
      onSuccess(newQuantity);
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
      aria-labelledby="adjust-stock-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <header className="mb-4">
          <h3 id="adjust-stock-title" className="text-lg font-semibold text-slate-900">
            Ajustar Stock Manualmente
          </h3>
          <p className="text-sm text-slate-600">
            {catalogBrand} {catalogModel} — <span className="font-medium">{locationName}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">Cantidad actual: {currentQuantity} unidades</p>
        </header>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="adjust-new-quantity" className={LABEL_CLASS}>
              Nueva cantidad en inventario <span className="text-red-500">*</span>
            </label>
            <input
              id="adjust-new-quantity"
              type="number"
              min={0}
              step={1}
              value={newQuantity}
              onChange={(e) => setNewQuantity(parseInt(e.target.value, 10) || 0)}
              disabled={submitting}
              className={TEXT_INPUT_CLASS}
              required
            />
          </div>

          <div>
            <label htmlFor="adjust-reason" className={LABEL_CLASS}>
              Motivo del ajuste / merma <span className="text-red-500">*</span>
            </label>
            <textarea
              id="adjust-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
              className={`${TEXT_INPUT_CLASS} resize-none`}
              placeholder="Explique el motivo (conteo físico, merma, rotura, discrepancia)..."
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
              disabled={submitting || !reason.trim()}
              className={PRIMARY_BUTTON_CLASS}
            >
              {submitting ? 'Ajustando…' : 'Guardar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
