import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useMerchandiseInbound } from './useMerchandiseInbound';
import { listActiveLocations } from '../../foundation/locations/services/locationService';
import { listCategories } from '../services/categoryService';
import { createCatalogItem } from '../services/catalogService';
import { validateSerials } from '../services/hardwareItemService';
import { receiveInventory } from '../services/inventoryInboundService';
import { useAuthStore } from '../../../stores/authStore';
import type { CatalogItem, CreateCatalogInput } from '../catalogModels';
import type { UnifiedInboundResult } from '../unifiedInboundModels';

vi.mock('../../foundation/locations/services/locationService', () => ({ listActiveLocations: vi.fn() }));
vi.mock('../services/categoryService', () => ({ listCategories: vi.fn() }));
vi.mock('../services/catalogService', () => ({ createCatalogItem: vi.fn() }));
vi.mock('../services/hardwareItemService', () => ({ validateSerials: vi.fn() }));
vi.mock('../services/inventoryInboundService', () => ({ receiveInventory: vi.fn() }));
const productId = '123e4567-e89b-42d3-a456-426614174000';
const warehouse = { id: 'central', name: 'Depósito principal', type: 'ALMACEN_CENTRAL' as const, active: true, createdAt: '' };
const category = { id: 'category', name: 'Equipos', description: null, active: true, createdAt: '' };
const input: CreateCatalogInput = { sku: 'LAP-X', brand: 'Marca', model: 'X', categoryId: category.id, basePrice: 1000, isSerialized: true };
const product = { ...input, id: productId, isSerialized: true, active: true, isSecondHand: false, minStockThreshold: 2 } as CatalogItem;
const receipt: UnifiedInboundResult = {
  batchId: 'batch', locationId: warehouse.id, locationName: warehouse.name, totalItems: 1, totalUnits: 5,
  results: [{ catalogId: productId, catalogSku: 'LAP-X', catalogBrand: 'Marca', catalogModel: 'X', quantity: 5, hasSerialNumbers: true, serialsCreated: ['S1', 'S2', 'S3', 'S4', 'S5'], totalStockResulting: 130 }],
  createdAt: '2026-11-21T10:00:00Z',
};
beforeEach(() => {
  vi.resetAllMocks();
  useAuthStore.setState({ status: 'authenticated', user: { id: 'admin', name: 'Ana', email: 'ana@mp.pe', role: 'ADMIN', active: true } });
  vi.mocked(listActiveLocations).mockResolvedValue([warehouse, { ...warehouse, id: 'puesto', name: 'Almacén Central', type: 'PUESTO' }]);
  vi.mocked(listCategories).mockResolvedValue([category]);
  vi.mocked(validateSerials).mockResolvedValue({ allValid: true, existingSerials: [] });
  vi.mocked(createCatalogItem).mockResolvedValue(product);
  vi.mocked(receiveInventory).mockResolvedValue(receipt);
});
async function mount() {
  const view = renderHook(() => useMerchandiseInbound());
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

it('creates one model and admits five serialized units through the unified endpoint without a client location', async () => {
  const { result } = await mount();
  act(() => {
    result.current.setModel({ kind: 'new', input });
    result.current.setQuantity('5');
    result.current.setSerialText('s1\ns2\ns3\ns4\ns5');
  });
  await act(async () => result.current.prepare());
  expect(createCatalogItem).not.toHaveBeenCalled();
  expect(validateSerials).toHaveBeenCalledWith(['S1', 'S2', 'S3', 'S4', 'S5']);
  await act(async () => result.current.confirm());
  expect(createCatalogItem).toHaveBeenCalledTimes(1);
  expect(createCatalogItem).toHaveBeenCalledWith({ ...input, active: true, isSecondHand: false });
  expect(receiveInventory).toHaveBeenCalledWith({ items: [{ catalogId: productId, quantity: 5, hasSerialNumbers: true, serialNumbers: ['S1', 'S2', 'S3', 'S4', 'S5'] }] });
  expect(result.current.result).toEqual(receipt);
});

it('replenishes an existing quantity model without creating another catalogue entry or asking for serials', async () => {
  const { result } = await mount();
  act(() => { result.current.setModel({ kind: 'existing', item: { ...product, isSerialized: false } }); result.current.setQuantity('30'); });
  await act(async () => result.current.prepare());
  await act(async () => result.current.confirm());
  expect(receiveInventory).toHaveBeenCalledWith({ items: [{ catalogId: productId, quantity: 30, hasSerialNumbers: false }] });
  expect(createCatalogItem).not.toHaveBeenCalled();
  expect(validateSerials).not.toHaveBeenCalled();
  expect(result.current.result).toEqual(receipt);
});

it('rejects missing and duplicate series before creating the model, and reports server duplicates', async () => {
  const { result } = await mount();
  act(() => { result.current.setModel({ kind: 'new', input }); result.current.setQuantity('2'); result.current.setSerialText('S1'); });
  await act(async () => result.current.prepare());
  expect(result.current.error).toContain('una serie por cada unidad');
  act(() => result.current.setSerialText('S1\ns1'));
  await act(async () => result.current.prepare());
  expect(result.current.error).toContain('repetidos');
  expect(validateSerials).not.toHaveBeenCalled();
  act(() => result.current.setSerialText('S1\nS2'));
  vi.mocked(validateSerials).mockResolvedValue({ allValid: false, existingSerials: ['S1'] });
  await act(async () => result.current.prepare());
  expect(result.current.error).toContain('Series ya registradas: S1');
  expect(createCatalogItem).not.toHaveBeenCalled();
  expect(result.current.review).toBeNull();
});

it.each([0, 2])('blocks admission when there are %s active central warehouses', async (count) => {
  vi.mocked(listActiveLocations).mockResolvedValue(Array.from({ length: count }, (_, i) => ({ ...warehouse, id: `central-${i}` })));
  const { result } = await mount();
  expect(result.current.warehouse).toBeNull();
  expect(result.current.referenceError).toContain(count === 0 ? 'No hay' : 'varios');
  act(() => result.current.setModel({ kind: 'new', input }));
  await act(async () => result.current.prepare());
  expect(result.current.review).toBeNull();
  expect(createCatalogItem).not.toHaveBeenCalled();
});

it('retains the already-created model after a rejected admission and retries stock without duplicating the model', async () => {
  const quantityInput = { ...input, isSerialized: false };
  vi.mocked(createCatalogItem).mockResolvedValue({ ...product, isSerialized: false });
  vi.mocked(receiveInventory).mockRejectedValueOnce({ kind: 'validation', status: 400, message: 'Revisa la cantidad' }).mockResolvedValueOnce(receipt);
  const { result } = await mount();
  act(() => { result.current.setModel({ kind: 'new', input: quantityInput }); result.current.setQuantity('30'); });
  await act(async () => result.current.prepare());
  await act(async () => result.current.confirm());
  expect(result.current.createdModel?.id).toBe(productId);
  expect(result.current.result).toBeNull();
  expect(result.current.error).toBe('Revisa la cantidad');
  act(() => { result.current.editReview(); result.current.setQuantity('31'); });
  await act(async () => result.current.prepare());
  await act(async () => result.current.confirm());
  expect(createCatalogItem).toHaveBeenCalledTimes(1);
  expect(receiveInventory).toHaveBeenLastCalledWith({ items: [{ catalogId: productId, quantity: 31, hasSerialNumbers: false }] });
  expect(result.current.result).toEqual(receipt);
});

it('blocks a blind retry when a mutation response is uncertain', async () => {
  vi.mocked(receiveInventory).mockRejectedValue({ kind: 'network', message: 'Sin conexión' });
  const { result } = await mount();
  act(() => { result.current.setModel({ kind: 'existing', item: { ...product, isSerialized: false } }); result.current.setQuantity('30'); });
  await act(async () => result.current.prepare());
  await act(async () => result.current.confirm());
  expect(result.current.uncertain).toBe(true);
  expect(result.current.result).toBeNull();
  await act(async () => { await result.current.confirm(); result.current.reset(); });
  expect(receiveInventory).toHaveBeenCalledTimes(1);
  expect(result.current.uncertain).toBe(true);
});

it('does not admit used merchandise without approval or allow non-admin confirmation', async () => {
  const { result } = await mount();
  act(() => result.current.setModel({ kind: 'existing', item: { ...product, isSecondHand: true } }));
  await act(async () => result.current.prepare());
  expect(result.current.error).toContain('aprobación administrativa');
  act(() => { result.current.setModel({ kind: 'existing', item: { ...product, isSerialized: false } }); result.current.setQuantity('1'); });
  await act(async () => result.current.prepare());
  act(() => useAuthStore.setState((state) => ({ user: { ...state.user!, role: 'VENDEDOR' } })));
  await act(async () => result.current.confirm());
  expect(receiveInventory).not.toHaveBeenCalled();
});

it('allows the warehouse manager to confirm a receipt', async () => {
  const { result } = await mount();
  act(() => {
    useAuthStore.setState((state) => ({ user: { ...state.user!, role: 'ENCARGADO_ALMACEN' } }));
    result.current.setModel({ kind: 'existing', item: { ...product, isSerialized: false } });
  });
  await act(async () => result.current.prepare());
  await act(async () => result.current.confirm());
  expect(receiveInventory).toHaveBeenCalledTimes(1);
});
