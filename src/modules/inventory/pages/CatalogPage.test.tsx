import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../../stores/authStore';
import { CatalogPage } from './CatalogPage';
import * as service from '../services/catalogService';
import { listCategories } from '../services/categoryService';
vi.mock('../services/catalogService', () => ({ listCatalog: vi.fn(), getCatalogDetail: vi.fn(), createCatalogItem: vi.fn(), setCatalogActive: vi.fn() }));
vi.mock('../services/categoryService', () => ({ listCategories: vi.fn() }));
const account = { id: 'self', email: 'a@mp.pe', name: 'Ana', active: true, role: 'ADMIN' as const };
const category = { id: '77e45678-e89b-42d3-a456-426614174000', name: 'Laptops', description: null, active: true, createdAt: '' };
const item = { id: 'p', sku: 'NB', name: 'Acer Aspire', brand: 'Acer', model: 'A5', categoryId: category.id, processor: null, ramCapacity: null, storageCapacity: null, gpu: null, screenSize: null, isSerialized: true, minStockThreshold: 2, basePrice: 2350, isSecondHand: false, active: true, createdAt: '' };
beforeEach(() => { vi.resetAllMocks(); useAuthStore.setState({ status: 'authenticated', user: account }); vi.mocked(listCategories).mockResolvedValue([category]); vi.mocked(service.listCatalog).mockResolvedValue({ items: [item], total: 80, page: 1, limit: 50 }); });
it.each(['ADMIN', 'VENDEDOR', 'TECNICO'] as const)('allows %s to read with creation restricted to ADMIN', async (role) => {
  useAuthStore.setState({ user: { ...account, role } }); render(<CatalogPage />);
  expect(await screen.findByText('Acer Aspire')).toBeInTheDocument();
  if (role === 'ADMIN') expect(await screen.findByRole('button', { name: 'Registrar producto' })).toBeInTheDocument();
  else expect(screen.queryByRole('button', { name: 'Registrar producto' })).not.toBeInTheDocument();
});
it('filters through backend and uses its pagination', async () => {
  const user = userEvent.setup(); render(<CatalogPage />); await screen.findByText('Acer Aspire');
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
  await waitFor(() => expect(service.listCatalog).toHaveBeenLastCalledWith({ page: 2, limit: 50 }, expect.any(AbortSignal)));
  await user.selectOptions(screen.getByLabelText('Estado del producto'), 'false');
  await waitFor(() => expect(service.listCatalog).toHaveBeenLastCalledWith({ page: 1, limit: 50, active: false }, expect.any(AbortSignal)));
  await user.type(screen.getByLabelText('Buscar producto'), 'acer');
  await waitFor(() => expect(service.listCatalog).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'acer', page: 1 }), expect.any(AbortSignal)));
});
it('shows stock breakdown and server total in product detail', async () => {
  vi.mocked(service.getCatalogDetail).mockResolvedValue({ item, categoryName: 'Laptops', stockSummary: [{ locationId: 'loc', locationName: 'Central', locationType: 'ALMACEN_CENTRAL', serializedCount: 5, quantityCount: 0, totalAvailable: 5 }], totalStockOverall: 7 });
  render(<CatalogPage />); await userEvent.click(await screen.findByRole('button', { name: 'Ver ficha' }));
  expect(await screen.findByText('Stock total disponible: 7')).toBeInTheDocument();
  expect(screen.getByText('Central')).toBeInTheDocument();
});
it('validates required fields and creates the contracted payload only', async () => {
  vi.mocked(service.createCatalogItem).mockResolvedValue(item);
  const user = userEvent.setup(); render(<CatalogPage />);
  await user.click(await screen.findByRole('button', { name: 'Registrar producto' }));
  await user.click(await screen.findByRole('button', { name: 'Crear producto' })); expect(screen.getByRole('alert')).toHaveTextContent('Completa el código de producto');
  for (const [label, value] of [['Código de producto *', 'NB'], ['Nombre *', 'Laptop'], ['Marca *', 'Acer'], ['Modelo *', 'A5'], ['Precio base (PEN) *', '2350']]) await user.type(screen.getByLabelText(label), value);
  await user.selectOptions(screen.getByLabelText('Categoría *'), category.id);
  expect(screen.getByLabelText('Cómo registrar las unidades')).toHaveValue('true');
  await user.selectOptions(screen.getByLabelText('Cómo registrar las unidades'), 'false');
  await user.click(screen.getByRole('button', { name: 'Crear producto' }));
  expect(await screen.findByText('Producto creado correctamente.')).toBeInTheDocument();
  expect(service.createCatalogItem).toHaveBeenCalledWith({ sku: 'NB', name: 'Laptop', brand: 'Acer', model: 'A5', categoryId: category.id, basePrice: 2350, minStockThreshold: 2, isSerialized: false, isSecondHand: false, active: true });
});
it('shows listing errors with retry and empty results', async () => {
  vi.mocked(service.listCatalog).mockRejectedValueOnce({ kind: 'network', message: 'Sin conexión' }).mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 50 });
  render(<CatalogPage />); await screen.findByText('Sin conexión');
  await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(await screen.findByText('No hay productos disponibles.')).toBeInTheDocument();
});

