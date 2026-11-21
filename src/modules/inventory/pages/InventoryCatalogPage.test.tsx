import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as catalogService from '../services/catalogService';
import * as categoryService from '../services/categoryService';
import * as stockService from '../services/quantityStockService';
import { InventoryCatalogPage } from './InventoryCatalogPage';

vi.mock('../services/catalogService', () => ({
  listCatalog: vi.fn(),
  getCatalogDetail: vi.fn(),
  createCatalogItem: vi.fn(),
  updateCatalogItem: vi.fn(),
  setCatalogActive: vi.fn(),
}));

vi.mock('../services/categoryService', () => ({
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
}));

vi.mock('../services/quantityStockService', () => ({
  listQuantityStock: vi.fn(),
}));

const mockCategories = [
  { id: 'cat-laptops', name: 'Laptops', description: null, active: true, productsCount: 5, createdAt: '' },
];

const mockCatalogItem = {
  id: 'prod-1',
  brand: 'Acer',
  model: 'Aspire 5',
  sku: 'MP-CAT-0001',
  categoryId: 'cat-laptops',
  basePrice: 2400,
  isSerialized: true,
  minStockThreshold: 2,
  isSecondHand: false,
  active: true,
  processor: 'Core i5',
  ramCapacity: '16GB',
  createdAt: '',
};

const mockStockItem = {
  id: 'stock-1',
  catalogId: 'prod-1',
  catalogBrand: 'Acer',
  catalogModel: 'Aspire 5',
  catalogSku: 'MP-CAT-0001',
  categoryId: 'cat-laptops',
  locationId: 'loc-1',
  locationName: 'Almacén Central',
  quantity: 5,
  costPrice: 2000,
  salePrice: 2400,
  minStockThreshold: 2,
  isLowStock: false,
  updatedAt: '',
};

describe('InventoryCatalogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoryService.listCategories).mockResolvedValue(mockCategories);
    vi.mocked(catalogService.listCatalog).mockResolvedValue({
      items: [mockCatalogItem as any],
      total: 1,
      page: 1,
      limit: 15,
    });
    vi.mocked(stockService.listQuantityStock).mockResolvedValue({
      items: [mockStockItem],
      total: 1,
      page: 1,
      limit: 100,
    });
  });

  it('renders enriched catalog table with stock, code, and exactly 3 action buttons with equal height classes', async () => {
    render(<InventoryCatalogPage />);
    expect(await screen.findByRole('heading', { level: 2, name: 'Catálogo de Productos' })).toBeInTheDocument();
    expect(await screen.findByText('Acer Aspire 5')).toBeInTheDocument();
    expect(screen.getByText('MP-CAT-0001')).toBeInTheDocument();
    expect(screen.getByText('5 uds.')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();

    // Verify + Nuevo Modelo en Catálogo button does NOT exist
    expect(screen.queryByRole('button', { name: /\+ Nuevo Modelo en Catálogo/i })).not.toBeInTheDocument();

    // Check exactly 3 actions per product and their uniform classes
    const viewBtn = screen.getByRole('button', { name: 'Ver ficha' });
    const editBtn = screen.getByRole('button', { name: 'Editar' });
    const decommissionBtn = screen.getByRole('button', { name: 'Dar de baja' });

    expect(viewBtn).toHaveClass('whitespace-nowrap', 'h-8', 'px-3');
    expect(editBtn).toHaveClass('whitespace-nowrap', 'h-8', 'px-3');
    expect(decommissionBtn).toHaveClass('whitespace-nowrap', 'h-8', 'px-3');
  });

  it('opens edit modal when clicking Editar button', async () => {
    const user = userEvent.setup();
    render(<InventoryCatalogPage />);
    await screen.findByText('Acer Aspire 5');

    const editBtn = screen.getByRole('button', { name: 'Editar' });
    await user.click(editBtn);

    expect(screen.getByRole('heading', { name: 'Editar Modelo en Catálogo' })).toBeInTheDocument();
  });
});
