import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { selectCatalogProduct } from '../../../test/selectCatalogProduct';
import { QuantityStockPage } from './QuantityStockPage';
import * as service from '../services/quantityStockService';
import { listLocations } from '../../foundation/locations/services/locationService';
import { listCategories } from '../services/categoryService';
import { listCatalog, getCatalogDetail } from '../services/catalogService';
import { listHardwareUnits } from '../services/hardwareReadService';
import { useAuthStore } from '../../../stores/authStore';
import type { CatalogItem } from '../catalogModels';
vi.mock('../services/quantityStockService', () => ({ listQuantityStock: vi.fn(), inboundQuantityStock: vi.fn(), adjustQuantityStock: vi.fn() }));
vi.mock('../services/categoryService', () => ({ listCategories: vi.fn() }));
vi.mock('../services/catalogService', () => ({ listCatalog: vi.fn(), getCatalogDetail: vi.fn() }));
vi.mock('../services/hardwareReadService', () => ({ listHardwareUnits: vi.fn(), getHardwareLifecycle: vi.fn(), getAvailableSerials: vi.fn() }));
vi.mock('../../foundation/locations/services/locationService', () => ({ listLocations: vi.fn() }));
const placeId = '123e4567-e89b-42d3-a456-426614174000';
const productId = '223e4567-e89b-42d3-a456-426614174000';
const categoryId = '323e4567-e89b-42d3-a456-426614174000';
const stock = { id: 'stock', catalogId: productId, catalogBrand: 'Mouse', catalogModel: 'Logitech', catalogSku: 'M170', locationId: placeId, locationName: 'Almacén central', quantity: 2, costPrice: 10, salePrice: 20, minStockThreshold: 5, isLowStock: true, updatedAt: '2026-11-14T21:40:00Z' };
const session = { id: 'self', name: 'Ana', email: 'a@mp.pe', role: 'ADMIN' as const, active: true };
beforeEach(() => {
  vi.resetAllMocks(); useAuthStore.setState({ status: 'authenticated', user: session });
  vi.mocked(service.listQuantityStock).mockResolvedValue({ items: [stock], total: 101, page: 1, limit: 50 });
  vi.mocked(listLocations).mockResolvedValue([{ id: placeId, name: 'Almacén central', active: true, type: 'ALMACEN_CENTRAL', createdAt: '' }]);
  vi.mocked(listCategories).mockResolvedValue([{ id: categoryId, name: 'Accesorios', description: null, active: true, createdAt: '' }]);
  vi.mocked(listCatalog).mockResolvedValue({ items: [{ id: productId, name: 'Mouse Logitech', sku: 'M170', isSerialized: false, active: true } as CatalogItem], page: 1, limit: 50, total: 1 });
  vi.mocked(listHardwareUnits).mockResolvedValue({ items: [], total: 0, page: 1, limit: 50 });
});
describe('QuantityStockPage', () => {
  it.each(['ADMIN', 'VENDEDOR', 'TECNICO'] as const)('allows %s to consult and limits mutations to admin', async (role) => {
    useAuthStore.setState({ user: { ...session, role } }); render(<MemoryRouter><QuantityStockPage /></MemoryRouter>);
    expect(await screen.findByText('Mouse Logitech')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Cargando ubicaciones y categorías…')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Agregar o corregir cantidades' })).not.toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '2' })).toBeInTheDocument();
  });
  it('applies real filters with page reset and paginates', async () => {
    const user = userEvent.setup(); render(<MemoryRouter><QuantityStockPage /></MemoryRouter>); await screen.findByText('Mouse Logitech');
    await waitFor(() => expect(listCatalog).toHaveBeenCalledWith({ page: 1, limit: 50 }, expect.any(AbortSignal)));
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(() => expect(service.listQuantityStock).toHaveBeenLastCalledWith({ page: 2, limit: 50 }, expect.any(AbortSignal)));
    await user.selectOptions(screen.getByLabelText('Filtrar por ubicación'), placeId);
    await user.click(screen.getByText('Más filtros'));
    await user.selectOptions(screen.getByLabelText('Filtrar por categoría'), categoryId);
    await selectCatalogProduct(user, 'Filtrar por producto', 'Mouse Logitech · M170');
    await user.click(screen.getByLabelText('Solo stock bajo'));
    expect(screen.queryByRole('button', { name: 'Aplicar filtros' })).not.toBeInTheDocument();
    await waitFor(() => expect(service.listQuantityStock).toHaveBeenLastCalledWith({ page: 1, limit: 50, locationId: placeId, categoryId, catalogItemId: productId, lowStock: true }, expect.any(AbortSignal)));
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    await waitFor(() => expect(service.listQuantityStock).toHaveBeenLastCalledWith({ page: 1, limit: 50 }, expect.any(AbortSignal)));
    expect(screen.getByRole('combobox', { name: 'Filtrar por producto' })).toHaveValue('');
  });
  it('keeps stock queries read-only even for administrators', async () => {
    render(<MemoryRouter><QuantityStockPage /></MemoryRouter>);
    await screen.findByText('Mouse Logitech');
    expect(screen.queryByRole('button', { name: 'Agregar o corregir cantidades' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Cantidad que ingresa')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nueva cantidad total')).not.toBeInTheDocument();
    expect(service.inboundQuantityStock).not.toHaveBeenCalled();
    expect(service.adjustQuantityStock).not.toHaveBeenCalled();
  });
  it('shows errors and retries empty lists', async () => {
    vi.mocked(service.listQuantityStock).mockRejectedValueOnce({ kind: 'network', message: 'Sin conexión' }).mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 50 });
    render(<MemoryRouter><QuantityStockPage /></MemoryRouter>); await screen.findByText('Sin conexión');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('No hay existencias para estos filtros.')).toBeInTheDocument();
  });
});


