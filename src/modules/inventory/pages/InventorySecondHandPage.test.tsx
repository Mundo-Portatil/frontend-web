import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as locationService from '../../foundation/locations/services/locationService';
import * as hardwareService from '../services/hardwareItemService';
import { InventorySecondHandPage } from './InventorySecondHandPage';

vi.mock('../../foundation/locations/services/locationService', () => ({
  listActiveLocations: vi.fn(),
}));

vi.mock('../services/hardwareItemService', () => ({
  listPendingSecondHand: vi.fn(),
  approveUsedItem: vi.fn(),
  decommissionHardwareItem: vi.fn(),
}));

const mockUsedItem = {
  id: 'used-1',
  serialNumber: 'USED-SN-999',
  catalogId: 'cat-ram',
  catalogBrand: 'Kingston',
  catalogModel: 'Fury 8GB DDR4',
  catalogSku: 'RAM-KNG-001',
  locationId: 'loc-1',
  locationName: 'Taller Técnico',
  status: 'SEGUNDA_MANO_PENDIENTE' as const,
  costPrice: null,
  salePrice: null,
  createdAt: '2026-11-20T00:00:00Z',
  updatedAt: '2026-11-20T00:00:00Z',
};

describe('InventorySecondHandPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(locationService.listActiveLocations).mockResolvedValue([
      { id: 'loc-1', name: 'Almacén Central', type: 'ALMACEN_CENTRAL', active: true, createdAt: '' },
    ]);
    vi.mocked(hardwareService.listPendingSecondHand).mockResolvedValue([mockUsedItem]);
  });

  it('renders pending items and approves with itemId contract', async () => {
    const user = userEvent.setup();
    render(<InventorySecondHandPage />);

    expect(await screen.findByText('USED-SN-999')).toBeInTheDocument();
    expect(screen.getByText('Kingston Fury 8GB DDR4')).toBeInTheDocument();

    const approveBtn = screen.getByRole('button', { name: 'Aprobar Ingreso' });
    await user.click(approveBtn);

    expect(screen.getByRole('heading', { name: 'Aprobar Pieza de Segunda Mano' })).toBeInTheDocument();

    const priceInput = screen.getByLabelText(/Precio de venta establecido/i);
    await user.type(priceInput, '85.50');

    const submitBtn = screen.getByRole('button', { name: 'Aprobar e Ingresar a Stock' });
    await user.click(submitBtn);

    // Contract requirement: itemId, NOT hardwareItemId
    expect(hardwareService.approveUsedItem).toHaveBeenCalledWith({
      itemId: 'used-1',
      locationId: 'loc-1',
      salePrice: 85.5,
    });
  });

  it('allows discarding a used item with reason', async () => {
    const user = userEvent.setup();
    render(<InventorySecondHandPage />);

    expect(await screen.findByText('USED-SN-999')).toBeInTheDocument();

    const discardBtn = screen.getByRole('button', { name: 'Descartar' });
    await user.click(discardBtn);

    expect(screen.getByRole('heading', { name: 'Dar de Baja Lógica' })).toBeInTheDocument();

    const reasonInput = screen.getByLabelText(/Motivo de la baja/i);
    await user.type(reasonInput, 'Pines quemados');

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Baja' });
    await user.click(confirmBtn);

    expect(hardwareService.decommissionHardwareItem).toHaveBeenCalledWith('used-1', 'Pines quemados');
  });
});
