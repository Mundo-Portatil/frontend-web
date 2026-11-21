import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as pdfService from '../../../services/printer/labelPdfService';
import * as barcodeService from '../services/barcodeLabelService';
import * as catalogService from '../services/catalogService';
import * as hardwareService from '../services/hardwareItemService';
import * as inventoryService from '../services/inventoryService';
import { InventoryLabelsPage } from './InventoryLabelsPage';

vi.mock('../services/catalogService', () => ({
  listCatalog: vi.fn(),
}));

vi.mock('../services/inventoryService', () => ({
  getBarcodeLabelsByModel: vi.fn(),
}));

vi.mock('../services/barcodeLabelService', () => ({
  getBatchLabels: vi.fn(),
}));

vi.mock('../services/hardwareItemService', () => ({
  listHardwareItems: vi.fn(),
}));

vi.mock('../../../services/printer/labelPdfService', () => ({
  openLabelsPdf: vi.fn(),
  downloadLabelsPdf: vi.fn(),
}));

const mockNonSerializedProduct = {
  id: 'cat-mouse',
  brand: 'Logitech',
  model: 'M170',
  sku: 'M170',
  basePrice: 35,
  categoryId: 'cat-1',
  isSerialized: false,
  active: true,
  createdAt: '',
};

const mockSerializedProduct = {
  id: 'cat-laptop',
  brand: 'Acer',
  model: 'Aspire 5',
  sku: 'NB-ACER-001',
  basePrice: 2200,
  categoryId: 'cat-1',
  isSerialized: true,
  active: true,
  createdAt: '',
};

describe('InventoryLabelsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogService.listCatalog).mockResolvedValue({
      items: [mockNonSerializedProduct as any, mockSerializedProduct as any],
      total: 2,
      page: 1,
      limit: 50,
    });
    vi.mocked(inventoryService.getBarcodeLabelsByModel).mockResolvedValue([
      {
        barcodeValue: 'M170',
        title: 'Logitech M170',
        specsSummary: '',
        price: 35,
        copyNumber: 1,
        totalCopies: 2,
      },
      {
        barcodeValue: 'M170',
        title: 'Logitech M170',
        specsSummary: '',
        price: 35,
        copyNumber: 2,
        totalCopies: 2,
      },
    ]);
    vi.mocked(barcodeService.getBatchLabels).mockResolvedValue([
      {
        barcodeValue: 'SN-001',
        title: 'Acer Aspire 5',
        specsSummary: '',
        price: 2200,
      },
    ]);
    vi.mocked(hardwareService.listHardwareItems).mockResolvedValue([
      {
        id: 'item-uuid-1',
        serialNumber: 'SN-001',
        status: 'EN_STOCK',
        locationName: 'Almacén Central',
        salePrice: 2200,
        createdAt: '',
      } as any,
    ]);
  });

  it('generates labels by model in Mode 1 filtering only non-serialized products and opens PDF', async () => {
    const user = userEvent.setup();
    render(<InventoryLabelsPage />);

    expect(screen.getByRole('heading', { name: 'Centro de Etiquetas 1D (Códigos de Barras)' })).toBeInTheDocument();

    // Select non-serialized product (serialized models must be filtered out)
    const combo = screen.getByPlaceholderText('Busca por nombre o código…');
    await user.click(combo);
    expect(await screen.findByRole('option', { name: 'Logitech M170 · M170' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Acer Aspire 5 · NB-ACER-001' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Logitech M170 · M170' }));

    // Set copies
    const copiesInput = screen.getByLabelText(/Cantidad de copias/i);
    fireEvent.change(copiesInput, { target: { value: '2' } });

    // Verify location selector does NOT exist (requirement: Sin ubicación)
    expect(screen.queryByLabelText(/Ubicación/i)).not.toBeInTheDocument();

    // Generate
    const generateBtn = screen.getByRole('button', { name: 'Generar Etiquetas por Modelo' });
    await user.click(generateBtn);

    expect(inventoryService.getBarcodeLabelsByModel).toHaveBeenCalledWith({
      catalogId: 'cat-mouse',
      copies: 2,
    });

    expect(await screen.findByText('Vista Previa de Etiquetas (2)')).toBeInTheDocument();
    expect(screen.getByText('Copia 1 / 2')).toBeInTheDocument();

    // Verify no location appears in label preview
    expect(screen.queryByText(/Ubicación:/i)).not.toBeInTheDocument();

    // Open PDF
    const printPdfBtn = screen.getByRole('button', { name: 'Abrir PDF para Impresión' });
    await user.click(printPdfBtn);
    expect(pdfService.openLabelsPdf).toHaveBeenCalled();
  });

  it('switches to Mode 2 and generates labels by selecting registered serials', async () => {
    const user = userEvent.setup();
    render(<InventoryLabelsPage />);

    const mode2Tab = screen.getByRole('button', { name: /Modo 2: Por Series Registradas/i });
    await user.click(mode2Tab);

    // Select serialized product (non-serialized models must be filtered out)
    const combo = screen.getByPlaceholderText('Busca por nombre o código…');
    await user.click(combo);
    expect(await screen.findByRole('option', { name: 'Acer Aspire 5 · NB-ACER-001' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Logitech M170 · M170' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Acer Aspire 5 · NB-ACER-001' }));

    // Verify serials are fetched and shown with checkboxes
    expect(await screen.findByText('SN-001')).toBeInTheDocument();

    const generateBtn = screen.getByRole('button', { name: 'Generar Etiquetas por Series' });
    await user.click(generateBtn);

    expect(barcodeService.getBatchLabels).toHaveBeenCalledWith(['item-uuid-1']);
    expect(await screen.findByText('Vista Previa de Etiquetas (1)')).toBeInTheDocument();
    expect(screen.getAllByText('SN-001').length).toBeGreaterThanOrEqual(1);
  });
});
