import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { selectCatalogProduct } from '../../../test/selectCatalogProduct';
import { QuantityStockPage } from './QuantityStockPage';
import * as service from '../services/quantityStockService';
import { listLocations } from '../../foundation/locations/services/locationService';
import { listCategories } from '../services/categoryService';
import { listCatalog } from '../services/catalogService';
import { useAuthStore } from '../../../stores/authStore';
import type { CatalogItem } from '../catalogModels';
vi.mock('../services/quantityStockService', () => ({ listQuantityStock: vi.fn(), inboundQuantityStock: vi.fn(), adjustQuantityStock: vi.fn() }));
vi.mock('../services/categoryService', () => ({ listCategories: vi.fn() }));
vi.mock('../services/catalogService', () => ({ listCatalog: vi.fn() }));
vi.mock('../../foundation/locations/services/locationService', () => ({ listLocations: vi.fn() }));
const placeId = '123e4567-e89b-42d3-a456-426614174000';
const productId = '223e4567-e89b-42d3-a456-426614174000';
const categoryId = '323e4567-e89b-42d3-a456-426614174000';
const stock = { id: 'stock', catalogId: productId, catalogName: 'Mouse Logitech', catalogSku: 'M170', locationId: placeId, locationName: 'Almacén central', quantity: 2, costPrice: 10, salePrice: 20, minStockThreshold: 5, isLowStock: true, updatedAt: '2026-11-14T21:40:00Z' };
const session = { id: 'self', name: 'Ana', email: 'a@mp.pe', role: 'ADMIN' as const, active: true };
beforeEach(() => {
  vi.resetAllMocks(); useAuthStore.setState({ status: 'authenticated', user: session });
  vi.mocked(service.listQuantityStock).mockResolvedValue({ items: [stock], total: 101, page: 1, limit: 50 });
  vi.mocked(listLocations).mockResolvedValue([{ id: placeId, name: 'Almacén central', active: true, type: 'ALMACEN_CENTRAL', createdAt: '' }]);
  vi.mocked(listCategories).mockResolvedValue([{ id: categoryId, name: 'Accesorios', description: null, active: true, createdAt: '' }]);
  vi.mocked(listCatalog).mockResolvedValue({ items: [{ id: productId, name: 'Mouse Logitech', sku: 'M170', isSerialized: false, active: true } as CatalogItem], page: 1, limit: 50, total: 1 });
});
describe('QuantityStockPage', () => {
  it.each(['ADMIN', 'VENDEDOR', 'TECNICO'] as const)('allows %s to consult and limits mutations to admin', async (role) => {
    useAuthStore.setState({ user: { ...session, role } }); render(<MemoryRouter><QuantityStockPage /></MemoryRouter>);
    expect(await screen.findByText('Mouse Logitech')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Cargando ubicaciones y categorías…')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Agregar o corregir cantidades' }) !== null).toBe(role === 'ADMIN');
    expect(screen.getByRole('cell', { name: 'Sí' })).toBeInTheDocument();
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
  it('creates inbound only after confirmation and displays server balance', async () => {
    vi.mocked(service.inboundQuantityStock).mockResolvedValue({ ...stock, quantity: 7 });
    vi.mocked(service.listQuantityStock).mockResolvedValueOnce({ items: [stock], total: 1, page: 1, limit: 50 }).mockResolvedValue({ items: [{ ...stock, quantity: 7 }], total: 1, page: 1, limit: 50 });
    const user = userEvent.setup(); render(<MemoryRouter><QuantityStockPage /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Agregar o corregir cantidades' }));
    await selectCatalogProduct(user, 'Producto por cantidad', 'Mouse Logitech · M170');
    await user.selectOptions(screen.getByLabelText('Ubicación de ingreso o ajuste'), placeId);
    await user.type(screen.getByLabelText('Cantidad que ingresa'), '5');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(service.inboundQuantityStock).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirmar operación' }));
    expect(await screen.findByText(/Saldo confirmado: 7/)).toBeInTheDocument();
    expect(await screen.findByRole('cell', { name: '7' })).toBeInTheDocument();
    expect(service.inboundQuantityStock).toHaveBeenCalledWith({ catalogId: productId, locationId: placeId, quantity: 5 });
  });
  it('requires reason and sends an absolute zero adjustment', async () => {
    vi.mocked(service.adjustQuantityStock).mockResolvedValue({ ...stock, quantity: 0 });
    const user = userEvent.setup(); render(<MemoryRouter><QuantityStockPage /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Agregar o corregir cantidades' }));
    await selectCatalogProduct(user, 'Producto por cantidad', 'Mouse Logitech · M170');
    await user.selectOptions(screen.getByLabelText('Operación'), 'adjust');
    await user.selectOptions(screen.getByLabelText('Ubicación de ingreso o ajuste'), placeId);
    await user.type(screen.getByLabelText('Nueva cantidad total'), '0');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('motivo');
    expect(screen.getByLabelText('Motivo del ajuste')).toHaveClass('resize-none', 'max-h-24');
    await user.type(screen.getByLabelText('Motivo del ajuste'), 'Conteo físico');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar operación' }));
    await screen.findByText(/Saldo confirmado: 0/);
    expect(service.adjustQuantityStock).toHaveBeenCalledWith({ catalogId: productId, locationId: placeId, newQuantity: 0, reason: 'Conteo físico' });
  });
  it('shows errors and retries empty lists', async () => {
    vi.mocked(service.listQuantityStock).mockRejectedValueOnce({ kind: 'network', message: 'Sin conexión' }).mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 50 });
    render(<MemoryRouter><QuantityStockPage /></MemoryRouter>); await screen.findByText('Sin conexión');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('No hay existencias para estos filtros.')).toBeInTheDocument();
  });
});

