import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { InventoryLabelsPage } from './InventoryLabelsPage';
import { listCatalog } from '../services/catalogService';
import { useLocationStore } from '../../../stores/locationStore';
import { getBatchLabels, getModelLabels } from '../services/barcodeLabelService';
import { listHardwareUnits } from '../services/hardwareReadService';
import { createLabelsPreviewPages, downloadLabelsPdf, printLabelSheets } from '../../../services/printer/labelPdfService';
import type { CatalogItem } from '../catalogModels';
import type { HardwareItem } from '../hardwareModels';
vi.mock('../services/catalogService', () => ({ listCatalog: vi.fn() }));
vi.mock('../services/barcodeLabelService', () => ({ getBatchLabels: vi.fn(), getModelLabels: vi.fn() }));
vi.mock('../services/hardwareReadService', () => ({ listHardwareUnits: vi.fn() }));
vi.mock('../../../services/printer/labelPdfService', () => ({ createLabelsPreviewPages: vi.fn(), downloadLabelsPdf: vi.fn(), printLabelSheets: vi.fn() }));
const product = { id: 'model', name: 'Logitech M170', sku: 'MO-1', brand: 'Logitech', model: 'M170', isSerialized: false, active: true } as CatalogItem;
const unit = { id: 'unit-a', serialNumber: 'SN-A', catalogId: 'model', status: 'EN_STOCK' } as HardwareItem;
const label = { hardwareItemId: 'unit-a', barcodeValue: 'SN-A', title: 'Laptop A', specsSummary: '16 GB', locationName: 'Central', price: 1000 };
beforeEach(() => {
  vi.resetAllMocks(); useLocationStore.getState().reset();
  vi.mocked(createLabelsPreviewPages).mockReturnValue(['<svg xmlns="http://www.w3.org/2000/svg"></svg>']);
  vi.mocked(listCatalog).mockResolvedValue({ items: [product], total: 1, page: 1, limit: 50 });
  vi.mocked(listHardwareUnits).mockResolvedValue({ items: [unit], total: 1, page: 1, limit: 50 });
  vi.mocked(getBatchLabels).mockResolvedValue([label]);
});
afterEach(() => vi.unstubAllGlobals());
async function choose(serialized = false) {
  if (serialized) vi.mocked(listCatalog).mockResolvedValue({ items: [{ ...product, isSerialized: true }], total: 1, page: 1, limit: 50 });
  const user = userEvent.setup(); render(<InventoryLabelsPage />);
  await user.click(screen.getByRole('combobox', { name: 'Buscar producto para etiquetas' }));
  await user.click(await screen.findByRole('option', { name: 'Logitech M170 · MO-1' }));
  return user;
}
it('downloads directly without preview and opens a clean closable preview for model copies', async () => {
  const labels = [1, 2].map((copyNumber) => ({ catalogId: product.id, barcodeValue: product.sku, title: product.name, copyNumber, totalCopies: 2 }));
  vi.mocked(getModelLabels).mockResolvedValue(labels as Awaited<ReturnType<typeof getModelLabels>>);
  const user = await choose();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await user.clear(screen.getByLabelText('Número de copias')); await user.type(screen.getByLabelText('Número de copias'), '101');
  await user.click(screen.getByRole('button', { name: 'Vista previa' }));
  expect(screen.getByRole('alert')).toHaveTextContent('entre 1 y 100');
  expect(getModelLabels).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText('Número de copias')); await user.type(screen.getByLabelText('Número de copias'), '2');
  await user.click(screen.getByRole('button', { name: 'Descargar PDF' }));
  await waitFor(() => expect(downloadLabelsPdf).toHaveBeenCalledWith(labels, undefined, { layout: 'compact' }));
  expect(createLabelsPreviewPages).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  const trigger = screen.getByRole('button', { name: 'Vista previa' });
  await user.click(trigger);
  const modal = await screen.findByRole('dialog', { name: 'Vista previa de etiquetas' });
  expect(modal).toHaveClass('max-h-[94dvh]');
  expect(createLabelsPreviewPages).toHaveBeenCalledWith(labels, { layout: 'compact' });
  expect(screen.getByText('2 etiquetas · 1 hoja')).toBeInTheDocument();
  expect(screen.getByRole('list', { name: 'Etiquetas incluidas' }).children).toHaveLength(2);
  expect(screen.getByRole('img', { name: 'Hoja 1 de etiquetas' })).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml'));
  expect(document.querySelector('object,iframe')).toBeNull();
  expect(screen.getByRole('button', { name: 'Cerrar vista previa' })).toHaveFocus();
  expect(document.body.style.overflow).toBe('hidden');
  await user.click(screen.getByRole('button', { name: 'Imprimir etiquetas' }));
  expect(printLabelSheets).toHaveBeenCalledWith(['<svg xmlns="http://www.w3.org/2000/svg"></svg>']);
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(document.body.style.overflow).not.toBe('hidden');
  await user.selectOptions(screen.getByLabelText('Formato de etiquetas'), 'small');
  await user.click(trigger);
  await screen.findByRole('dialog');
  expect(createLabelsPreviewPages).toHaveBeenLastCalledWith(labels, { layout: 'small' });
  expect(getModelLabels).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('button', { name: 'Cerrar vista previa' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('selects exact individual units and keeps reprinting available beyond stock', async () => {
  const user = await choose(true);
  const unitCheckbox = await screen.findByRole('checkbox', { name: /SN-A/ });
  expect(screen.getByRole('list', { name: 'Unidades para imprimir' })).toHaveClass('sm:grid-cols-2', 'lg:grid-cols-3', 'max-h-72');
  await user.click(unitCheckbox);
  await user.click(screen.getByRole('button', { name: 'Vista previa' }));
  await waitFor(() => expect(createLabelsPreviewPages).toHaveBeenCalledWith([label], { layout: 'compact' }));
  expect(getBatchLabels).toHaveBeenCalledWith(['unit-a']);
  await user.click(await screen.findByRole('button', { name: 'Cerrar vista previa' }));
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
  await user.click(screen.getByRole('button', { name: 'Vista previa' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('no coinciden');
  expect(createLabelsPreviewPages).not.toHaveBeenCalled();
  vi.mocked(getBatchLabels).mockRejectedValue({ kind: 'network', message: 'Sin conexión' });
  await user.click(screen.getByRole('button', { name: 'Vista previa' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión');
});

it('retains validated labels when a small format cannot fit the barcode', async () => {
  const labels = [{ catalogId: product.id, barcodeValue: product.sku, title: product.name, specsSummary: '', locationName: 'Central', price: 100, copyNumber: 1, totalCopies: 1 }];
  vi.mocked(getModelLabels).mockResolvedValue(labels);
  vi.mocked(createLabelsPreviewPages).mockImplementationOnce(() => { throw new Error('El código no cabe en el formato pequeño. Selecciona etiquetas medianas.'); });
  const user = await choose();
  await user.selectOptions(screen.getByLabelText('Formato de etiquetas'), 'small');
  await user.click(screen.getByRole('button', { name: 'Vista previa' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('no cabe');
  await user.selectOptions(screen.getByLabelText('Formato de etiquetas'), 'compact');
  await user.click(screen.getByRole('button', { name: 'Vista previa' }));
  await waitFor(() => expect(createLabelsPreviewPages).toHaveBeenLastCalledWith(labels, { layout: 'compact' }));
  expect(getModelLabels).toHaveBeenCalledTimes(1);
});

it('searches serials through the server across all model pages and preserves selections', async () => {
  const found = { ...unit, id: 'unit-100', serialNumber: 'SN-100' };
  vi.mocked(listHardwareUnits).mockResolvedValue({ items: [unit], total: 100, page: 1, limit: 50 });
  const user = await choose(true);
  await user.click(await screen.findByRole('checkbox', { name: /SN-A/ }));
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
  await waitFor(() => expect(listHardwareUnits).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), expect.any(AbortSignal)));
  vi.mocked(listHardwareUnits).mockResolvedValue({ items: [found], total: 1, page: 1, limit: 50 });
  await user.type(screen.getByLabelText('Buscar por número de serie'), 'SN-100{Enter}');
  await waitFor(() => expect(listHardwareUnits).toHaveBeenLastCalledWith({ catalogItemId: 'model', status: 'EN_STOCK', search: 'SN-100', page: 1, limit: 50 }, expect.any(AbortSignal)));
  await user.click(await screen.findByRole('checkbox', { name: /SN-100/ }));
  expect(screen.getByText('2 etiquetas para imprimir')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Ver todas las series' }));
  await waitFor(() => expect(listHardwareUnits).toHaveBeenLastCalledWith({ catalogItemId: 'model', status: 'EN_STOCK', page: 1, limit: 50 }, expect.any(AbortSignal)));
  expect(screen.getByText('2 etiquetas para imprimir')).toBeInTheDocument();
});


it('renders multiple sheets, traps focus and clears preview when selecting another model', async () => {
  const data = [{ catalogId: product.id, barcodeValue: product.sku, title: product.name, copyNumber: 1, totalCopies: 1 }];
  vi.mocked(getModelLabels).mockResolvedValue(data as Awaited<ReturnType<typeof getModelLabels>>);
  vi.mocked(createLabelsPreviewPages).mockReturnValue(['<svg></svg>', '<svg></svg>']);
  const user = await choose();
  await user.click(screen.getByRole('button', { name: 'Vista previa' }));
  await screen.findByRole('dialog');
  expect(screen.getAllByRole('img')).toHaveLength(2);
  await user.click(screen.getByRole('button', { name: 'Imprimir etiquetas' }));
  await user.tab();
  expect(screen.getByRole('button', { name: 'Cerrar vista previa' })).toHaveFocus();
  await user.tab({ shift: true });
  expect(screen.getByRole('button', { name: 'Imprimir etiquetas' })).toHaveFocus();
  await user.keyboard('{Escape}');
  await user.click(screen.getByRole('button', { name: 'Cambiar producto' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
