import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { InventoryLabelsPage } from './InventoryLabelsPage';
import { scanHardware } from '../services/hardwareItemService';
import { listCatalog } from '../services/catalogService';
import { useLocationStore } from '../../../stores/locationStore';
import { getBatchLabels, getModelLabels } from '../services/barcodeLabelService';
import type { HardwareItem } from '../hardwareModels';

vi.mock('../services/hardwareItemService', () => ({ scanHardware: vi.fn() }));
vi.mock('../services/barcodeLabelService', () => ({ getBatchLabels: vi.fn(), getModelLabels: vi.fn() }));
vi.mock('../services/catalogService', () => ({ listCatalog: vi.fn() }));
const first = { id: '123e4567-e89b-42d3-a456-426614174000', serialNumber: 'SN-A', catalogId: 'catalog', catalogName: 'Laptop A', locationId: 'central', locationName: 'Central', status: 'EN_STOCK', parentChassisId: null, costPrice: null, salePrice: null, createdAt: '', updatedAt: '' } as HardwareItem;
const second = { ...first, id: '223e4567-e89b-42d3-a456-426614174000', serialNumber: 'SN-B' };

beforeEach(() => { vi.resetAllMocks(); useLocationStore.getState().reset(); });
it('selects several individual units and can request the same labels again without changing codes or exposing prices', async () => {
  vi.mocked(scanHardware).mockResolvedValueOnce(first).mockResolvedValueOnce(second);
  vi.mocked(getBatchLabels).mockResolvedValue([{ hardwareItemId: first.id, barcodeValue: 'ORIGINAL-SN-A', title: 'Laptop A', specsSummary: '16 GB', locationName: 'Central', price: 1000 }]);
  const user = userEvent.setup();
  render(<InventoryLabelsPage />);
  const search = screen.getByLabelText('Serie o código del equipo o pieza');
  await user.type(search, 'SN-A{Enter}');
  await user.click(await screen.findByRole('button', { name: 'Añadir SN-A a etiquetas' }));
  await user.clear(search);
  await user.type(search, 'SN-B{Enter}');
  await user.click(await screen.findByRole('button', { name: 'Añadir SN-B a etiquetas' }));
  expect(screen.getByRole('list', { name: 'Equipos seleccionados para etiquetas' })).toHaveTextContent('SN-A');
  await user.click(screen.getByRole('button', { name: 'Ver etiquetas' }));
  expect(await screen.findByText('ORIGINAL-SN-A')).toBeInTheDocument();
  expect(getBatchLabels).toHaveBeenLastCalledWith([first.id, second.id]);
  expect(screen.queryByText(/Precio:/)).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Ver etiquetas' }));
  expect(getBatchLabels).toHaveBeenCalledTimes(2);
  expect(getBatchLabels).toHaveBeenLastCalledWith([first.id, second.id]);
});

it('reports a failed unit lookup without claiming an empty successful result', async () => {
  vi.mocked(scanHardware).mockRejectedValue({ kind: 'network', message: 'Sin conexión' });
  const user = userEvent.setup();
  render(<InventoryLabelsPage />);
  await user.type(screen.getByLabelText('Serie o código del equipo o pieza'), 'SN-X{Enter}');
  expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión');
  expect(getBatchLabels).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: /Añadir SN-X/ })).not.toBeInTheDocument();
});


it('requests model copies with the server SKU, validates the limit and supports reprinting without price', async () => {
  const id = '323e4567-e89b-42d3-a456-426614174000';
  vi.mocked(listCatalog).mockResolvedValue({ items: [{ id, name: 'Mouse', sku: 'MO-1', isSerialized: false, active: true }], total: 1, page: 1, limit: 50 } as Awaited<ReturnType<typeof listCatalog>>);
  vi.mocked(getModelLabels).mockResolvedValue([1, 2].map((copyNumber) => ({ catalogId: id, barcodeValue: 'MO-1', title: 'Mouse Logitech', specsSummary: 'Óptico', locationName: 'Almacén Central', price: 100, copyNumber, totalCopies: 2 })));
  const user = userEvent.setup();
  render(<InventoryLabelsPage />);
  await user.click(screen.getByLabelText('Modelo por cantidad'));
  await user.click(screen.getByRole('combobox', { name: 'Modelo para etiquetas' }));
  await user.click(await screen.findByRole('option', { name: 'Mouse · MO-1' }));
  const copies = screen.getByLabelText('Número de copias');
  await user.clear(copies); await user.type(copies, '101');
  await user.click(screen.getByRole('button', { name: 'Preparar etiquetas' }));
  expect(screen.getByRole('alert')).toHaveTextContent('entre 1 y 100');
  expect(getModelLabels).not.toHaveBeenCalled();
  await user.clear(copies); await user.type(copies, '2');
  await user.click(screen.getByRole('button', { name: 'Preparar etiquetas' }));
  expect(await screen.findByText('Copia 2 de 2')).toBeInTheDocument();
  expect(getModelLabels).toHaveBeenLastCalledWith({ catalogId: id, copies: 2 });
  expect(screen.getAllByText('MO-1')).toHaveLength(2);
  expect(screen.queryByText(/Precio:/)).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Preparar etiquetas' }));
  expect(getModelLabels).toHaveBeenCalledTimes(2);
});

it('allows model labels for serialized products as well as quantity products', async () => {
  const id = '423e4567-e89b-42d3-a456-426614174000';
  vi.mocked(listCatalog).mockResolvedValue({ items: [{ id, name: 'Laptop', sku: 'LAP-1', isSerialized: true, active: true }], total: 1, page: 1, limit: 50 } as Awaited<ReturnType<typeof listCatalog>>);
  const user = userEvent.setup();
  render(<InventoryLabelsPage />);
  await user.click(screen.getByLabelText('Modelo por cantidad'));
  await user.click(screen.getByRole('combobox', { name: 'Modelo para etiquetas' }));
  expect(await screen.findByRole('option', { name: 'Laptop · LAP-1' })).toBeInTheDocument();
});

it('forwards the selected location and shows a model-label error without claiming success', async () => {
  const id = '323e4567-e89b-42d3-a456-426614174000';
  vi.mocked(listCatalog).mockResolvedValue({ items: [{ id, name: 'Mouse', sku: 'MO-1', isSerialized: false, active: true }], total: 1, page: 1, limit: 50 } as Awaited<ReturnType<typeof listCatalog>>);
  vi.mocked(getModelLabels).mockRejectedValue({ kind: 'network', message: 'Sin conexión' });
  useLocationStore.setState({ activeLocation: { id: 'puesto', name: 'Puesto 1', type: 'PUESTO', active: true, createdAt: '' } });
  const user = userEvent.setup();
  render(<InventoryLabelsPage />);
  await user.click(screen.getByLabelText('Modelo por cantidad'));
  await user.click(screen.getByRole('combobox', { name: 'Modelo para etiquetas' }));
  await user.click(await screen.findByRole('option', { name: 'Mouse · MO-1' }));
  await user.click(screen.getByRole('button', { name: 'Preparar etiquetas' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión');
  expect(getModelLabels).toHaveBeenLastCalledWith({ catalogId: id, copies: 1, locationId: 'puesto' });
  expect(screen.queryByRole('region', { name: 'Vista previa de etiquetas por modelo' })).not.toBeInTheDocument();
});
