import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { InventoryPage } from './InventoryPage';
import { useAuthStore } from '../../../stores/authStore';
import { listCatalog, getCatalogDetail } from '../services/catalogService';
import { listCategories } from '../services/categoryService';
import { scanHardware } from '../services/hardwareItemService';
import type { CatalogItem, CatalogPageResult } from '../catalogModels';
import type { HardwareItem } from '../hardwareModels';

vi.mock('../services/catalogService', () => ({ listCatalog: vi.fn(), getCatalogDetail: vi.fn() }));
vi.mock('../services/categoryService', () => ({ listCategories: vi.fn() }));
vi.mock('../services/hardwareItemService', () => ({ scanHardware: vi.fn() }));
const product = { id: 'p', name: 'Lenovo Legion', brand: 'Lenovo', model: 'Legion', categoryId: 'laptops', sku: 'NB', isSerialized: true, active: true } as CatalogItem;
const unit = { id: 'unit', catalogId: 'p', serialNumber: 'PF3A8K2M', locationId: 'central', locationName: 'Almacén central', status: 'EN_STOCK', parentChassisId: null, costPrice: null, salePrice: null, createdAt: '', updatedAt: '', components: [] } satisfies HardwareItem;
const empty = { items: [], page: 1, limit: 50, total: 0 };
beforeEach(() => {
  vi.resetAllMocks();
  useAuthStore.setState({ status: 'authenticated', user: { id: 'admin', email: 'a@mp.pe', name: 'Ana', role: 'ADMIN', active: true } });
  vi.mocked(listCategories).mockResolvedValue([{ id: 'laptops', name: 'Laptops', active: true, description: null, createdAt: '' }]);
  vi.mocked(listCatalog).mockResolvedValue(empty);
  vi.mocked(scanHardware).mockRejectedValue({ kind: 'notFound', status: 404, message: 'No existe serie' });
  vi.mocked(getCatalogDetail).mockResolvedValue({ item: product, totalStockOverall: 3, stockSummary: [], categoryName: 'Laptops' });
});
function mount() { return render(<MemoryRouter><InventoryPage /></MemoryRouter>); }
function enter(value: string) {
  const input = screen.getByLabelText('Marca, modelo, código o serie');
  fireEvent.change(input, { target: { value } });
  fireEvent.submit(input.closest('form')!);
}
it('resolves the series to its real model row with official stock, location and unit state', async () => {
  vi.mocked(scanHardware).mockResolvedValue(unit);
  mount(); await screen.findByText('No hay productos disponibles.');
  enter('PF3A8K2M');
  const row = (await screen.findByText('Serie encontrada: PF3A8K2M')).closest('tr')!;
  expect(within(row).getByText('Lenovo Legion')).toBeInTheDocument();
  expect(await within(row).findByText('3')).toBeInTheDocument();
  expect(within(row).getByText('Almacén central · En stock')).toBeInTheDocument();
  expect(screen.getByText('Página 1 · 1 productos')).toBeInTheDocument();
  expect(screen.queryByText('No hay productos disponibles.')).not.toBeInTheDocument();
  expect(getCatalogDetail).toHaveBeenCalledTimes(1);
  expect(scanHardware).toHaveBeenCalledWith('PF3A8K2M', expect.any(AbortSignal));
  expect(within(row).queryByRole('button', { name: /Ver unidad|Ocultar unidad/ })).not.toBeInTheDocument();
  expect(row).not.toHaveClass('bg-brand-50/40');
  expect(within(row).getByRole('button', { name: 'Ver ficha de Lenovo Legion' })).toBeInTheDocument();
});
it('does not present a sold unit as available or overwrite the real model stock', async () => {
  vi.mocked(scanHardware).mockResolvedValue({ ...unit, status: 'VENDIDO' });
  mount(); enter(unit.serialNumber);
  const row = (await screen.findByText('Serie encontrada: PF3A8K2M')).closest('tr')!;
  expect(within(row).getByText('Almacén central · Vendido')).toBeInTheDocument();
  expect(await within(row).findByText('3')).toBeInTheDocument();
});
it('debounces automatic text search, preserves filters and clears back to the catalogue without duplicate Enter requests', async () => {
  vi.mocked(listCatalog).mockImplementation(async (query) => ({ ...empty, items: [product], total: query?.search ? 1 : 80, page: query?.page ?? 1 }));
  const user = userEvent.setup(); mount(); await screen.findByText('Lenovo Legion');
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
  await user.selectOptions(screen.getByLabelText('Categoría'), 'laptops');
  const input = screen.getByLabelText('Marca, modelo, código o serie');
  fireEvent.change(input, { target: { value: 'Len' } });
  fireEvent.change(input, { target: { value: 'Lenovo' } });
  expect(listCatalog).not.toHaveBeenCalledWith(expect.objectContaining({ search: 'Len' }), expect.anything());
  await waitFor(() => expect(listCatalog).toHaveBeenLastCalledWith({ page: 1, limit: 50, categoryId: 'laptops', search: 'Lenovo' }, expect.any(AbortSignal)));
  const calls = vi.mocked(listCatalog).mock.calls.length;
  fireEvent.submit(input.closest('form')!);
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 350)); });
  expect(listCatalog).toHaveBeenCalledTimes(calls);
  fireEvent.change(input, { target: { value: '' } });
  await waitFor(() => expect(listCatalog).toHaveBeenLastCalledWith({ page: 1, limit: 50, categoryId: 'laptops', search: undefined }, expect.any(AbortSignal)));
  expect(screen.queryByRole('button', { name: 'Buscar' })).not.toBeInTheDocument();
});
it('respects model category and active filters when a series matches', async () => {
  vi.mocked(scanHardware).mockResolvedValue(unit);
  const user = userEvent.setup(); mount(); enter(unit.serialNumber);
  await screen.findByText('Serie encontrada: PF3A8K2M');
  await user.selectOptions(screen.getByLabelText('Estado del producto'), 'false');
  expect(await screen.findByText('No hay productos disponibles.')).toBeInTheDocument();
  expect(screen.queryByText('Serie encontrada: PF3A8K2M')).not.toBeInTheDocument();
});
it('ignores late responses after a new term and resumes a cancelled initial query when cleared before debounce', async () => {
  let resolveOld!: (value: CatalogPageResult) => void;
  vi.mocked(listCatalog).mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; })).mockResolvedValue({ ...empty, items: [product], total: 1 });
  mount();
  const input = screen.getByLabelText('Marca, modelo, código o serie');
  fireEvent.change(input, { target: { value: 'other' } });
  fireEvent.change(input, { target: { value: '' } });
  await screen.findByText('Lenovo Legion');
  await act(async () => resolveOld({ ...empty, items: [{ ...product, id: 'stale', name: 'Producto obsoleto' }], total: 1 }));
  expect(screen.queryByText('Producto obsoleto')).not.toBeInTheDocument();
});
it('keeps the unified product view read-only for sellers', async () => {
  vi.mocked(listCatalog).mockResolvedValue({ ...empty, items: [product], total: 1 });
  useAuthStore.setState({ user: { ...useAuthStore.getState().user!, role: 'VENDEDOR' } });
  mount(); await screen.findByText('Lenovo Legion');
  expect(screen.getByRole('button', { name: 'Ver ficha de Lenovo Legion' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Editar Lenovo Legion' })).not.toBeInTheDocument();
});
