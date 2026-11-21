import { useEffect, useState } from 'react';
import { asAppError } from '../../../services/api/errors';
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '../../../utils/formStyles';
import { ApproveUsedItemModal } from '../components/ApproveUsedItemModal';
import { DecommissionItemModal } from '../components/DecommissionItemModal';
import type { HardwareItem } from '../hardwareModels';
import { listPendingSecondHand } from '../services/hardwareItemService';

export function InventorySecondHandPage() {
  const [items, setItems] = useState<HardwareItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [approvingItem, setApprovingItem] = useState<HardwareItem | null>(null);
  const [decommissioningItem, setDecommissioningItem] = useState<HardwareItem | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPendingSecondHand();
      setItems(data);
    } catch (e) {
      setError(asAppError(e).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Piezas y Equipos de Segunda Mano Pendientes</h2>
          <p className="mt-1 text-sm text-slate-500">
            Revisión y aprobación técnica para incorporar componentes usados y reciclados al inventario comercial.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchItems()}
          disabled={loading}
          className={`${SECONDARY_BUTTON_CLASS} text-xs`}
        >
          {loading ? 'Cargando…' : 'Actualizar'}
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-4 py-3">NÚMERO DE SERIE</th>
              <th className="px-4 py-3">PRODUCTO / MODELO</th>
              <th className="px-4 py-3">UBICACIÓN ACTUAL</th>
              <th className="px-4 py-3">FECHA REGISTRO</th>
              <th className="px-4 py-3 text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Cargando piezas pendientes…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                  No hay piezas o equipos de segunda mano pendientes de aprobación.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                    {item.serialNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.catalogBrand && item.catalogModel
                      ? `${item.catalogBrand} ${item.catalogModel}`
                      : 'Pieza individual'}
                    {item.catalogSku && (
                      <span className="block font-mono text-xs text-slate-400">{item.catalogSku}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.locationName || 'Almacén Central'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setApprovingItem(item)}
                      className={`${PRIMARY_BUTTON_CLASS} text-xs py-1 px-2.5 min-h-0 bg-emerald-600 hover:bg-emerald-700`}
                    >
                      Aprobar Ingreso
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecommissioningItem(item)}
                      className={`${SECONDARY_BUTTON_CLASS} text-xs py-1 px-2.5 min-h-0 text-red-600 hover:text-red-700`}
                    >
                      Descartar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {approvingItem && (
        <ApproveUsedItemModal
          hardwareItemId={approvingItem.id}
          serialNumber={approvingItem.serialNumber}
          brand={approvingItem.catalogBrand}
          model={approvingItem.catalogModel}
          onClose={() => setApprovingItem(null)}
          onSuccess={() => void fetchItems()}
        />
      )}

      {decommissioningItem && (
        <DecommissionItemModal
          hardwareItemId={decommissioningItem.id}
          serialNumber={decommissioningItem.serialNumber}
          onClose={() => setDecommissioningItem(null)}
          onSuccess={() => void fetchItems()}
        />
      )}
    </div>
  );
}
