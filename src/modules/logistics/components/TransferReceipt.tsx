import { Link } from 'react-router-dom';
import type { TransferDetail } from '../models';
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '../../../utils/formStyles';
export function TransferReceipt({ receipt, onNew }: { receipt: TransferDetail; onNew: () => void }) {
  return <section className="space-y-4 rounded-xl border border-emerald-200 bg-white p-5" aria-label="Traslado registrado">
    <div role="status"><h1 className="text-xl font-bold text-emerald-800">Traslado registrado</h1><p className="mt-2 text-lg font-semibold">{receipt.code}</p><p>{receipt.fromLocationName || 'Origen'} → {receipt.toLocationName || 'Destino'}</p></div>
    <ul className="divide-y divide-slate-100">{receipt.items.map(item => <li className="py-2" key={item.id}>{[item.brand, item.model].filter(Boolean).join(' ') || item.sku || 'Producto'} · {item.serialNumber || `${item.quantity} unidades`}</li>)}</ul>
    <div className="flex flex-wrap gap-2"><button className={PRIMARY_BUTTON_CLASS} onClick={onNew}>Nuevo traslado</button><Link className={SECONDARY_BUTTON_CLASS} to={`/logistics/${encodeURIComponent(receipt.id)}`}>Ver guía</Link><Link className={SECONDARY_BUTTON_CLASS} to="/logistics">Historial</Link><Link className={SECONDARY_BUTTON_CLASS} to="/inventory">Consultar existencias</Link></div>
  </section>;
}
