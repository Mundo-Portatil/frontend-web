import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { CatalogUnitsPanel } from './CatalogUnitsPanel';
import { getHardwareLifecycle, listHardwareUnits } from '../services/hardwareReadService';
import type { HardwareItem } from '../hardwareModels';

vi.mock('../services/hardwareReadService', () => ({ getHardwareLifecycle: vi.fn(), listHardwareUnits: vi.fn() }));
const places = [{ locationId: 'central', locationName: 'Almacén Central', locationType: 'ALMACEN_CENTRAL', serializedCount: 1, quantityCount: 0, totalAvailable: 1 }];
const item: HardwareItem = { id: 'unit', catalogId: 'product', locationId: 'central', serialNumber: 'SN-123', status: 'EN_STOCK', parentChassisId: null, costPrice: null, salePrice: null, createdAt: '', updatedAt: '', components: [{ id: 'child', catalogId: 'ram', locationId: 'central', serialNumber: 'RAM-1', status: 'EN_STOCK', parentChassisId: 'unit', costPrice: null, salePrice: null, createdAt: '', updatedAt: '' }] };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(listHardwareUnits).mockResolvedValue({ items: [item], total: 1, page: 1, limit: 50 });
  vi.mocked(getHardwareLifecycle).mockResolvedValue({ hardwareItemId: 'unit', serialNumber: 'SN-123', events: [{ id: 'event', action: 'BATCH_INBOUND_HARDWARE', module: 'hardware-items', timestamp: '2026-11-19T15:00:00Z', userName: 'Ana', payload: { parentCount: 1 } }] });
});

it('loads units only after opening and preserves their series, location and components', async () => {
  const user = userEvent.setup();
  render(<CatalogUnitsPanel catalogId="product" locations={places} />);
  expect(listHardwareUnits).not.toHaveBeenCalled();
  const summary = screen.getByText('Ver unidades');
  const unitsDetails = summary.closest('details')!;
  expect(summary.tagName).toBe('SUMMARY');
  expect(summary).toHaveClass('w-full', 'cursor-pointer', 'hover:bg-slate-50');
  await user.click(summary);
  expect(await screen.findByText('Serie: SN-123')).toBeInTheDocument();
  expect(screen.getByText('RAM-1 · En stock')).toBeInTheDocument();
  expect(listHardwareUnits).toHaveBeenCalledWith({ catalogItemId: 'product', page: 1, limit: 50, status: 'EN_STOCK' }, expect.any(AbortSignal));
  expect(getHardwareLifecycle).not.toHaveBeenCalled();
  const historySummary = screen.getByText('Historial de SN-123');
  const historyDetails = historySummary.closest('details')!;
  expect(historySummary.tagName).toBe('SUMMARY');
  expect(historySummary).toHaveClass('-mx-2', 'w-auto', 'px-2', 'cursor-pointer', 'hover:bg-slate-50');
  await user.click(historySummary);
  expect(await screen.findByText('Registró un ingreso de equipos por número de serie · 1 equipos o piezas')).toBeInTheDocument();
  expect(screen.getByText('Equipos y componentes · Ana')).toBeInTheDocument();
  expect(getHardwareLifecycle).toHaveBeenCalledWith('unit', expect.any(AbortSignal));
  expect(historyDetails).toHaveAttribute('open');
  expect(unitsDetails).toHaveAttribute('open');
  await user.click(historySummary);
  expect(historyDetails).not.toHaveAttribute('open');
  expect(unitsDetails).toHaveAttribute('open');
});

it('uses server pagination and resets it when the location or status changes', async () => {
  vi.mocked(listHardwareUnits).mockResolvedValueOnce({ items: [item], total: 51, page: 1, limit: 50 }).mockResolvedValue({ items: [item], total: 51, page: 2, limit: 50 });
  const user = userEvent.setup();
  render(<CatalogUnitsPanel catalogId="product" locations={places} />);
  await user.click(screen.getByText('Ver unidades'));
  await user.click(await screen.findByRole('button', { name: 'Más unidades' }));
  await waitFor(() => expect(listHardwareUnits).toHaveBeenLastCalledWith({ catalogItemId: 'product', page: 2, limit: 50, status: 'EN_STOCK' }, expect.any(AbortSignal)));
  await user.selectOptions(screen.getByLabelText('Ubicación de las unidades'), 'central');
  await waitFor(() => expect(listHardwareUnits).toHaveBeenLastCalledWith({ catalogItemId: 'product', locationId: 'central', page: 1, limit: 50, status: 'EN_STOCK' }, expect.any(AbortSignal)));
  await user.selectOptions(screen.getByLabelText('Estado de las unidades'), '');
  await waitFor(() => expect(listHardwareUnits).toHaveBeenLastCalledWith({ catalogItemId: 'product', locationId: 'central', page: 1, limit: 50 }, expect.any(AbortSignal)));
});

it('shows history errors and retries without claiming an empty successful history', async () => {
  vi.mocked(getHardwareLifecycle).mockRejectedValueOnce({ kind: 'network', message: 'Sin conexión' }).mockResolvedValue({ hardwareItemId: 'unit', serialNumber: 'SN-123', events: [] });
  const user = userEvent.setup();
  render(<CatalogUnitsPanel catalogId="product" locations={places} />);
  await user.click(screen.getByText('Ver unidades'));
  await user.click(await screen.findByText('Historial de SN-123'));
  expect(await screen.findByText('Sin conexión')).toBeInTheDocument();
  expect(screen.queryByText('Sin movimientos registrados.')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(await screen.findByText('Sin movimientos registrados.')).toBeInTheDocument();
});

it('links a transfer event to its real guide without changing inventory', async () => {
  vi.mocked(getHardwareLifecycle).mockResolvedValue({ hardwareItemId: 'unit', serialNumber: 'SN-123', events: [{ id: 'transfer-event', action: 'TRANSFER_DIRECT_COMPLETED', module: 'transfers', timestamp: '2026-11-24T15:00:00Z', userName: 'Ana', payload: { transferId: 'real-transfer-id', code: 'TR-ABC123', fromLocationName: 'Central', toLocationName: 'Puesto 102' } }] });
  const user = userEvent.setup();
  render(<MemoryRouter><CatalogUnitsPanel catalogId="product" locations={places} /></MemoryRouter>);
  await user.click(screen.getByText('Ver unidades'));
  await user.click(await screen.findByText('Historial de SN-123'));
  expect(await screen.findByRole('link', { name: 'Ver guía del traslado' })).toHaveAttribute('href', '/logistics/real-transfer-id');
  expect(getHardwareLifecycle).toHaveBeenCalledTimes(1);
});
