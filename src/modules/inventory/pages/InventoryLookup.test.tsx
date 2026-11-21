import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { InventoryPage } from './InventoryPage';
import { useAuthStore } from '../../../stores/authStore';
import { listCatalog, getCatalogDetail } from '../services/catalogService';
import { listCategories } from '../services/categoryService';
import { scanHardware } from '../services/hardwareItemService';
import type { CatalogItem } from '../catalogModels';

vi.mock('../services/catalogService', () => ({ listCatalog: vi.fn(), getCatalogDetail: vi.fn() }));
vi.mock('../services/categoryService', () => ({ listCategories: vi.fn() }));
vi.mock('../services/hardwareItemService', () => ({ scanHardware: vi.fn() }));
const product = { id: 'p', name: 'Laptop Acer', brand: 'Acer', model: 'Aspire', sku: 'NB', isSerialized: true, active: true } as CatalogItem;
beforeEach(() => {
  vi.resetAllMocks();
  useAuthStore.setState({ status: 'authenticated', user: { id: 'admin', email: 'a@mp.pe', name: 'Ana', role: 'ADMIN', active: true } });
  vi.mocked(listCategories).mockResolvedValue([]);
  vi.mocked(listCatalog).mockResolvedValue({ items: [product], page: 1, limit: 50, total: 1 });
  vi.mocked(getCatalogDetail).mockResolvedValue({ item: product, totalStockOverall: 5, stockSummary: [], categoryName: 'Portátiles' });
});
it('searches models and exact units from one field without exposing stock editing', async () => {
  vi.mocked(scanHardware).mockResolvedValue({ id: 'unit', catalogId: 'p', serialNumber: 'SN-A', locationId: 'central', locationName: 'Almacén central', status: 'EN_STOCK', parentChassisId: null, costPrice: null, salePrice: null, createdAt: '', updatedAt: '', components: [] });
  const user = userEvent.setup();
  render(<MemoryRouter><InventoryPage /></MemoryRouter>);
  await screen.findByText('Laptop Acer');
  await user.type(screen.getByLabelText('Marca, modelo, código o serie'), 'SN-A{Enter}');
  await waitFor(() => expect(listCatalog).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'SN-A', page: 1 }), expect.any(AbortSignal)));
  expect(await screen.findByText('Serie: SN-A')).toBeInTheDocument();
  expect(scanHardware).toHaveBeenCalledWith('SN-A');
  expect(screen.queryByRole('button', { name: /Acoplar|Desacoplar/ })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Editar Laptop Acer' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ver ficha del modelo' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Ver etiquetas' })).not.toBeInTheDocument();
});
it('keeps matching models when exact series lookup reports not found', async () => {
  vi.mocked(scanHardware).mockRejectedValue({ kind: 'notFound', status: 404, message: 'No existe serie' });
  const user = userEvent.setup();
  render(<MemoryRouter><InventoryPage /></MemoryRouter>);
  await user.type(screen.getByLabelText('Marca, modelo, código o serie'), 'Acer{Enter}');
  expect(await screen.findByText('Laptop Acer')).toBeInTheDocument();
  await waitFor(() => expect(scanHardware).toHaveBeenCalledWith('Acer'));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});


it('keeps the unified product view read-only for sellers', async () => {
  useAuthStore.setState({ user: { ...useAuthStore.getState().user!, role: 'VENDEDOR' } });
  render(<MemoryRouter><InventoryPage /></MemoryRouter>);
  await screen.findByText('Laptop Acer');
  expect(screen.getByRole('button', { name: 'Ver ficha de Laptop Acer' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Editar Laptop Acer' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Ingresar mercancía' })).not.toBeInTheDocument();
});
