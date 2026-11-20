import { LABEL_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import { CatalogProductPicker } from './CatalogProductPicker';
import type { DraftHardware } from '../hardwareDraft';

export function InboundItemFields({
  value,
  onChange,
  label,
  id,
  showLegend = true,
}: {
  value: DraftHardware;
  onChange: (next: DraftHardware) => void;
  label: string;
  /** Stable, HTML-safe id used to associate the product picker controls. */
  id: string;
  showLegend?: boolean;
}) {
  return (
    <fieldset aria-label={label} className="grid gap-3 sm:grid-cols-2">
      {showLegend && <legend className="px-1 font-medium text-slate-900">{label}</legend>}
      <CatalogProductPicker
        id={id}
        serialized
        onChange={(catalogId) => onChange({ ...value, catalogId })}
      />
      <label className={LABEL_CLASS}>
        Serie (opcional)
        <input
          aria-label={`${label}: serie`}
          value={value.serialNumber}
          onChange={(event) => onChange({ ...value, serialNumber: event.target.value })}
          className={TEXT_INPUT_CLASS}
          autoComplete="off"
        />
      </label>
      <label className={LABEL_CLASS}>
        Costo (opcional)
        <input
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
          aria-label={`${label}: precio`}
          type="number"
          min="0"
          step="any"
          value={value.salePrice}
          onChange={(event) => onChange({ ...value, salePrice: event.target.value })}
          className={TEXT_INPUT_CLASS}
        />
      </label>
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
