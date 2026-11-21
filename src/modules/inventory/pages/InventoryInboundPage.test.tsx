import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as catalogService from '../services/catalogService';
import * as categoryService from '../services/categoryService';
import * as hardwareService from '../services/hardwareItemService';
import * as inventoryService from '../services/inventoryService';
import { InventoryInboundPage } from './InventoryInboundPage';

vi.mock('../services/catalogService', () => ({
  listCatalog: vi.fn(),
  createCatalogItem: vi.fn(),
}));

vi.mock('../services/categoryService', () => ({
  listCategories: vi.fn(),
}));

vi.mock('../services/hardwareItemService', () => ({
  validateSerials: vi.fn(),
}));

vi.mock('../services/inventoryService', () => ({
  inboundInventory: vi.fn(),
}));

const mockProduct = {
  id: 'cat-mouse',
  brand: 'Logitech',
  model: 'M170',
  sku: 'M170',
  basePrice: 30,
  categoryId: 'cat-acc',
  isSerialized: false,
  active: true,
  createdAt: '',
};

const mockLaptop = {
  id: 'cat-laptop',
  brand: 'Acer',
  model: 'Aspire 5',
  sku: 'NB-ACER-001',
  basePrice: 2200,
  categoryId: 'cat-nb',
  isSerialized: true,
  active: true,
  createdAt: '',
};

describe('InventoryInboundPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoryService.listCategories).mockResolvedValue([
      { id: 'cat-laptops', name: 'Laptops', description: null, active: true, createdAt: '' },
    ]);
    vi.mocked(catalogService.createCatalogItem).mockResolvedValue({
      id: 'cat-hp-new',
      brand: 'HP',
      model: 'Pavilion 15',
      sku: 'LAP-123456',
      categoryId: 'cat-laptops',
      basePrice: 2800,
      minStockThreshold: 2,
      isSerialized: true,
      isSecondHand: false,
      active: true,
      processor: null,
      ramCapacity: null,
      storageCapacity: null,
      gpu: null,
      screenSize: null,
      createdAt: '',
    });
    vi.mocked(catalogService.listCatalog).mockResolvedValue({
      items: [mockLaptop as any, mockProduct as any],
      total: 2,
      page: 1,
      limit: 50,
    });
    vi.mocked(hardwareService.validateSerials).mockResolvedValue({
      existingSerials: [],
      allValid: true,
    });
    vi.mocked(inventoryService.inboundInventory).mockResolvedValue({
      batchId: 'BATCH-2026-001',
      locationId: 'loc-central',
      locationName: 'Almacén Central',
      totalItems: 1,
      totalUnits: 1,
      results: [
        {
          catalogId: 'cat-laptop',
          catalogSku: 'NB-ACER-001',
          catalogBrand: 'Acer',
          catalogModel: 'Aspire 5',
          quantity: 1,
          hasSerialNumbers: true,
          serialsCreated: ['SN-NX-001'],
          totalStockResulting: 5,
        },
      ],
      createdAt: '2026-11-21T00:00:00Z',
    });
  });

  it('renders fixed destination badge and builds mixed batch for confirmation', async () => {
    const user = userEvent.setup();
    render(<InventoryInboundPage />);

    expect(screen.getByText('Destino: Almacén Central')).toBeInTheDocument();

    // Select laptop
    const combo = screen.getByRole('combobox');
    await user.click(combo);
    await user.click(await screen.findByRole('option', { name: 'Acer Aspire 5 · NB-ACER-001' }));

    // Verify serial grid is active and type serial
    const serialInput = screen.getByLabelText('Serie #1');
    await user.type(serialInput, 'SN-NX-001');

    // Add to batch
    const addBtn = screen.getByRole('button', { name: /Agregar al Lote/i });
    await user.click(addBtn);

    expect(hardwareService.validateSerials).toHaveBeenCalledWith(['SN-NX-001']);
    expect(await screen.findByText('2. Resumen del Lote a Registrar (1 modelos | 1 unidades)')).toBeInTheDocument();

    // Confirm inbound
    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Ingreso al Almacén' });
    await user.click(confirmBtn);

    expect(inventoryService.inboundInventory).toHaveBeenCalledWith({
      items: [
        {
          catalogId: 'cat-laptop',
          quantity: 1,
          hasSerialNumbers: true,
          serialNumbers: ['SN-NX-001'],
          costPrice: undefined,
          salePrice: 2200,
        },
      ],
      notes: undefined,
    });

    // Check post-inbound print modal appears
    expect(await screen.findByRole('heading', { name: '¡Ingreso Registrado con Éxito!' })).toBeInTheDocument();
    expect(screen.getByText('BATCH-2026-001')).toBeInTheDocument();
  });

  it('allows switching to Nuevo modelo mode, autogenerates SKU, renders immediate serials, creates catalog item and registers inbound', async () => {
    const user = userEvent.setup();
    render(<InventoryInboundPage />);

    // Switch to "Nuevo modelo"
    const newModelTab = screen.getByRole('button', { name: 'Nuevo modelo' });
    await user.click(newModelTab);

    // Verify form fields
    const brandInput = screen.getByLabelText(/^Marca/i);
    const modelInput = screen.getByLabelText(/^Modelo/i);
    const priceInput = screen.getByLabelText(/Precio Base \/ Venta/i);

    await user.type(brandInput, 'HP');
    await user.type(modelInput, 'Pavilion 15');
    await user.type(priceInput, '2800');

    // Immediate serial input is shown (since default is quantity=1 and requiresSerials=true)
    const serialInput = screen.getByLabelText('Serie #1');
    await user.type(serialInput, 'SN-HP-001');

    // Add to batch
    const addBtn = screen.getByRole('button', { name: /Agregar al Lote/i });
    await user.click(addBtn);

    // Item added to batch with badge "Nuevo modelo"
    expect(await screen.findByText('HP Pavilion 15')).toBeInTheDocument();
    expect(screen.getAllByText('Nuevo modelo').length).toBeGreaterThanOrEqual(2);

    // Confirm inbound
    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Ingreso al Almacén' });
    await user.click(confirmBtn);

    // Verifies createCatalogItem was called with autogenerated SKU
    expect(catalogService.createCatalogItem).toHaveBeenCalledWith(
      expect.objectContaining({
        brand: 'HP',
        model: 'Pavilion 15',
        basePrice: 2800,
        sku: expect.stringMatching(/^LAP-[0-9A-Z]{6}$/),
      }),
    );

    // Verifies inbound was registered with the created catalog ID
    expect(inventoryService.inboundInventory).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            catalogId: 'cat-hp-new',
            quantity: 1,
            hasSerialNumbers: true,
            serialNumbers: ['SN-HP-001'],
          }),
        ],
      }),
    );
  });
});
