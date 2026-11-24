import type { DraftAction, TransferDraft } from '../draftModels';
import { SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
export function TransferLinesList({ draft, dispatch }: { draft: TransferDraft; dispatch: (action: DraftAction) => void }) {
  return <section className="space-y-3" aria-label="Productos de la guía">
    <h2 className="font-semibold text-slate-900">Productos de la guía ({draft.serials.length + draft.quantities.reduce((sum, line) => sum + line.quantity, 0)})</h2>
    {!draft.serials.length && !draft.quantities.length && <p className="text-sm text-slate-500">Agrega los productos que vas a trasladar.</p>}
    {draft.quantities.map(line => <div key={line.catalog.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
      <div className="min-w-40 flex-1"><p className="font-medium">{line.catalog.name || `${line.catalog.brand} ${line.catalog.model}`}</p><p className="text-sm text-slate-500">{line.available === null ? 'Disponibilidad pendiente' : `${line.available} disponibles en origen`}</p></div>
      <label className="w-32"><span className="sr-only">Cantidad de {line.catalog.name}</span><input aria-invalid={line.available === null || !Number.isInteger(line.quantity) || line.quantity <= 0 || line.quantity > line.available} className={TEXT_INPUT_CLASS} type="number" min="1" step="1" value={line.quantity} onChange={event => dispatch({ type: 'editQuantity', catalogId: line.catalog.id, quantity: Number(event.target.value) })} /></label>
      <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => dispatch({ type: 'remove', id: line.catalog.id })} aria-label={`Quitar ${line.catalog.name}`}>Quitar</button>
    </div>)}
    {draft.serials.map(item => <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
      <div className="min-w-40 flex-1"><p className="font-medium">{item.catalogName || item.catalogSku || 'Unidad'} · {item.serialNumber}</p><p className="text-sm text-slate-600">{item.locationName || 'Origen seleccionado'} · En stock · {item.isSecondHand ? 'Segunda mano' : 'Nuevo'}</p>{item.components?.length ? <ul className="text-sm text-slate-500">{item.components.map(component => <li key={component.id}>{component.catalogName || 'Componente'} · {component.serialNumber}</li>)}</ul> : null}</div>
      <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => dispatch({ type: 'remove', id: item.id })} aria-label={`Quitar ${item.serialNumber}`}>Quitar</button>
    </div>)}
  </section>;
}
