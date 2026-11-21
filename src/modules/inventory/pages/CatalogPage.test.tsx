import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../../stores/authStore';
import { useLocationStore } from '../../../stores/locationStore';
import { MemoryRouter } from 'react-router-dom';
import { CatalogForm } from '../components/CatalogForm';
import { CatalogPage } from './CatalogPage';
import * as service from '../services/catalogService';
import { listCategories } from '../services/categoryService';
vi.mock('../services/catalogService', () => ({ listCatalog: vi.fn(), getCatalogDetail: vi.fn(), createCatalogItem: vi.fn(), updateCatalogItem: vi.fn() }));
vi.mock('../services/categoryService', () => ({ listCategories: vi.fn() }));
const account = { id: 'self', email: 'a@mp.pe', name: 'Ana', active: true, role: 'ADMIN' as const };
const category = { id: '77e45678-e89b-42d3-a456-426614174000', name: 'Laptops', description: null, active: true, createdAt: '' };
const item = { id: 'p', sku: 'NB', name: 'Acer Aspire', brand: 'Acer', model: 'A5', categoryId: category.id, processor: null, ramCapacity: null, storageCapacity: null, gpu: null, screenSize: null, isSerialized: true, minStockThreshold: 2, basePrice: 2350, isSecondHand: false, active: true, createdAt: '' };
beforeEach(() => { vi.resetAllMocks(); useLocationStore.getState().reset(); vi.mocked(service.getCatalogDetail).mockResolvedValue({ item, categoryName: 'Laptops', stockSummary: [], totalStockOverall: 0 }); useAuthStore.setState({ status: 'authenticated', user: account }); vi.mocked(listCategories).mockResolvedValue([category]); vi.mocked(service.listCatalog).mockResolvedValue({ items: [item], total: 80, page: 1, limit: 50 }); });
it.each(['ADMIN', 'ENCARGADO_ALMACEN', 'VENDEDOR', 'TECNICO'] as const)('allows %s to read with creation and editing restricted to inventory managers', async (role) => {
  useAuthStore.setState({ user: { ...account, role } }); render(<MemoryRouter><CatalogPage /></MemoryRouter>);
  expect(await screen.findByText('Acer Aspire')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ver ficha de Acer Aspire' })).toBeInTheDocument();
  if (role === 'ADMIN' || role === 'ENCARGADO_ALMACEN') {
    expect(await screen.findByRole('link', { name: 'Ingresar mercancía' })).toHaveAttribute('href', '/inventory/inbound');
    expect(screen.getByRole('button', { name: 'Editar Acer Aspire' })).toBeInTheDocument();
  } else {
    expect(screen.queryByRole('link', { name: 'Ingresar mercancía' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar Acer Aspire' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nombre *')).not.toBeInTheDocument();
  }
});
it('filters through backend and uses its pagination', async () => {
  const user = userEvent.setup(); render(<MemoryRouter><CatalogPage /></MemoryRouter>); await screen.findByText('Acer Aspire');
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
  await waitFor(() => expect(service.listCatalog).toHaveBeenLastCalledWith({ page: 2, limit: 50 }, expect.any(AbortSignal)));
  await user.selectOptions(screen.getByLabelText('Estado del producto'), 'false');
  await waitFor(() => expect(service.listCatalog).toHaveBeenLastCalledWith({ page: 1, limit: 50, active: false }, expect.any(AbortSignal)));
  await user.type(screen.getByLabelText('Buscar producto'), 'acer');
  await waitFor(() => expect(service.listCatalog).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'acer', page: 1 }), expect.any(AbortSignal)));
});
it('shows stock breakdown and server total in product detail', async () => {
  vi.mocked(service.getCatalogDetail).mockResolvedValue({ item, categoryName: 'Laptops', stockSummary: [{ locationId: 'loc', locationName: 'Central', locationType: 'ALMACEN_CENTRAL', serializedCount: 5, quantityCount: 0, totalAvailable: 5 }], totalStockOverall: 7 });
  render(<MemoryRouter><CatalogPage /></MemoryRouter>); await userEvent.click(await screen.findByRole('button', { name: 'Ver ficha de Acer Aspire' }));
  expect(await screen.findByText('Stock total disponible: 7')).toBeInTheDocument();
  expect(screen.getByText('Central')).toBeInTheDocument();
});
it('centralizes creation in merchandise intake instead of creating models from the catalogue', async () => {
  render(<MemoryRouter><CatalogPage /></MemoryRouter>);
  await screen.findByText('Acer Aspire');
  expect(screen.getByRole('link', { name: 'Ingresar mercancía' })).toHaveAttribute('href', '/inventory/inbound');
  expect(screen.queryByRole('button', { name: 'Crear producto' })).not.toBeInTheDocument();
  expect(service.createCatalogItem).not.toHaveBeenCalled();
});
it('shows listing errors with retry and empty results', async () => {
  vi.mocked(service.listCatalog).mockRejectedValueOnce({ kind: 'network', message: 'Sin conexión' }).mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 50 });
  render(<MemoryRouter><CatalogPage /></MemoryRouter>); await screen.findByText('Sin conexión');
  await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(await screen.findByText('No hay productos disponibles.')).toBeInTheDocument();
});