it.each(['ADMIN', 'VENDEDOR', 'TECNICO'] as const)('does not reopen old movement forms from a bookmarked stock query (%s)', async (role) => {
  useAuthStore.setState({ user: { ...session, role } });
  render(<MemoryRouter initialEntries={['/inventory/stock?operation=inbound']}><QuantityStockPage /></MemoryRouter>);
  await screen.findByText('Mouse Logitech');
  expect(screen.queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Cantidad que ingresa')).not.toBeInTheDocument();
});

it('distinguishes catalogue models from recorded stock when there are no quantities', async () => {
  vi.mocked(service.listQuantityStock).mockResolvedValue({ items: [], total: 0, page: 1, limit: 50 });
  render(<MemoryRouter><QuantityStockPage /></MemoryRouter>);
  await screen.findByText('No hay existencias para estos filtros.');
  expect(screen.getByText('Los productos del catálogo aparecen aquí después de registrar cantidades.')).toBeInTheDocument();
});

it('shows both serialized products and quantity products grouped by location and allows expanding serial units', async () => {
  const serializedItem = {
    id: 'unit-1',
    serialNumber: 'SN-LENOVO-01',
    catalogId: 'cat-lenovo',
    catalogName: 'Lenovo LOQ 15arp10',
    catalogSku: 'LEN-15',
    locationId: placeId,
    locationName: 'Almacén central',
    status: 'EN_STOCK' as const,
    parentChassisId: null,
    costPrice: 800,
    salePrice: 1200,
    createdAt: '2026-11-20T10:00:00Z',
    updatedAt: '2026-11-20T10:00:00Z',
  };
  vi.mocked(listHardwareUnits).mockResolvedValue({ items: [serializedItem], total: 1, page: 1, limit: 50 });
  const user = userEvent.setup();
  render(<MemoryRouter><QuantityStockPage /></MemoryRouter>);

  // Both should be visible
  expect(await screen.findByText('Mouse Logitech')).toBeInTheDocument();
  expect(screen.getAllByText('Por cantidad').length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText('Lenovo LOQ 15arp10')).toBeInTheDocument();
  expect(screen.getAllByText('Por serie').length).toBeGreaterThanOrEqual(1);

  // Verify units action without quantity inside the button
  const viewUnitsBtn = screen.getByRole('button', { name: 'Ver unidades' });
  expect(viewUnitsBtn).toBeInTheDocument();
  await user.click(viewUnitsBtn);
  expect(screen.getByRole('dialog', { name: 'Unidades disponibles' })).toBeInTheDocument();
  expect(screen.getByText('SN-LENOVO-01')).toBeInTheDocument();

  // Close modal
  await user.click(screen.getByRole('button', { name: 'Cerrar' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  // Filter by control type: Por serie
  await user.click(screen.getByText('Más filtros'));
  await user.selectOptions(screen.getByLabelText('Tipo de control'), 'SERIAL');
  expect(screen.queryByText('Mouse Logitech')).not.toBeInTheDocument();
  expect(screen.getByText('Lenovo LOQ 15arp10')).toBeInTheDocument();

  // Filter by control type: Por cantidad
  await user.selectOptions(screen.getByLabelText('Tipo de control'), 'QUANTITY');
  expect(screen.getByText('Mouse Logitech')).toBeInTheDocument();
  expect(screen.queryByText('Lenovo LOQ 15arp10')).not.toBeInTheDocument();
});

it('correctly resolves real brand, model, SKU and price for serialized products from catalog', async () => {
  const serializedRaw = {
    id: 'unit-raw',
    serialNumber: 'SN-LEN-RAW-99',
    catalogId: 'cat-laptop-loq',
    locationId: placeId,
    status: 'EN_STOCK' as const,
    parentChassisId: null,
    costPrice: 900,
    salePrice: 1500,
    createdAt: '2026-11-21T10:00:00Z',
    updatedAt: '2026-11-21T10:00:00Z',
  };
  vi.mocked(listHardwareUnits).mockResolvedValue({ items: [serializedRaw], total: 1, page: 1, limit: 50 });
  const catalogDetailItem = {
    id: 'cat-laptop-loq',
    sku: 'LOQ-ARP9',
    name: 'Lenovo LOQ ARP9',
    brand: 'Lenovo',
    model: 'LOQ ARP9',
    categoryId,
    processor: 'AMD Ryzen 7',
    ramCapacity: '16GB',
    storageCapacity: '512GB',
    gpu: 'RTX 4060',
    screenSize: '15.6',
    isSerialized: true,
    minStockThreshold: 2,
    basePrice: 1500,
    isSecondHand: false,
    active: true,
    createdAt: '',
  };
  vi.mocked(getCatalogDetail).mockResolvedValue({
    item: catalogDetailItem,
    categoryName: 'Laptops',
    stockSummary: [],
    totalStockOverall: 1,
  });

  render(<MemoryRouter><QuantityStockPage /></MemoryRouter>);

  // Should display the enriched brand/model and SKU subtitle, avoiding "—" in code
  expect(await screen.findByText('Lenovo LOQ ARP9')).toBeInTheDocument();
  expect(screen.getByText('Código: LOQ-ARP9')).toBeInTheDocument();
  expect(screen.queryByRole('cell', { name: /Producto/ })).not.toBeInTheDocument();
});
