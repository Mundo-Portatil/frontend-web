import { useState, type FormEvent } from 'react';
import { asAppError } from '../../../services/api/errors';
import {
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
} from '../../../utils/formStyles';
import { decommissionHardwareItem } from '../services/hardwareItemService';

interface DecommissionItemModalProps {
  hardwareItemId: string;
  serialNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DecommissionItemModal({
  hardwareItemId,
  serialNumber,
  onClose,
  onSuccess,
}: DecommissionItemModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('El motivo de la baja es obligatorio.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await decommissionHardwareItem(hardwareItemId, reason.trim());
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
      aria-labelledby="decommission-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <header className="mb-4">
          <h3 id="decommission-title" className="text-lg font-semibold text-slate-900">
            Dar de Baja Lógica
          </h3>
          <p className="font-mono text-sm text-slate-600">Serie: {serialNumber}</p>
        </header>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="decommission-reason" className={LABEL_CLASS}>
              Motivo de la baja <span className="text-red-500">*</span>
            </label>
            <textarea
              id="decommission-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
              className={`${TEXT_INPUT_CLASS} resize-none`}
              placeholder="Explique el motivo (daño irreparable, pérdida, merma técnica)..."
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
              className={`${PRIMARY_BUTTON_CLASS} bg-red-600 hover:bg-red-700`}
            >
              {submitting ? 'Procesando…' : 'Confirmar Baja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