it('rejects negative pricing and displays create conflicts without clearing entered data', async () => {
  vi.mocked(service.createCatalogItem).mockRejectedValue({ kind: 'unknown', status: 409, message: 'SKU duplicado.' });
  const user = userEvent.setup(); render(<CatalogForm categories={[category]} onSaved={vi.fn()} />);
  for (const [label, value] of [['Código de producto (opcional)', 'NB'], ['Marca *', 'Acer'], ['Modelo *', 'A5'], ['Precio base (PEN) *', '-10']]) await user.type(screen.getByLabelText(label), value);
  await user.selectOptions(screen.getByLabelText('Categoría *'), category.id);
  await user.click(screen.getByRole('button', { name: 'Crear producto' }));
  expect(screen.getByRole('alert')).toHaveTextContent('mayores o iguales a cero');
  expect(service.createCatalogItem).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText('Precio base (PEN) *'));
  await user.type(screen.getByLabelText('Precio base (PEN) *'), '10');
  await user.click(screen.getByRole('button', { name: 'Crear producto' }));
  expect(await screen.findByText('SKU duplicado.')).toBeInTheDocument();
  expect(screen.getByLabelText(/Código de producto/)).toHaveValue('NB');
});

it('shows only detail and edit actions for each product row', async () => {
  render(<MemoryRouter><CatalogPage /></MemoryRouter>);
  const row = (await screen.findByRole('cell', { name: /^Acer Aspire/ })).closest('tr')!;
  expect(within(row).getAllByRole('button')).toHaveLength(2);
  expect(within(row).getByRole('button', { name: 'Ver ficha de Acer Aspire' })).toBeInTheDocument();
  expect(within(row).getByRole('button', { name: 'Editar Acer Aspire' })).toBeInTheDocument();
  expect(within(row).queryByRole('button', { name: /Activar|Desactivar/ })).not.toBeInTheDocument();
});

it('places available quantity immediately after the base price column', async () => {
  render(<MemoryRouter><CatalogPage /></MemoryRouter>);
  await screen.findByText('Acer Aspire');
  const headers = screen.getAllByRole('columnheader').map((header) => header.textContent);
  expect(headers).toEqual([
    'Producto',
    'Categoría',
    'Control de unidades',
    'Precio base (PEN)',
    'Cantidad disponible',
    'Estado',
    'Acciones',
  ]);
  const table = screen.getByRole('table');
  expect(table).toHaveClass('min-w-[56rem]');
});

it('shows a discrete loading state for quantities instead of a premature zero', async () => {
  vi.mocked(service.getCatalogDetail).mockReturnValue(new Promise<never>(() => {}));
  render(<MemoryRouter><CatalogPage /></MemoryRouter>);
  const row = (await screen.findByRole('cell', { name: /^Acer Aspire/ })).closest('tr')!;
  expect(within(row).getByText('Cargando cantidad de Acer Aspire')).toBeInTheDocument();
  expect(within(row).queryByText('0')).not.toBeInTheDocument();
  expect(screen.getByText('Actualizando cantidades…')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Reintentar cantidades/ })).not.toBeInTheDocument();
});

it('shows confirmed empty stock without inventing zero', async () => {
  render(<MemoryRouter><CatalogPage /></MemoryRouter>);
  const row = (await screen.findByRole('cell', { name: /^Acer Aspire/ })).closest('tr')!;
  expect(await within(row).findByText('Sin existencias')).toBeInTheDocument();
  expect(within(row).queryByText('0')).not.toBeInTheDocument();
});

it('shows a single quantity retry when any availability request fails', async () => {
  vi.mocked(service.getCatalogDetail).mockRejectedValue(new Error('Offline'));
  render(<MemoryRouter><CatalogPage /></MemoryRouter>);
  const row = (await screen.findByRole('cell', { name: /^Acer Aspire/ })).closest('tr')!;
  expect(await within(row).findByText('No se pudo obtener')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reintentar cantidades' })).toBeInTheDocument();
  expect(within(row).queryByRole('button', { name: /Reintentar/ })).not.toBeInTheDocument();
  expect(within(row).queryByText('0')).not.toBeInTheDocument();
});

it('reloads availability after reloading the catalogue', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><CatalogPage /></MemoryRouter>);
  await waitFor(() => expect(service.getCatalogDetail).toHaveBeenCalledTimes(1));
  await user.click(screen.getByRole('button', { name: 'Recargar catálogo' }));
  await waitFor(() => expect(service.getCatalogDetail).toHaveBeenCalledTimes(2));
});

