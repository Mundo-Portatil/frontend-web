import type { DraftBatchItem } from './hardwareDraft';

export const isUuidV4 = (value: string): boolean =>
  /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(value);

/**
 * Returns duplicate serial strings found within the provided array.
 * Comparisons are case-insensitive and trimmed. Empty strings are ignored.
 */
export function findDuplicateSerials(serials: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const raw of serials) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toUpperCase();
    if (seen.has(normalized)) {
      duplicates.add(trimmed);
    } else {
      seen.add(normalized);
    }
  }

  return [...duplicates];
}

/**
 * Validates a single draft batch item before adding it to the inbound batch.
 */
export function validateBatchItem(item: DraftBatchItem): string[] {
  const errors: string[] = [];

  if (item.isNewModel) {
    if (!item.newModelData?.brand?.trim()) {
      errors.push('La marca es obligatoria.');
    }
    if (!item.newModelData?.model?.trim()) {
      errors.push('El modelo es obligatorio.');
    }
    if (!item.newModelData?.categoryId?.trim()) {
      errors.push('La categoría es obligatoria.');
    }
    if (item.newModelData?.basePrice === undefined || item.newModelData.basePrice <= 0) {
      errors.push('El precio base debe ser un número mayor a cero.');
    }
  } else if (!item.catalogId.trim()) {
    errors.push('Debes seleccionar un producto.');
  }

  if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
    errors.push('La cantidad debe ser un número entero mayor a cero.');
  }

  if (item.costPrice.trim() !== '') {
    const cost = Number(item.costPrice);
    if (!Number.isFinite(cost) || cost < 0) {
      errors.push('El costo unitario debe ser un número mayor o igual a cero.');
    }
  }

  if (item.salePrice.trim() !== '') {
    const sale = Number(item.salePrice);
    if (!Number.isFinite(sale) || sale < 0) {
      errors.push('El precio de venta debe ser un número mayor o igual a cero.');
    }
  }

  if (item.hasSerialNumbers) {
    const filledSerials = item.serialNumbers.map((s) => s.trim()).filter(Boolean);
    if (filledSerials.length !== item.quantity) {
      errors.push(
        `Se requieren exactamente ${item.quantity} números de serie (${filledSerials.length} ingresados).`,
      );
    }

    const duplicates = findDuplicateSerials(filledSerials);
    if (duplicates.length > 0) {
      errors.push(`Series duplicadas en este producto: ${duplicates.join(', ')}`);
    }
  }

  return errors;
}
