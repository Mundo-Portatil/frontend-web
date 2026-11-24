import { Link } from 'react-router-dom';
import type { TransferDetail } from '../models';
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '../../../utils/formStyles';

export function TransferReceipt({
  receipt,
  onNew,
}: {
  receipt: TransferDetail;
  onNew: () => void;
}) {
  return (
    <section
      className="mx-auto w-full max-w-3xl space-y-4 rounded-xl border border-emerald-200 bg-white p-5"
      aria-label="Traslado registrado"
    >
      <div role="status" className="space-y-2">
        <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          Completado
        </span>
        <h1 className="text-xl font-bold text-slate-900">Traslado registrado</h1>
        <p className="font-mono text-base font-semibold text-emerald-800">{receipt.code}</p>
        <p className="text-sm font-medium text-slate-700">
          {receipt.fromLocationName || 'Origen'} → {receipt.toLocationName || 'Destino'}
        </p>
      </div>

      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
        {receipt.items.map((item) => (
          <li className="px-3 py-2 text-slate-800" key={item.id}>
            {[item.brand, item.model].filter(Boolean).join(' ') || item.sku || 'Producto'} ·{' '}
            {item.serialNumber || `${item.quantity} ${item.quantity === 1 ? 'unidad' : 'unidades'}`}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={PRIMARY_BUTTON_CLASS} onClick={onNew}>
          Nuevo traslado
        </button>
        <Link className={SECONDARY_BUTTON_CLASS} to={`/logistics/${encodeURIComponent(receipt.id)}`}>
          Ver guía
        </Link>
        <Link className={SECONDARY_BUTTON_CLASS} to="/logistics">
          Historial de traslados
        </Link>
        <Link className={SECONDARY_BUTTON_CLASS} to="/inventory">
          Consultar existencias
        </Link>
      </div>
    </section>
  );
}
