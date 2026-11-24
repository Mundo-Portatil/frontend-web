import type { Location } from '../foundation/locations/models';
import type { TransferDraft } from './draftModels';
import type { CreateDirectTransferInput, TransferDetail } from './models';

export function getTransferRoute(draft: TransferDraft, locations: Location[]) {
  const centers = locations.filter(location => location.active && location.type === 'ALMACEN_CENTRAL');
  const post = locations.find(location => location.id === draft.postId && location.active && location.type === 'PUESTO');
  if (centers.length !== 1 || !post) return null;
  return draft.direction === 'supply' ? { from: centers[0], to: post } : { from: post, to: centers[0] };
}

export function validateTransferDraft(draft: TransferDraft, locations: Location[]): string | null {
  const route = getTransferRoute(draft, locations);
  if (!route) return 'Selecciona una ruta válida entre el almacén central y un puesto activo.';
  if (!draft.serials.length && !draft.quantities.length) return 'Agrega al menos un producto.';
  if (new Set(draft.serials.map(item => item.id)).size !== draft.serials.length || new Set(draft.quantities.map(line => line.catalog.id)).size !== draft.quantities.length) return 'Hay productos repetidos. Revisa la selección.';
  if (draft.serials.some(item => item.locationId !== route.from.id || item.status !== 'EN_STOCK' || item.parentChassisId)) return 'Una unidad no está disponible para salir de este origen.';
  if (draft.quantities.some(line => line.catalog.isSerialized || !line.catalog.active || !Number.isInteger(line.quantity) || line.quantity <= 0 || line.available === null || line.quantity > line.available)) return 'Revisa las cantidades y la disponibilidad en el origen.';
  return null;
}

export function toTransferInput(draft: TransferDraft, locations: Location[]): CreateDirectTransferInput {
  const error = validateTransferDraft(draft, locations);
  if (error) throw new Error(error);
  const route = getTransferRoute(draft, locations)!;
  return {
    fromLocationId: route.from.id,
    toLocationId: route.to.id,
    ...(draft.serials.length ? { hardwareItemIds: draft.serials.map(item => item.id) } : {}),
    ...(draft.quantities.length ? { quantities: draft.quantities.map(line => ({ catalogId: line.catalog.id, quantity: line.quantity })) } : {}),
    ...(draft.notes.trim() ? { notes: draft.notes.trim() } : {}),
  };
}

export function matchesTransferResponse(result: TransferDetail, input: CreateDirectTransferInput): boolean {
  if (!result || !result.id || !result.code || result.status !== 'COMPLETED' || result.type !== 'DIRECTO' || result.fromLocationId !== input.fromLocationId || result.toLocationId !== input.toLocationId || !Array.isArray(result.items)) return false;
  const expectedQuantities = input.quantities ?? [];
  const expectedSerials = input.hardwareItemIds ?? [];
  const quantitiesMatch = expectedQuantities.every(line => result.items.some(item => item.catalogId === line.catalogId && item.quantity === line.quantity && item.hardwareItemId === null));
  const serialsMatch = expectedSerials.every(id => result.items.some(item => item.hardwareItemId === id && item.quantity === 1));
  return quantitiesMatch && serialsMatch;
}
