import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '../../../utils/formStyles';
import type { UnifiedInboundResponse } from '../hardwareModels';

interface PostInboundPrintModalProps {
  response: UnifiedInboundResponse;
  onClose: () => void;
}

export function PostInboundPrintModal({ response, onClose }: PostInboundPrintModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-inbound-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
        <header className="border-b border-slate-100 p-5">
          <div className="flex items-center gap-2">
            <div>
              <h3 id="post-inbound-title" className="text-lg font-semibold text-slate-900">
                ¡Ingreso Registrado con Éxito!
              </h3>
              <p className="text-sm text-slate-500">
                Lote ID: <span className="font-mono font-medium">{response.batchId}</span> — Destino:{' '}
                <span className="font-medium text-slate-700">{response.locationName}</span>
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="text-xs text-slate-500">Modelos diferentes</span>
              <p className="text-xl font-bold text-slate-900">{response.totalItems}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="text-xs text-slate-500">Unidades totales</span>
              <p className="text-xl font-bold text-brand-700">{response.totalUnits}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-500">Fecha y Hora</span>
              <p className="text-xs font-medium text-slate-700 mt-1">
                {new Date(response.createdAt).toLocaleString('es-PE')}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Desglose de Productos Ingresados</h4>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Producto</th>
                    <th className="px-3 py-2">Cód. Etiqueta</th>
                    <th className="px-3 py-2 text-center">Cant.</th>
                    <th className="px-3 py-2">Series Generadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {response.results.map((res, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {res.catalogBrand} {res.catalogModel}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-600">{res.catalogSku}</td>
                      <td className="px-3 py-2 text-center font-bold text-slate-800">{res.quantity}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {res.hasSerialNumbers && res.serialsCreated?.length > 0 ? (
                          <span className="font-mono">{res.serialsCreated.join(', ')}</span>
                        ) : (
                          <span className="italic text-slate-400">Sin series individuales</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-100 p-4 sm:p-5">
          <button type="button" onClick={onClose} className={SECONDARY_BUTTON_CLASS}>
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className={`${PRIMARY_BUTTON_CLASS} inline-flex items-center gap-1.5`}
          >
            <span>Imprimir Etiquetas 1D</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