it('rejects negative pricing and displays create conflicts without clearing entered data', async () => {
  vi.mocked(service.createCatalogItem).mockRejectedValue({ kind: 'unknown', status: 409, message: 'SKU duplicado.' });
  const user = userEvent.setup(); render(<CatalogPage />);
  await user.click(await screen.findByRole('button', { name: 'Registrar producto' }));
  await screen.findByRole('button', { name: 'Crear producto' });
  for (const [label, value] of [['Código de producto *', 'NB'], ['Nombre *', 'Laptop'], ['Marca *', 'Acer'], ['Modelo *', 'A5'], ['Precio base (PEN) *', '-10']]) await user.type(screen.getByLabelText(label), value);
  await user.selectOptions(screen.getByLabelText('Categoría *'), category.id);
  await user.click(screen.getByRole('button', { name: 'Crear producto' }));
  expect(screen.getByRole('alert')).toHaveTextContent('mayores o iguales a cero');
  expect(service.createCatalogItem).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText('Precio base (PEN) *'));
  await user.type(screen.getByLabelText('Precio base (PEN) *'), '10');
  await user.click(screen.getByRole('button', { name: 'Crear producto' }));
  expect(await screen.findByText('SKU duplicado.')).toBeInTheDocument();
  expect(screen.getByLabelText('Código de producto *')).toHaveValue('NB');
});

it.each(['ADMIN', 'VENDEDOR', 'TECNICO'] as const)('limits explicit product reactivation to ADMIN (%s)', async (role) => {
  useAuthStore.setState({ user: { ...account, role } });
  vi.mocked(service.listCatalog).mockResolvedValue({ items: [{ ...item, active: false }], total: 1, page: 1, limit: 50 });
  render(<CatalogPage />);
  await screen.findByText('Inactivo');
  expect(screen.queryByRole('button', { name: 'Activar' }) !== null).toBe(role === 'ADMIN');
  expect(screen.queryByRole('button', { name: 'Desactivar' })).not.toBeInTheDocument();
});

it('reactivates once, refreshes the filtered list and reflects the server state', async () => {
  vi.mocked(service.listCatalog).mockResolvedValue({ items: [{ ...item, active: false }], total: 1, page: 1, limit: 50 });
  let finish!: (result: typeof item) => void;
  vi.mocked(service.setCatalogActive).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  const user = userEvent.setup();
  render(<CatalogPage />);
  await user.selectOptions(screen.getByLabelText('Estado del producto'), 'false');
  await user.dblClick(await screen.findByRole('button', { name: 'Activar' }));
  expect(service.setCatalogActive).toHaveBeenCalledTimes(1);
  expect(service.setCatalogActive).toHaveBeenCalledWith(item.id, true);
  expect(screen.getByRole('button', { name: 'Activar' })).toBeDisabled();
  vi.mocked(service.listCatalog).mockResolvedValue({ items: [], total: 0, page: 1, limit: 50 });
  await act(async () => finish(item));
  expect(await screen.findByText('Producto activado correctamente.')).toBeInTheDocument();
  await waitFor(() => expect(service.listCatalog).toHaveBeenLastCalledWith({ page: 1, limit: 50, active: false }, expect.any(AbortSignal)));
  expect(await screen.findByText('No hay productos disponibles.')).toBeInTheDocument();
});

it('keeps a failed activation visible and permits retry without a false success', async () => {
  vi.mocked(service.listCatalog).mockResolvedValue({ items: [{ ...item, active: false }], total: 1, page: 1, limit: 50 });
  vi.mocked(service.setCatalogActive).mockRejectedValueOnce({ kind: 'validation', message: 'No se pudo activar el producto.' }).mockResolvedValueOnce(item);
  const user = userEvent.setup();
  render(<CatalogPage />);
  await user.click(await screen.findByRole('button', { name: 'Activar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo activar el producto.');
  expect(screen.queryByText('Producto activado correctamente.')).not.toBeInTheDocument();
  expect(service.listCatalog).toHaveBeenCalledTimes(1);
  vi.mocked(service.listCatalog).mockResolvedValue({ items: [item], total: 1, page: 1, limit: 50 });
  await user.click(screen.getByRole('button', { name: 'Activar' }));
  expect(await screen.findByText('Producto activado correctamente.')).toBeInTheDocument();
  expect(await screen.findByRole('cell', { name: 'Activo' })).toBeInTheDocument();
});

it('requires confirmation before deactivating a product', async () => {
  vi.mocked(service.setCatalogActive).mockResolvedValue({ ...item, active: false });
  const user = userEvent.setup();
  render(<CatalogPage />);
  await user.click(await screen.findByRole('button', { name: 'Desactivar' }));
  expect(service.setCatalogActive).not.toHaveBeenCalled();
  expect(screen.getByRole('heading', { name: 'Desactivar Acer Aspire' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Confirmar desactivación' })).toHaveFocus();
  vi.mocked(service.listCatalog).mockResolvedValue({ items: [{ ...item, active: false }], total: 1, page: 1, limit: 50 });
  await user.click(screen.getByRole('button', { name: 'Confirmar desactivación' }));
  expect(service.setCatalogActive).toHaveBeenCalledWith(item.id, false);
  expect(await screen.findByText('Producto desactivado correctamente.')).toBeInTheDocument();
  expect(await screen.findByText('Inactivo')).toBeInTheDocument();
});
