import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import type { CatalogDetail, CatalogItem } from '../catalogModels';
import { getCatalogDetail } from '../services/catalogService';
import { CatalogDetailPanel } from './CatalogDetailPanel';

vi.mock('../services/catalogService', () => ({ getCatalogDetail: vi.fn() }));
const item: CatalogItem = {
  id: 'product', name: 'Memoria 16GB', sku: 'RAM-16', brand: 'Kingston', model: 'K16', categoryId: 'category',
  processor: null, ramCapacity: '16 GB', storageCapacity: null, gpu: null, screenSize: null,
  isSerialized: true, minStockThreshold: 0, basePrice: 0, isSecondHand: false, active: true, createdAt: '',
};
const detail: CatalogDetail = {
  item, categoryName: 'Memorias', totalStockOverall: 3,
  stockSummary: [{ locationId: 'central', locationName: 'Central', locationType: 'ALMACEN_CENTRAL', serializedCount: 3, quantityCount: 99, totalAvailable: 3 }],
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCatalogDetail).mockResolvedValue(detail);
});

it('shows only populated RAM characteristics and preserves zero general values', async () => {
  const user = userEvent.setup();
  render(<CatalogDetailPanel id="product" onClose={vi.fn()} />);
  await screen.findByText('Memoria 16GB');
  expect(screen.getByText('Código de producto: RAM-16')).toBeInTheDocument();
  const general = screen.getByRole('region', { name: 'Información general' });
  expect(within(general).getAllByText('0')).toHaveLength(2);
  await user.click(screen.getByText('Características técnicas'));
  expect(screen.getByText('Memoria RAM')).toBeInTheDocument();
  expect(screen.getByText('16 GB')).toBeInTheDocument();
  for (const label of ['Procesador', 'Tarjeta gráfica', 'Pantalla', 'Almacenamiento']) {
    expect(screen.queryByText(label)).not.toBeInTheDocument();
  }
  expect(screen.getByText('Stock total disponible: 3')).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: '3' })).toBeInTheDocument();
  expect(screen.queryByRole('cell', { name: '99' })).not.toBeInTheDocument();
});

it('keeps laptop technical values in a compact expandable section regardless of category name', async () => {
  vi.mocked(getCatalogDetail).mockResolvedValue({ ...detail, categoryName: 'Portátiles de trabajo', item: {
    ...item, name: 'Laptop de trabajo', processor: 'Intel i5', ramCapacity: '16 GB', storageCapacity: '512 GB', gpu: 'Iris Xe', screenSize: '15.6 pulgadas',
  } });
  const user = userEvent.setup();
  render(<CatalogDetailPanel id="product" onClose={vi.fn()} />);
  await screen.findByText('Laptop de trabajo');
  const summary = screen.getByText('Características técnicas');
  expect(summary.closest('details')).not.toHaveAttribute('open');
  await user.click(summary);
  for (const value of ['Intel i5', '16 GB', '512 GB', 'Iris Xe', '15.6 pulgadas']) {
    expect(screen.getByText(value)).toBeVisible();
  }
});

it('omits the technical section when there are no characteristics and retains close action', async () => {
  vi.mocked(getCatalogDetail).mockResolvedValue({ ...detail, totalStockOverall: 0, stockSummary: [], item: { ...item, ramCapacity: '   ' } });
  const close = vi.fn();
  render(<CatalogDetailPanel id="product" onClose={close} />);
  expect(await screen.findByText('Stock total disponible: 0')).toBeInTheDocument();
  expect(screen.queryByText('Características técnicas')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Cerrar ficha' }));
  expect(close).toHaveBeenCalledTimes(1);
});

it('does not present a fabricated zero while loading or after a failed detail request', async () => {
  vi.mocked(getCatalogDetail).mockRejectedValue({ kind: 'network', message: 'Sin conexión' });
  render(<CatalogDetailPanel id="product" onClose={vi.fn()} />);
  expect(screen.getByText('Cargando ficha…')).toBeInTheDocument();
  expect(screen.queryByText('Stock total disponible: 0')).not.toBeInTheDocument();
  expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión');
  expect(screen.queryByText('Stock total disponible: 0')).not.toBeInTheDocument();
});