it('keeps backend validation failure visible and does not claim success', async () => {
  vi.mocked(service.inboundQuantityStock).mockRejectedValue({ kind: 'validation', message: 'El producto no admite stock por cantidad.' });
  const user = userEvent.setup(); render(<MemoryRouter><QuantityStockPage /></MemoryRouter>);
  await user.click(screen.getByRole('button', { name: 'Agregar o corregir cantidades' }));
  await selectCatalogProduct(user, 'Producto por cantidad', 'Mouse Logitech · M170');
  await user.selectOptions(screen.getByLabelText('Ubicación de ingreso o ajuste'), placeId);
  await user.type(screen.getByLabelText('Cantidad que ingresa'), '3');
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
  await user.click(screen.getByRole('button', { name: 'Confirmar operación' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('El producto no admite stock por cantidad.');
  expect(screen.queryByText(/Saldo confirmado/)).not.toBeInTheDocument();
});

 it.each(['ADMIN', 'VENDEDOR', 'TECNICO'] as const)('opens quantity entry directly only for ADMIN from a merchandise link (%s)', async (role) => {
  useAuthStore.setState({ user: { ...session, role } });
  render(<MemoryRouter initialEntries={['/inventory/stock?operation=inbound']}><QuantityStockPage /></MemoryRouter>);
  await screen.findByRole('cell', { name: 'Mouse Logitech' });
  await waitFor(() => expect(screen.queryByText('Cargando ubicaciones y categorías…')).not.toBeInTheDocument());
  expect(screen.queryByRole('button', { name: 'Continuar' }) !== null).toBe(role === 'ADMIN');
});

it('keeps the quantity form mounted until the pending operation finishes', async () => {
  let finish!: (result: typeof stock) => void;
  vi.mocked(service.inboundQuantityStock).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/inventory/stock?operation=inbound']}><QuantityStockPage /></MemoryRouter>);
  await selectCatalogProduct(user, 'Producto por cantidad', 'Mouse Logitech · M170');
  await user.selectOptions(screen.getByLabelText('Ubicación de ingreso o ajuste'), placeId);
  await user.type(screen.getByLabelText('Cantidad que ingresa'), '5');
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
  await user.click(screen.getByRole('button', { name: 'Confirmar operación' }));
  expect(screen.getByRole('button', { name: 'Cerrar registro' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Cerrar registro' }));
  expect(service.inboundQuantityStock).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
  await act(async () => finish({ ...stock, quantity: 7 }));
  expect(await screen.findByText(/Saldo confirmado: 7/)).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'Agregar o corregir cantidades' })).toBeEnabled();
});
