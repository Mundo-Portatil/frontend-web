import { useState } from 'react';
import { openLabelsPdf } from '../../../services/printer/labelPdfService';
import { SECONDARY_BUTTON_CLASS } from '../../../utils/formStyles';
import type { AvailableSerial } from '../hardwareModels';
import { getSingleBarcodeLabel } from '../services/barcodeLabelService';
import { HardwareLifecycleModal } from './HardwareLifecycleModal';

interface ExpandableSerialsRowProps {
  catalogId: string;
  locationId: string;
  serials: AvailableSerial[];
  loading: boolean;
  error: string | null;
  onDecommissionSuccess?: (serialId: string) => void;
}

export function ExpandableSerialsRow({
  serials,
  loading,
  error,
}: ExpandableSerialsRowProps) {
  const [selectedLifecycleSerial, setSelectedLifecycleSerial] = useState<{ id: string; sn: string } | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const handlePrint = async (serial: AvailableSerial) => {
    setPrintingId(serial.id);
    try {
      const label = await getSingleBarcodeLabel(serial.id);
      openLabelsPdf([label]);
    } catch {
      // Print fallback
      window.print();
    } finally {
      setPrintingId(null);
    }
  };

  if (loading) {
    return (
      <tr>
        <td colSpan={7} className="bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
          Cargando números de serie en stock…
        </td>
      </tr>
    );
  }

  if (error) {
    return (
      <tr>
        <td colSpan={7} className="bg-red-50 px-4 py-3 text-center text-xs text-red-700">
          Error cargando series: {error}
        </td>
      </tr>
    );
  }

  if (serials.length === 0) {
    return (
      <tr>
        <td colSpan={7} className="bg-slate-50 px-4 py-3 text-center text-xs italic text-slate-400">
          No hay series registradas individualmente en esta ubicación (inventario gestionado solo por cantidad).
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className="bg-slate-50/80">
        <td colSpan={7} className="px-4 py-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
              Series en Stock ({serials.length}):
            </h5>
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {serials.map((serial) => (
                <div
                  key={serial.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-slate-900">• {serial.serialNumber}</span>
                    {serial.salePrice !== null && (
                      <span className="text-slate-600">S/ {serial.salePrice.toFixed(2)}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedLifecycleSerial({ id: serial.id, sn: serial.serialNumber })}
                      className={`${SECONDARY_BUTTON_CLASS} text-xs py-1 px-2 min-h-0`}
                    >
                      Hoja de Vida
                    </button>

                    <button
                      type="button"
                      disabled={printingId === serial.id}
                      onClick={() => void handlePrint(serial)}
                      className={`${SECONDARY_BUTTON_CLASS} text-xs py-1 px-2 min-h-0`}
                    >
                      {printingId === serial.id ? 'Generando…' : 'Imprimir Etiqueta 1D'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </td>
      </tr>

      {selectedLifecycleSerial && (
        <HardwareLifecycleModal
          hardwareItemId={selectedLifecycleSerial.id}
          serialNumber={selectedLifecycleSerial.sn}
          onClose={() => setSelectedLifecycleSerial(null)}
        />
      )}
    </>
  );
}
