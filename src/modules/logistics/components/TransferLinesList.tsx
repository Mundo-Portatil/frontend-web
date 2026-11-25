import type { DraftAction, TransferDraft } from '../draftModels';
import { SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';

export function TransferLinesList({
  draft,
  dispatch,
}: {
  draft: TransferDraft;
  dispatch: (action: DraftAction) => void;
}) {
  const totalUnits =
    draft.serials.length + draft.quantities.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <section className="space-y-3" aria-label="Mercancía seleccionada">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">Mercancía seleccionada</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-700">
          {totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'}
        </span>
      </div>

      {!draft.serials.length && !draft.quantities.length ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-500">
          Agrega productos con número de serie o por cantidad desde la izquierda.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {draft.serials.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {item.catalogName || item.catalogSku || 'Equipo'}
                </p>
                <p className="text-xs text-slate-600">
                  Serie: <span className="font-mono font-medium text-slate-800">{item.serialNumber}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {item.isSecondHand ? 'Segunda mano' : 'Nuevo'}
                </p>
                {item.components?.length ? (
                  <ul className="mt-1 text-xs text-slate-500">
                    {item.components.map((component) => (
                      <li key={component.id}>
                        {component.catalogName || 'Componente'} · {component.serialNumber}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <button
                type="button"
                className={SECONDARY_BUTTON_CLASS}
                onClick={() => dispatch({ type: 'remove', id: item.id })}
                aria-label={`Quitar ${item.serialNumber}`}
              >
                Quitar
              </button>
            </li>
          ))}

          {draft.quantities.map((line) => {
            const invalid =
              line.available === null ||
              !Number.isInteger(line.quantity) ||
              line.quantity <= 0 ||
              line.quantity > line.available;
            return (
              <li key={line.catalog.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-36 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {line.catalog.name || `${line.catalog.brand} ${line.catalog.model}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {line.available === null
                      ? 'Disponibilidad pendiente'
                      : `Por cantidad · ${line.available} disponibles`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20">
                    <span className="sr-only">Cantidad de {line.catalog.name}</span>
                    <input
                      aria-invalid={invalid}
                      className={TEXT_INPUT_CLASS}
                      type="number"
                      min="1"
                      step="1"
                      value={line.quantity}
                      onChange={(event) =>
                        dispatch({
                          type: 'editQuantity',
                          catalogId: line.catalog.id,
                          quantity: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className={SECONDARY_BUTTON_CLASS}
                    onClick={() => dispatch({ type: 'remove', id: line.catalog.id })}
                    aria-label={`Quitar ${line.catalog.name}`}
                  >
                    Quitar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
