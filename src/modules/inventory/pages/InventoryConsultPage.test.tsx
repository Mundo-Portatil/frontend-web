import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../../stores/authStore';
import * as locationService from '../../foundation/locations/services/locationService';
import * as hardwareService from '../services/hardwareItemService';
import * as stockService from '../services/quantityStockService';
import * as categoryService from '../services/categoryService';
import * as catalogService from '../services/catalogService';
import { InventoryStockPage } from './InventoryStockPage';

vi.mock('../../foundation/locations/services/locationService', () => ({
  listActiveLocations: vi.fn(),
}));

vi.mock('../services/categoryService', () => ({
  listCategories: vi.fn(),
}));

vi.mock('../services/catalogService', () => ({
  listCatalog: vi.fn(),
}));

vi.mock('../services/quantityStockService', () => ({
  listQuantityStock: vi.fn(),
  adjustQuantityStock: vi.fn(),
}));

vi.mock('../services/hardwareItemService', () => ({
  scanHardware: vi.fn(),
  getAvailableSerials: vi.fn(),
  decommissionHardwareItem: vi.fn(),
  getHardwareLifecycle: vi.fn(),
}));

const adminUser = {
  id: 'admin-1',
  name: 'Admin',
  email: 'admin@mp.pe',
  role: 'ADMIN' as const,
  active: true,
};

const sampleStockItem = {
  id: 'stock-1',
  catalogId: 'cat-1',
  catalogBrand: 'Acer',
  catalogModel: 'Aspire 5',
  catalogSku: 'NB-ACER-001',
  locationId: 'loc-1',
  locationName: 'Almacén Central',
  quantity: 2,
  costPrice: 1500,
  salePrice: 2200,
  minStockThreshold: 3,
  isLowStock: true,
  updatedAt: '2026-11-21T00:00:00Z',
};

describe('InventoryStockPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ status: 'authenticated', user: adminUser });
    vi.mocked(locationService.listActiveLocations).mockResolvedValue([
      { id: 'loc-1', name: 'Almacén Central', type: 'ALMACEN_CENTRAL', active: true, createdAt: '' },
    ]);
    vi.mocked(categoryService.listCategories).mockResolvedValue([
      { id: 'cat-laptops', name: 'Laptops', description: null, active: true, createdAt: '' },
    ]);
    vi.mocked(stockService.listQuantityStock).mockResolvedValue({
      items: [sampleStockItem],
      total: 1,
      page: 1,
      limit: 20,
    });
    vi.mocked(catalogService.listCatalog).mockResolvedValue({
      items: [
        {
          id: 'cat-zero',
          brand: 'Dell',
          model: 'Inspiron 15',
          sku: 'DELL-001',
          categoryId: 'cat-laptops',
          basePrice: 2600,
          minStockThreshold: 2,
          isSerialized: true,
          active: true,
          createdAt: '',
        } as any,
      ],
      total: 1,
      page: 1,
      limit: 100,
    });
    vi.mocked(hardwareService.getAvailableSerials).mockResolvedValue([
      {
        id: 'ser-1',
        serialNumber: 'SN-NXA515-001',
        catalogId: 'cat-1',
        locationId: 'loc-1',
        salePrice: 2200,
        createdAt: '',
      },
    ]);
  });

  it('renders heading, scanner quick bar, and unified stock table with low stock alert', async () => {
    render(<InventoryStockPage />);
    expect(screen.getByRole('heading', { name: 'Stock e Inventario' })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Pistolee o escriba N\/S o código de barras/i),
    ).toBeInTheDocument();

    expect(await screen.findByText('Acer Aspire 5')).toBeInTheDocument();
    expect(screen.getByText('NB-ACER-001')).toBeInTheDocument();
    expect(screen.getAllByText('Almacén Central').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Stock bajo')).toBeInTheDocument();

    // Verify neither Ajustar nor Dar de baja buttons exist here
    expect(screen.queryByRole('button', { name: /Ajustar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Dar de baja/i })).not.toBeInTheDocument();
  });

  it('expands series under demand showing only Hoja de Vida and Imprimir Etiqueta 1D', async () => {
    const user = userEvent.setup();
    render(<InventoryStockPage />);
    await screen.findByText('Acer Aspire 5');

    const seriesBtns = screen.getAllByRole('button', { name: /Ver series/i });
    await user.click(seriesBtns[0]);

    expect(hardwareService.getAvailableSerials).toHaveBeenCalledWith({
      catalogId: 'cat-1',
      locationId: 'loc-1',
    });
    expect(await screen.findByText('• SN-NXA515-001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hoja de Vida' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Imprimir Etiqueta 1D' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Dar de baja/i })).not.toBeInTheDocument();
  });

  it('allows scanner lookup from top bar', async () => {
    vi.mocked(hardwareService.scanHardware).mockResolvedValue({
      id: 'scanned-1',
      serialNumber: 'SN-SCANNED-999',
      catalogId: 'cat-1',
      catalogBrand: 'Acer',
      catalogModel: 'Aspire 5',
      catalogSku: 'NB-ACER-001',
      locationId: 'loc-1',
      locationName: 'Almacén Central',
      status: 'EN_STOCK',
      costPrice: 1500,
      salePrice: 2200,
      createdAt: '',
      updatedAt: '',
    });

    const user = userEvent.setup();
    render(<InventoryStockPage />);

    const input = screen.getByPlaceholderText(/Pistolee o escriba N\/S/i);
    await user.type(input, 'SN-SCANNED-999{Enter}');

    expect(hardwareService.scanHardware).toHaveBeenCalledWith('SN-SCANNED-999');
    expect(await screen.findByText('SN-SCANNED-999')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hoja de Vida' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Imprimir Etiqueta 1D' })).toBeInTheDocument();
  });

  it('toggles inclusion of models with 0 stock crossing with catalog', async () => {
    const user = userEvent.setup();
    render(<InventoryStockPage />);
    await screen.findByText('Acer Aspire 5');

    const zeroCheckbox = screen.getByLabelText(/Incluir modelos sin stock \(0\)/i);
    await user.click(zeroCheckbox);

    expect(catalogService.listCatalog).toHaveBeenCalled();
    expect(await screen.findByText('Dell Inspiron 15')).toBeInTheDocument();
    expect(screen.getByText('DELL-001')).toBeInTheDocument();
  });

  it('allows real-time filtering of stock table by brand, model or tag code', async () => {
    const user = userEvent.setup();
    render(<InventoryStockPage />);
    expect(await screen.findByText('Acer Aspire 5')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Buscar por marca, modelo o cód\. etiqueta/i);
    await user.type(searchInput, 'NonExistentProduct');

    expect(screen.queryByText('Acer Aspire 5')).not.toBeInTheDocument();

    await user.clear(searchInput);
    expect(await screen.findByText('Acer Aspire 5')).toBeInTheDocument();
  });
});
