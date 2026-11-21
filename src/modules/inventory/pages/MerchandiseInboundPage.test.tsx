import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { MerchandiseInboundPage } from './MerchandiseInboundPage';
import { useAuthStore } from '../../../stores/authStore';
import { selectCatalogProduct } from '../../../test/selectCatalogProduct';
import { listActiveLocations } from '../../foundation/locations/services/locationService';
import { listCategories } from '../services/categoryService';
import { createCatalogItem, listCatalog } from '../services/catalogService';
import { validateSerials } from '../services/hardwareItemService';
import { receiveInventory } from '../services/inventoryInboundService';
import type { CatalogItem } from '../catalogModels';
import type { UnifiedInboundResult } from '../unifiedInboundModels';

vi.mock('../../foundation/locations/services/locationService', () => ({ listActiveLocations: vi.fn() }));
vi.mock('../services/categoryService', () => ({ listCategories: vi.fn() }));
vi.mock('../services/catalogService', () => ({ createCatalogItem: vi.fn(), updateCatalogItem: vi.fn(), listCatalog: vi.fn() }));
vi.mock('../services/hardwareItemService', () => ({ validateSerials: vi.fn() }));
vi.mock('../services/inventoryInboundService', () => ({ receiveInventory: vi.fn() }));
const id = '123e4567-e89b-42d3-a456-426614174000';
const product = { id, name: 'Mouse', sku: 'M170', brand: 'Logitech', model: 'M170', categoryId: 'category', basePrice: 10, isSerialized: false, active: true, isSecondHand: false } as CatalogItem;
beforeEach(() => {
  vi.resetAllMocks();
  useAuthStore.setState({ status: 'authenticated', user: { id: 'admin', name: 'Ana', email: 'ana@mp.pe', role: 'ADMIN', active: true } });
  vi.mocked(listActiveLocations).mockResolvedValue([{ id: 'central', name: 'Principal', type: 'ALMACEN_CENTRAL', active: true, createdAt: '' }]);
  vi.mocked(listCategories).mockResolvedValue([{ id: 'category', name: 'Equipos', description: null, active: true, createdAt: '' }]);
  vi.mocked(listCatalog).mockResolvedValue({ items: [product], total: 1, page: 1, limit: 50 });
  vi.mocked(createCatalogItem).mockResolvedValue({ ...product, isSerialized: true });
  vi.mocked(validateSerials).mockResolvedValue({ allValid: true, existingSerials: [] });
  vi.mocked(receiveInventory).mockResolvedValue({ batchId: 'batch', locationId: 'central', locationName: 'Principal', totalItems: 1, totalUnits: 30, results: [{ catalogId: id, catalogSku: 'M170', catalogBrand: 'Logitech', catalogModel: 'M170', quantity: 30, hasSerialNumbers: false, serialsCreated: [], totalStockResulting: 30 }], createdAt: '' } satisfies UnifiedInboundResult);
});
function mount() { return render(<MemoryRouter><MerchandiseInboundPage /></MemoryRouter>); }

