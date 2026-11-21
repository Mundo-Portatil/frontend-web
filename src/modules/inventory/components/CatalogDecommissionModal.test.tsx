import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as catalogService from '../services/catalogService';
import * as hardwareService from '../services/hardwareItemService';
import type { CatalogItem } from '../catalogModels';
import { CatalogDecommissionModal } from './CatalogDecommissionModal';

vi.mock('../services/catalogService', () => ({
  setCatalogActive: vi.fn(),
}));

vi.mock('../services/hardwareItemService', () => ({
  getAvailableSerials: vi.fn(),
  decommissionHardwareItem: vi.fn(),
}));

const mockItem: CatalogItem = {
  id: 'prod-1',
  brand: 'Lenovo',
  model: 'ThinkPad T14',
  sku: 'LEN-T14-01',
  categoryId: 'cat-1',
  basePrice: 3200,
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
};

describe('CatalogDecommissionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hardwareService.getAvailableSerials).mockResolvedValue([
      { id: 'item-serial-1', serialNumber: 'SN-T14-001', salePrice: 3200, locationId: 'loc-1', catalogId: 'prod-1', createdAt: '' },
    ]);
  });

  it('renders tabs and decommissions a serial with mandatory reason', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <CatalogDecommissionModal
        item={mockItem}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    expect(await screen.findByText(/SN-T14-001/i)).toBeInTheDocument();

    const reasonInput = screen.getByLabelText(/Motivo obligatorio de la baja/i);
    await user.type(reasonInput, 'Pantalla rota irreparablemente');

    const submitBtn = screen.getByRole('button', { name: 'Confirmar Baja de Serie' });
    await user.click(submitBtn);

    expect(hardwareService.decommissionHardwareItem).toHaveBeenCalledWith(
      'item-serial-1',
      'Pantalla rota irreparablemente',
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('switches to deactivate model tab and deactivates catalog item', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <CatalogDecommissionModal
        item={mockItem}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    const deactivateTab = screen.getByRole('button', { name: 'Desactivar Modelo de Catálogo' });
    await user.click(deactivateTab);

    expect(screen.getByText(/Al dar de baja este modelo en el catálogo/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Baja del Modelo' });
    await user.click(confirmBtn);

    expect(catalogService.setCatalogActive).toHaveBeenCalledWith('prod-1', false);
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
