import { LABEL_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import { CatalogProductPicker } from './CatalogProductPicker';
import type { DraftHardware } from '../hardwareDraft';
import type { CatalogItem } from '../catalogModels';

export function InboundItemFields({
  value,
  onChange,
  label,
  id,
  showLegend = true,
  onProductSelect,
}: {
  value: DraftHardware;
  onChange: (next: DraftHardware) => void;
  label: string;
  /** Stable, HTML-safe id used to associate the product picker controls. */
  id: string;
  showLegend?: boolean;
  onProductSelect?: (item: CatalogItem | null) => void;
}) {
  return (
    <fieldset aria-label={label} className="min-w-0 space-y-4">
      {showLegend && <legend className="px-1 font-medium text-slate-900">{label}</legend>}
      <CatalogProductPicker
        id={id}
        serialized
        onChange={(catalogId) => onChange({ ...value, catalogId })}
        onSelect={onProductSelect}
      />
      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        <label className={LABEL_CLASS}>
          Serie (opcional)
          <input
            name={`${id}-serial`}
            aria-label={`${label}: serie`}
            value={value.serialNumber}
            onChange={(event) => onChange({ ...value, serialNumber: event.target.value })}
            className={TEXT_INPUT_CLASS}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className={LABEL_CLASS}>
          Costo (opcional)
          <input
            name={`${id}-cost`}
            aria-label={`${label}: costo`}
            type="number"
            min="0"
            step="any"
            value={value.costPrice}
            onChange={(event) => onChange({ ...value, costPrice: event.target.value })}
            className={TEXT_INPUT_CLASS}
          />
        </label>
        <label className={LABEL_CLASS}>
          Precio de venta (opcional)
          <input
            name={`${id}-price`}
            aria-label={`${label}: precio`}
            type="number"
            min="0"
            step="any"
            value={value.salePrice}
            onChange={(event) => onChange({ ...value, salePrice: event.target.value })}
            className={TEXT_INPUT_CLASS}
          />
        </label>
      </div>
    </fieldset>
  );
}

export function RemoveDraftButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={SECONDARY_BUTTON_CLASS}>
      Quitar
    </button>
  );
}