it('selects an existing model, reviews quantity and saves to the resolved central warehouse', async () => {
  const user = userEvent.setup();
  mount();
  await screen.findByText(/Destino: Principal/);
  await selectCatalogProduct(user, 'Buscar modelo', 'Mouse · M170');
  await user.clear(screen.getByLabelText('Cantidad recibida'));
  await user.type(screen.getByLabelText('Cantidad recibida'), '30');
  expect(screen.queryByLabelText('Series de las unidades')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Revisar ingreso' }));
  const confirm = await screen.findByRole('button', { name: 'Confirmar ingreso' });
  expect(receiveInventory).not.toHaveBeenCalled();
  expect(screen.getByRole('heading', { name: 'Confirmar ingreso' })).toHaveFocus();
  await user.dblClick(confirm);
  expect(await screen.findByText('Ingreso registrado correctamente.')).toBeInTheDocument();
  expect(receiveInventory).toHaveBeenCalledTimes(1);
  expect(receiveInventory).toHaveBeenCalledWith({ items: [{ catalogId: id, quantity: 30, hasSerialNumbers: false }] });
  expect(createCatalogItem).not.toHaveBeenCalled();
});

it('prepares a new model without writing until the complete serialized intake is confirmed', async () => {
  const user = userEvent.setup();
  mount();
  await screen.findByText(/Destino: Principal/);
  await user.click(screen.getByLabelText('Modelo nuevo'));
  for (const [label, value] of [['Marca *', 'Marca'], ['Modelo *', 'X1'], ['Precio base (PEN) *', '1000']]) await user.type(screen.getByLabelText(label), value);
  await user.selectOptions(screen.getByLabelText('Categoría *'), 'category');
  expect(screen.queryByLabelText('Segunda mano')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Usar este modelo' }));
  expect(createCatalogItem).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText('Cantidad recibida'));
  await user.type(screen.getByLabelText('Cantidad recibida'), '2');
  await user.type(screen.getByLabelText('Unidad 1: serie'), 'SN1{Enter}');
  expect(screen.getByLabelText('Unidad 2: serie')).toHaveFocus();
  await user.keyboard('SN2');
  await user.click(screen.getByRole('button', { name: 'Cambiar datos del modelo' }));
  await user.clear(screen.getByLabelText('Modelo *'));
  await user.type(screen.getByLabelText('Modelo *'), 'X2');
  await user.click(screen.getByRole('button', { name: 'Usar este modelo' }));
  expect(screen.getByLabelText('Unidad 1: serie')).toHaveValue('SN1');
  expect(screen.getByLabelText('Unidad 2: serie')).toHaveValue('SN2');
  await user.click(screen.getByRole('button', { name: 'Revisar ingreso' }));
  await user.click(await screen.findByRole('button', { name: 'Confirmar ingreso' }));
  await screen.findByText('Ingreso registrado correctamente.');
  expect(createCatalogItem).toHaveBeenCalledTimes(1);
  expect(receiveInventory).toHaveBeenCalledWith({ items: [{ catalogId: id, quantity: 2, hasSerialNumbers: true, serialNumbers: ['SN1', 'SN2'] }] });
  expect(createCatalogItem).toHaveBeenCalledWith(expect.not.objectContaining({ name: expect.anything() }));
  await user.click(screen.getByRole('button', { name: 'Registrar otro ingreso' }));
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Buscar modelo' })).toHaveValue(''));
});

it.each(['VENDEDOR', 'TECNICO'] as const)('does not expose or load the admission form for %s', (role) => {
  useAuthStore.setState((state) => ({ user: { ...state.user!, role } }));
  mount();
  expect(screen.queryByRole('heading', { name: 'Registrar mercancía' })).not.toBeInTheDocument();
  expect(listActiveLocations).not.toHaveBeenCalled();
});


it('preserves hidden series after reducing quantity and rejects missing or repeated series', async () => {
  vi.mocked(listCatalog).mockResolvedValue({ items: [{ ...product, isSerialized: true }], total: 1, page: 1, limit: 50 });
  const user = userEvent.setup(); mount();
  await screen.findByText(/Destino: Principal/);
  await selectCatalogProduct(user, 'Buscar modelo', 'Mouse · M170');
  const quantity = screen.getByLabelText('Cantidad recibida');
  await user.clear(quantity); await user.type(quantity, '2');
  await user.type(screen.getByLabelText('Unidad 1: serie'), 'SN1');
  await user.click(screen.getByRole('button', { name: 'Revisar ingreso' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Completa la serie de la unidad 2');
  await user.type(screen.getByLabelText('Unidad 2: serie'), 'sn1');
  await user.click(screen.getByRole('button', { name: 'Revisar ingreso' }));
  expect(screen.getByRole('alert')).toHaveTextContent('unidad 2 está repetida');
  await user.clear(screen.getByLabelText('Unidad 2: serie')); await user.type(screen.getByLabelText('Unidad 2: serie'), 'SN2');
  await user.clear(quantity); await user.type(quantity, '1');
  expect(screen.queryByLabelText('Unidad 2: serie')).not.toBeInTheDocument();
  await user.clear(quantity); await user.type(quantity, '2');
  expect(screen.getByLabelText('Unidad 2: serie')).toHaveValue('SN2');
  await user.click(screen.getByRole('button', { name: 'Revisar ingreso' }));
  await screen.findByRole('button', { name: 'Confirmar ingreso' });
  expect(validateSerials).toHaveBeenLastCalledWith(['SN1', 'SN2']);
  expect(receiveInventory).not.toHaveBeenCalled();
});