it('deactivates a product from the edit form with an active-only PATCH', async () => {
  vi.mocked(service.updateCatalogItem).mockResolvedValue({ ...item, active: false });
  const user = userEvent.setup();
  render(<MemoryRouter><CatalogPage /></MemoryRouter>);
  await user.click(await screen.findByRole('button', { name: 'Editar Acer Aspire' }));
  const active = screen.getByRole('checkbox', { name: 'Activo' });
  expect(active).toBeChecked();
  await user.click(active);
  vi.mocked(service.listCatalog).mockResolvedValue({ items: [{ ...item, active: false }], total: 1, page: 1, limit: 50 });
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(await screen.findByText('Producto actualizado correctamente.')).toBeInTheDocument();
  expect(service.updateCatalogItem).toHaveBeenCalledWith(item.id, { active: false });
  expect(await screen.findByText('Inactivo')).toBeInTheDocument();
});

it('reactivates a product from the edit form with an active-only PATCH', async () => {
  vi.mocked(service.listCatalog).mockResolvedValue({ items: [{ ...item, active: false }], total: 1, page: 1, limit: 50 });
  vi.mocked(service.updateCatalogItem).mockResolvedValue({ ...item, active: true });
  const user = userEvent.setup();
  render(<MemoryRouter><CatalogPage /></MemoryRouter>);
  await screen.findByText('Inactivo');
  await user.click(screen.getByRole('button', { name: 'Editar Acer Aspire' }));
  const active = screen.getByRole('checkbox', { name: 'Activo' });
  expect(active).not.toBeChecked();
  await user.click(active);
  vi.mocked(service.listCatalog).mockResolvedValue({ items: [item], total: 1, page: 1, limit: 50 });
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(await screen.findByText('Producto actualizado correctamente.')).toBeInTheDocument();
  expect(service.updateCatalogItem).toHaveBeenCalledWith(item.id, { active: true });
  expect(await screen.findByText('Activo')).toBeInTheDocument();
});

it('prioritizes the selected location quantity and keeps the code in the detail', async () => {
  const place = { id: 'central', name: 'Central', type: 'ALMACEN_CENTRAL' as const, active: true, createdAt: '' };
  useLocationStore.setState({ activeLocation: place });
  vi.mocked(service.getCatalogDetail).mockResolvedValue({ item, categoryName: category.name, totalStockOverall: 12, stockSummary: [{ locationId: place.id, locationName: place.name, locationType: place.type, serializedCount: 5, quantityCount: 0, totalAvailable: 5 }] });
  const user = userEvent.setup();
  render(<MemoryRouter><CatalogPage /></MemoryRouter>);
  expect(screen.getByText('Cantidades en Central')).toBeInTheDocument();
  const row = (await screen.findByRole('cell', { name: /^Acer Aspire/ })).closest('tr')!;
  expect(await within(row).findByRole('cell', { name: '5' })).toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: 'Código de producto' })).not.toBeInTheDocument();
  await user.click(within(row).getByRole('button', { name: 'Ver ficha de Acer Aspire' }));
  expect(await screen.findByText('Código de producto: NB')).toBeInTheDocument();
});

it('edits a product with a changed-fields PATCH and refreshes its list', async () => {
  vi.mocked(service.updateCatalogItem).mockResolvedValue({ ...item, name: 'Acer actualizado' });
  const user = userEvent.setup();
  render(<MemoryRouter><CatalogPage /></MemoryRouter>);
  await user.click(await screen.findByRole('button', { name: 'Editar Acer Aspire' }));
  expect(screen.getByLabelText(/Código de producto/)).toHaveAttribute('readonly');
  expect(screen.getByLabelText('Cómo registrar las unidades')).toBeDisabled();
  expect(screen.getByRole('checkbox', { name: 'Activo' })).toBeChecked();
  await user.clear(screen.getByLabelText('Modelo *'));
  await user.type(screen.getByLabelText('Modelo *'), 'Acer actualizado');
  vi.mocked(service.listCatalog).mockResolvedValue({ items: [{ ...item, name: 'Acer actualizado' }], total: 1, page: 1, limit: 50 });
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(await screen.findByText('Producto actualizado correctamente.')).toBeInTheDocument();
  expect(service.updateCatalogItem).toHaveBeenCalledWith(item.id, { model: 'Acer actualizado' });
  expect(await screen.findByRole('cell', { name: /^Acer actualizado/ })).toBeInTheDocument();
});
