import type { Location } from '../../foundation/locations/models';
import type { TransferDraft } from '../draftModels';
import type { CreateDirectTransferInput, TransferDetail } from '../models';
import { validateTransferDraft } from '../validation';

/**
 * Map a draft into the DTO required by the backend to create a transfer.
 * Converts both serials (hardwareItemIds) and quantities.
 */
export function draftToInput(draft: TransferDraft, locations: Location[]): CreateDirectTransferInput {
  const error = validateTransferDraft(draft, locations);
  if (error) {
    throw new Error(error);
  }
  const centers = locations.filter((location) => location.active && location.type === 'ALMACEN_CENTRAL');
  const post = locations.find((location) => location.id === draft.postId && location.active && location.type === 'PUESTO');
  if (centers.length !== 1 || !post) {
    throw new Error('Ruta no válida');
  }
  const realRoute = draft.direction === 'supply'
    ? { from: centers[0], to: post }
    : { from: post, to: centers[0] };
  return {
    fromLocationId: realRoute.from.id,
    toLocationId: realRoute.to.id,
    ...(draft.serials.length
      ? { hardwareItemIds: draft.serials.map((s) => s.id) }
      : {}),
    ...(draft.quantities.length
      ? { quantities: draft.quantities.map((l) => ({ catalogId: l.catalog.id, quantity: l.quantity })) }
      : {}),
    ...(draft.notes.trim() ? { notes: draft.notes.trim() } : {}),
  };
}

/**
 * Transform the backend response into a shape suitable for UI consumption.
 */
export function mapTransferDetail(detail: TransferDetail): TransferDetail {
  return detail;
}
