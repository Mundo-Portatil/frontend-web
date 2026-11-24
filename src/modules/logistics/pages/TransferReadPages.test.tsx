import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../../stores/authStore';
import { listLocations } from '../../foundation/locations/services/locationService';
import { listTransfers, getTransferDetail } from '../services/transferService';
import { TransferHistoryPage } from './TransferHistoryPage';
import { TransferDetailPage } from './TransferDetailPage';
import type { Transfer, TransferDetail } from '../models';

vi.mock('../services/transferService', () => ({ listTransfers: vi.fn(), getTransferDetail: vi.fn() }));
vi.mock('../../foundation/locations/services/locationService', () => ({ listLocations: vi.fn() }));
const account = { id: 'admin', name: 'Ana', email: 'ana@mp.pe', role: 'ADMIN' as const, active: true };
const guide: Transfer = { id: 'guide', code: 'TR-ABC123', type: 'DIRECTO', status: 'COMPLETED', fromLocationId: 'central', fromLocationName: 'Almacén Central', toLocationId: 'puesto', toLocationName: 'Puesto 212', createdById: 'admin', createdByName: 'Ana', notes: null, createdAt: '2026-11-24T10:00:00Z', updatedAt: '2026-11-24T10:00:00Z', itemsCount: 1 };
const detail: TransferDetail = { ...guide, items: [{ id: 'line', catalogId: 'catalog', hardwareItemId: 'unit', serialNumber: 'SN-1', quantity: 1, sku: 'SKU', brand: 'Acer', model: 'A5' }] };
beforeEach(() => {
  vi.resetAllMocks();
  useAuthStore.setState({ status: 'authenticated', user: account });
  vi.mocked(listTransfers).mockResolvedValue([guide]);
  vi.mocked(getTransferDetail).mockResolvedValue(detail);
  vi.mocked(listLocations).mockResolvedValue([{ id: 'puesto', name: 'Puesto 212', type: 'PUESTO', active: true, createdAt: '' }]);
});
function history() { return render(<MemoryRouter><TransferHistoryPage /></MemoryRouter>); }
function showDetail() { return render(<MemoryRouter initialEntries={['/logistics/TR-ABC123']}><Routes><Route path="/logistics/:id" element={<TransferDetailPage />} /></Routes></MemoryRouter>); }

it('lists actual guides and sends only supported location/date filters', async () => {
  const user = userEvent.setup(); history();
  expect(await screen.findByRole('link', { name: 'Ver guía TR-ABC123' })).toHaveAttribute('href', '/logistics/guide');
  await screen.findByRole('option', { name: 'Puesto 212' });
  await user.selectOptions(screen.getByLabelText('Ubicación de la guía'), 'puesto');
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-01' } });
  await waitFor(() => expect(listTransfers).toHaveBeenLastCalledWith({ locationId: 'puesto', startDate: new Date('2026-11-01T00:00:00').toISOString() }, expect.any(AbortSignal)));
  expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
  const requests = vi.mocked(listTransfers).mock.calls.length;
  fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-01' } });
  expect(screen.getByText('La fecha inicial debe ser anterior o igual a la final.')).toBeInTheDocument();
  expect(listTransfers).toHaveBeenCalledTimes(requests);
});
it.each(['VENDEDOR', 'TECNICO'] as const)('keeps %s read-only and lets the backend scope its assigned post', async (role) => {
  useAuthStore.setState({ user: { ...account, role, locationId: 'puesto', locationName: 'Puesto 212' } }); history();
  await screen.findByRole('link', { name: 'Ver guía TR-ABC123' });
  expect(screen.queryByRole('link', { name: 'Nueva guía' })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Ubicación de la guía')).not.toBeInTheDocument();
  expect(listLocations).not.toHaveBeenCalled();
  expect(listTransfers).toHaveBeenCalledWith({ startDate: undefined, endDate: undefined }, expect.any(AbortSignal));
});
it.each(['VENDEDOR', 'TECNICO'] as const)('blocks history and detail queries for %s without a post', (role) => {
  useAuthStore.setState({ user: { ...account, role, locationId: null } });
  const view = history(); expect(screen.getByText(/No tienes un puesto asignado/)).toBeInTheDocument(); view.unmount();
  showDetail(); expect(screen.getByText(/No tienes un puesto asignado/)).toBeInTheDocument();
  expect(listTransfers).not.toHaveBeenCalled(); expect(getTransferDetail).not.toHaveBeenCalled();
});
it('shows a real detail and its serialized lines without costs or editing', async () => {
  showDetail();
  await screen.findByRole('heading', { name: 'TR-ABC123' });
  expect(screen.getByRole('cell', { name: 'SN-1' })).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: 'Acer A5' })).toBeInTheDocument();
  expect(getTransferDetail).toHaveBeenCalledWith('TR-ABC123', expect.any(AbortSignal));
  expect(screen.queryByText('Costo')).not.toBeInTheDocument();
});
it('does not disclose a forbidden detail and retries history failures', async () => {
  vi.mocked(getTransferDetail).mockRejectedValue({ status: 403, kind: 'forbidden', message: 'private details' });
  const view = showDetail(); await screen.findByText('No tienes acceso a esta guía.'); expect(screen.queryByText('private details')).not.toBeInTheDocument(); view.unmount();
  vi.mocked(listTransfers).mockRejectedValueOnce({ kind: 'network', message: 'Sin conexión' });
  const user = userEvent.setup(); history(); await screen.findByText('Sin conexión'); await user.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(await screen.findByRole('link', { name: 'Ver guía TR-ABC123' })).toBeInTheDocument();
});

it('cancels stale requests and hides guides when the session scope changes', async () => {
  let resolveOld!: (value: Transfer[]) => void;
  vi.mocked(listTransfers).mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
  history();
  const oldSignal = vi.mocked(listTransfers).mock.calls[0][1];
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-02' } });
  await screen.findByRole('link', { name: 'Ver guía TR-ABC123' });
  expect(oldSignal?.aborted).toBe(true);
  await act(async () => { resolveOld([{ ...guide, id: 'old', code: 'TR-OLD123' }]); });
  expect(screen.queryByText('TR-OLD123')).not.toBeInTheDocument();
  act(() => { useAuthStore.setState({ user: { ...account, role: 'TECNICO', locationId: null } }); });
  expect(screen.queryByRole('link', { name: 'Ver guía TR-ABC123' })).not.toBeInTheDocument();
  expect(screen.getByText(/No tienes un puesto asignado/)).toBeInTheDocument();
});

it('does not reload history when session profile refreshes with the same user identity and reloads only on explicit action', async () => {
  const user = userEvent.setup();
  history();
  await screen.findByRole('link', { name: 'Ver guía TR-ABC123' });
  expect(listTransfers).toHaveBeenCalledTimes(1);

  act(() => { useAuthStore.setState({ user: { ...account } }); });
  expect(screen.queryByText('Cargando guías…')).not.toBeInTheDocument();
  expect(listTransfers).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole('button', { name: 'Actualizar guías' }));
  await waitFor(() => expect(listTransfers).toHaveBeenCalledTimes(2));
});
