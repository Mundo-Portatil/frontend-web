import { describe, expect, it } from 'vitest';
import { findDuplicateSerials, isUuidV4, validateBatchItem } from './hardwareValidation';
import { newDraftBatchItem } from './hardwareDraft';

describe('hardwareValidation', () => {
  it('validates UUID v4 format', () => {
    expect(isUuidV4('c56a4180-65aa-42ec-a945-5fd21dec0538')).toBe(true);
    expect(isUuidV4('not-a-uuid')).toBe(false);
    expect(isUuidV4('')).toBe(false);
  });

  it('detects duplicate serials case-insensitively and ignores blanks', () => {
    const serials = ['SN-123', 'sn-123', '  ', 'SN-456', 'SN-456', 'sn-789'];
    const dups = findDuplicateSerials(serials);
    expect(dups).toHaveLength(2);
    expect(dups.map((d) => d.toUpperCase())).toContain('SN-123');
    expect(dups.map((d) => d.toUpperCase())).toContain('SN-456');
  });

  it('validates draft batch item', () => {
    const item = newDraftBatchItem();
    expect(validateBatchItem(item)).toContain('Debes seleccionar un producto.');

    item.catalogId = 'cat-1';
    item.quantity = 2;
    item.hasSerialNumbers = true;
    item.serialNumbers = ['SN-01']; // only 1 serial for quantity 2
    expect(validateBatchItem(item)).toContain(
      'Se requieren exactamente 2 números de serie (1 ingresados).',
    );

    item.serialNumbers = ['SN-01', 'sn-01']; // duplicate serial
    expect(validateBatchItem(item).some((e) => e.includes('Series duplicadas'))).toBe(true);

    item.serialNumbers = ['SN-01', 'SN-02']; // valid serials
    item.costPrice = '-10'; // invalid cost
    expect(validateBatchItem(item)).toContain('El costo unitario debe ser un número mayor o igual a cero.');

    item.costPrice = '100';
    item.salePrice = '150';
    expect(validateBatchItem(item)).toHaveLength(0);

    // Tests isNewModel validation
    const newItem = {
      ...newDraftBatchItem(),
      isNewModel: true,
      newModelData: {
        brand: '',
        model: '',
        categoryId: '',
        basePrice: 0,
      },
    };
    const newErrors = validateBatchItem(newItem);
    expect(newErrors).toContain('La marca es obligatoria.');
    expect(newErrors).toContain('El modelo es obligatorio.');
    expect(newErrors).toContain('La categoría es obligatoria.');
    expect(newErrors).toContain('El precio base debe ser un número mayor a cero.');
  });
});
