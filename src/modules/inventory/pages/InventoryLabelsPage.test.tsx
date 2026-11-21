import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { InventoryLabelsPage } from './InventoryLabelsPage';
import { listCatalog } from '../services/catalogService';
import { useLocationStore } from '../../../stores/locationStore';
import { getBatchLabels, getModelLabels } from '../services/barcodeLabelService';
import { listHardwareUnits } from '../services/hardwareReadService';
import { downloadLabelsPdf, openLabelsPdf } from '../../../services/printer/labelPdfService';
import type { CatalogItem } from '../catalogModels';
import type { HardwareItem } from '../hardwareModels';
vi.mock('../services/catalogService', () => ({ listCatalog: vi.fn() }));
vi.mock('../services/barcodeLabelService', () => ({ getBatchLabels: vi.fn(), getModelLabels: vi.fn() }));
vi.mock('../services/hardwareReadService', () => ({ listHardwareUnits: vi.fn() }));
vi.mock('../../../services/printer/labelPdfService', () => ({ downloadLabelsPdf: vi.fn(), openLabelsPdf: vi.fn() }));
const product = { id: 'model', name: 'Logitech M170', sku: 'MO-1', brand: 'Logitech', model: 'M170', isSerialized: false, active: true } as CatalogItem;
const unit = { id: 'unit-a', serialNumber: 'SN-A', catalogId: 'model', status: 'EN_STOCK' } as HardwareItem;
const label = { hardwareItemId: 'unit-a', barcodeValue: 'SN-A', title: 'Laptop A', specsSummary: '16 GB', locationName: 'Central', price: 1000 };
beforeEach(() => {
  vi.resetAllMocks(); useLocationStore.getState().reset();
  vi.mocked(listCatalog).mockResolvedValue({ items: [product], total: 1, page: 1, limit: 50 });
  vi.mocked(listHardwareUnits).mockResolvedValue({ items: [unit], total: 1, page: 1, limit: 50 });
  vi.mocked(getBatchLabels).mockResolvedValue([label]);
});
async function choose(serialized = false) {
  if (serialized) vi.mocked(listCatalog).mockResolvedValue({ items: [{ ...product, isSerialized: true }], total: 1, page: 1, limit: 50 });
  const user = userEvent.setup(); render(<InventoryLabelsPage />);
  await user.click(screen.getByRole('combobox', { name: 'Buscar producto para etiquetas' }));
  await user.click(await screen.findByRole('option', { name: 'Logitech M170 · MO-1' }));
  return user;
}
it('generates model copies and reopens the PDF without exposing a provisional manual-reference interface', async () => {
  const labels = [1, 2].map((copyNumber) => ({ catalogId: product.id, barcodeValue: product.sku, title: product.name, specsSummary: '', locationName: 'Central', price: 100, copyNumber, totalCopies: 2 }));
  vi.mocked(getModelLabels).mockResolvedValue(labels);
  const user = await choose();
  await user.clear(screen.getByLabelText('Número de copias')); await user.type(screen.getByLabelText('Número de copias'), '101');
  await user.click(screen.getByRole('button', { name: 'Generar PDF de etiquetas' }));
  expect(screen.getByRole('alert')).toHaveTextContent('entre 1 y 100');
  expect(getModelLabels).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText('Número de copias')); await user.type(screen.getByLabelText('Número de copias'), '2');
  await user.click(screen.getByRole('button', { name: 'Generar PDF de etiquetas' }));
  await waitFor(() => expect(downloadLabelsPdf).toHaveBeenCalledWith(labels, undefined, { layout: 'compact' }));
  expect(getModelLabels).toHaveBeenCalledWith({ catalogId: product.id, copies: 2 });
  await user.click(screen.getByRole('button', { name: 'Abrir PDF para imprimir' }));
  await waitFor(() => expect(openLabelsPdf).toHaveBeenCalledWith(labels, { layout: 'compact' }));
  expect(getModelLabels).toHaveBeenCalledTimes(1);
  await user.selectOptions(screen.getByLabelText('Formato de etiquetas'), 'small');
  await user.click(screen.getByRole('button', { name: 'Descargar PDF nuevamente' }));
  await waitFor(() => expect(downloadLabelsPdf).toHaveBeenLastCalledWith(labels, undefined, { layout: 'small' }));
  expect(getModelLabels).toHaveBeenCalledTimes(1);
  await user.clear(screen.getByLabelText('Número de copias')); await user.type(screen.getByLabelText('Número de copias'), '1');
  vi.mocked(getModelLabels).mockResolvedValue([labels[0]]);
  await user.click(screen.getByRole('button', { name: 'Generar PDF de etiquetas' }));
  await waitFor(() => expect(getModelLabels).toHaveBeenLastCalledWith({ catalogId: product.id, copies: 1 }));
  expect(screen.queryByText(/referencias manualmente|impresión aún no disponible|Precio:/)).not.toBeInTheDocument();
});
it('selects exact individual units and keeps reprinting available beyond stock', async () => {
  const user = await choose(true);
  const unitCheckbox = await screen.findByRole('checkbox', { name: /SN-A/ });
  expect(screen.getByRole('list', { name: 'Unidades para imprimir' })).toHaveClass('sm:grid-cols-2', 'lg:grid-cols-3', 'max-h-72');
  await user.click(unitCheckbox);
  await user.click(screen.getByRole('button', { name: 'Generar PDF de etiquetas' }));
  await waitFor(() => expect(downloadLabelsPdf).toHaveBeenCalledWith([label], undefined, { layout: 'compact' }));
  expect(getBatchLabels).toHaveBeenCalledWith(['unit-a']);
  await user.click(screen.getByLabelText('Incluir unidades vendidas y otros estados para reimprimir'));
  await waitFor(() => expect(listHardwareUnits).toHaveBeenLastCalledWith({ catalogItemId: 'model', page: 1, limit: 50 }, expect.any(AbortSignal)));
  expect(screen.getByText('0 etiquetas para imprimir')).toBeInTheDocument();
});
it('selects all matching units across pages rather than only the visible page', async () => {
  const second = { ...unit, id: 'unit-b', serialNumber: 'SN-B' };
  vi.mocked(listHardwareUnits).mockResolvedValueOnce({ items: [unit], total: 51, page: 1, limit: 50 })
    .mockResolvedValueOnce({ items: [unit], total: 2, page: 1, limit: 50 })
    .mockResolvedValueOnce({ items: [second], total: 2, page: 2, limit: 50 });
  const user = await choose(true);
  await user.click(await screen.findByRole('button', { name: 'Seleccionar todas (51)' }));
  expect(await screen.findByText('2 etiquetas para imprimir')).toBeInTheDocument();
  expect(listHardwareUnits).toHaveBeenLastCalledWith({ catalogItemId: 'model', status: 'EN_STOCK', page: 2, limit: 50 });
});
it('reports failed requests and mismatched unit labels without generating a PDF', async () => {
  vi.mocked(getBatchLabels).mockResolvedValue([{ ...label, hardwareItemId: 'another-unit' }]);
  const user = await choose(true);
  await user.click(await screen.findByRole('checkbox', { name: /SN-A/ }));
  await user.click(screen.getByRole('button', { name: 'Generar PDF de etiquetas' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('no coinciden');
  expect(downloadLabelsPdf).not.toHaveBeenCalled();
  vi.mocked(getBatchLabels).mockRejectedValue({ kind: 'network', message: 'Sin conexión' });
  await user.click(screen.getByRole('button', { name: 'Generar PDF de etiquetas' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión');
});

it('retains validated labels when a small format cannot fit the barcode', async () => {
  const labels = [{ catalogId: product.id, barcodeValue: product.sku, title: product.name, specsSummary: '', locationName: 'Central', price: 100, copyNumber: 1, totalCopies: 1 }];
  vi.mocked(getModelLabels).mockResolvedValue(labels);
  vi.mocked(downloadLabelsPdf).mockImplementationOnce(() => { throw new Error('El código no cabe en el formato pequeño. Selecciona etiquetas medianas.'); });
  const user = await choose();
  await user.selectOptions(screen.getByLabelText('Formato de etiquetas'), 'small');
  await user.click(screen.getByRole('button', { name: 'Generar PDF de etiquetas' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('no cabe');
  await user.selectOptions(screen.getByLabelText('Formato de etiquetas'), 'compact');
  await user.click(screen.getByRole('button', { name: 'Descargar PDF nuevamente' }));
  await waitFor(() => expect(downloadLabelsPdf).toHaveBeenLastCalledWith(labels, undefined, { layout: 'compact' }));
  expect(getModelLabels).toHaveBeenCalledTimes(1);
});
