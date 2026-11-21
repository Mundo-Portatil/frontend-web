import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { CatalogForm } from './CatalogForm';
import { createCatalogItem, updateCatalogItem } from '../services/catalogService';
import { useAuthStore } from '../../../stores/authStore';
import type { CatalogItem } from '../catalogModels';

vi.mock('../services/catalogService', () => ({ createCatalogItem: vi.fn(), updateCatalogItem: vi.fn() }));
const category = { id: 'portable', name: 'Equipos portátiles empresariales', description: null, active: true, createdAt: '' };
const otherCategory = { ...category, id: 'other', name: 'Accesorios' };
const laptop: CatalogItem = {
  id: 'laptop', sku: 'NB-X', name: 'Portátil X', brand: 'Marca', model: 'X1', categoryId: category.id,
  processor: 'Core i5', ramCapacity: '16 GB', storageCapacity: '512 GB', gpu: 'Integrada', screenSize: '15 pulgadas',
  basePrice: 2500, minStockThreshold: 2, isSerialized: true, isSecondHand: false, active: true, createdAt: '',
};
beforeEach(() => {
  vi.resetAllMocks();
  useAuthStore.setState({ status: 'authenticated', user: { id: 'admin', name: 'Ana', email: 'ana@mp.pe', role: 'ADMIN', active: true } });
  vi.mocked(createCatalogItem).mockResolvedValue(laptop);
  vi.mocked(updateCatalogItem).mockResolvedValue(laptop);
});

async function fillGeneral(user: ReturnType<typeof userEvent.setup>, categoryId: string) {
  for (const [label, value] of [['Marca *', 'Marca'], ['Modelo *', 'X1'], ['Precio base (PEN) *', '100'], ['Código de producto (opcional)', 'CODE-X']]) {
    await user.type(screen.getByLabelText(label), value);
  }
  await user.selectOptions(screen.getByLabelText('Categoría *'), categoryId);
}

it('creates a quantity product with technical fields optional and collapsed', async () => {
  const user = userEvent.setup();
  render(<CatalogForm categories={[otherCategory]} onSaved={vi.fn()} />);
  expect(screen.getByLabelText('Procesador')).not.toBeVisible();
  expect(screen.queryByRole('checkbox', { name: 'Activo' })).not.toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: 'Segunda mano' })).toBeInTheDocument();
  await fillGeneral(user, otherCategory.id);
  await user.selectOptions(screen.getByLabelText('Cómo registrar las unidades'), 'false');
  expect(screen.getByText('Características técnicas (opcional)')).toBeInTheDocument();
  expect(screen.getByLabelText('Procesador')).not.toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Crear producto' }));
  expect(createCatalogItem).toHaveBeenCalledWith({ sku: 'CODE-X', brand: 'Marca', model: 'X1', categoryId: otherCategory.id, basePrice: 100, minStockThreshold: 2, isSerialized: false, isSecondHand: false, active: true });
});

it('creates a laptop with technical values even when its optional section is closed before saving', async () => {
  const user = userEvent.setup();
  render(<CatalogForm categories={[category]} onSaved={vi.fn()} />);
  expect(screen.getByText('Características técnicas (opcional)')).toBeInTheDocument();
  await fillGeneral(user, category.id);
  const disclosure = screen.getByText('Características técnicas (opcional)');
  await user.click(disclosure);
  for (const [label, value] of [['Procesador', 'Core i5'], ['Memoria RAM', '16 GB'], ['Almacenamiento', '512 GB'], ['Tarjeta gráfica', 'Integrada'], ['Tamaño de pantalla', '15 pulgadas']]) {
    await user.type(screen.getByLabelText(label), value);
  }
  await user.click(disclosure);
  await user.click(screen.getByRole('button', { name: 'Crear producto' }));
  expect(createCatalogItem).toHaveBeenCalledWith(expect.objectContaining({ processor: laptop.processor, ramCapacity: laptop.ramCapacity, storageCapacity: laptop.storageCapacity, gpu: laptop.gpu, screenSize: laptop.screenSize }));
});

it('preserves hidden technical values and the tracking type when editing general data and category', async () => {
  const user = userEvent.setup();
  render(<CatalogForm categories={[category, otherCategory]} initialItem={{ ...laptop, processor: ' Core i5 ' }} onSaved={vi.fn()} />);
  await user.selectOptions(screen.getByLabelText('Categoría *'), otherCategory.id);
  await user.clear(screen.getByLabelText('Marca *'));
  await user.type(screen.getByLabelText('Marca *'), 'Nueva marca');
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(updateCatalogItem).toHaveBeenCalledWith(laptop.id, { brand: 'Nueva marca', categoryId: otherCategory.id });
  expect(screen.getByLabelText('Memoria RAM')).toHaveValue('16 GB');
  expect(screen.getByLabelText('Procesador')).toHaveValue(' Core i5 ');
});

it('updates only the edited technical value and blocks duplicate saves', async () => {
  let finish!: (value: CatalogItem) => void;
  vi.mocked(updateCatalogItem).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  const onSaved = vi.fn();
  const user = userEvent.setup();
  render(<CatalogForm categories={[{ ...category, active: false }]} initialItem={laptop} onSaved={onSaved} />);
  await user.click(screen.getByText('Características técnicas (opcional)'));
  await user.clear(screen.getByLabelText('Memoria RAM'));
  await user.type(screen.getByLabelText('Memoria RAM'), '32 GB');
  const save = screen.getByRole('button', { name: 'Guardar cambios' });
  act(() => { fireEvent.click(save); fireEvent.click(save); });
  expect(updateCatalogItem).toHaveBeenCalledTimes(1);
  expect(updateCatalogItem).toHaveBeenCalledWith(laptop.id, { ramCapacity: '32 GB' });
  expect(save).toBeDisabled();
  await act(async () => finish({ ...laptop, ramCapacity: '32 GB' }));
  expect(onSaved).toHaveBeenCalledTimes(1);
});

it('deactivates and reactivates a product from the edit form with an active-only PATCH', async () => {
  const user = userEvent.setup();
  const first = render(<CatalogForm categories={[category]} initialItem={laptop} onSaved={vi.fn()} />);
  const active = screen.getByRole('checkbox', { name: 'Activo' });
  expect(active).toBeChecked();
  await user.click(active);
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(updateCatalogItem).toHaveBeenCalledWith(laptop.id, { active: false });
  first.unmount();

  vi.mocked(updateCatalogItem).mockClear();
  render(<CatalogForm categories={[category]} initialItem={{ ...laptop, active: false }} onSaved={vi.fn()} />);
  const inactive = screen.getByRole('checkbox', { name: 'Activo' });
  expect(inactive).not.toBeChecked();
  await user.click(inactive);
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(updateCatalogItem).toHaveBeenCalledWith(laptop.id, { active: true });
});

it('does not send technical fields when editing a quantity product without technical values', async () => {
  const user = userEvent.setup();
  const quantityItem = { ...laptop, processor: null, ramCapacity: null, storageCapacity: null, gpu: null, screenSize: null, isSerialized: false };
  render(<CatalogForm categories={[category]} initialItem={quantityItem} onSaved={vi.fn()} />);
  expect(screen.getByText('Características técnicas (opcional)')).toBeInTheDocument();
  await user.clear(screen.getByLabelText('Marca *'));
  await user.type(screen.getByLabelText('Marca *'), 'Nueva marca por cantidad');
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(updateCatalogItem).toHaveBeenCalledWith(laptop.id, { brand: 'Nueva marca por cantidad' });
});


it('prepares a model without name or SKU, leaving its code generation to the backend', async () => {
  const onPrepare = vi.fn();
  const user = userEvent.setup();
  useAuthStore.setState((state) => ({ user: state.user ? { ...state.user, role: 'ENCARGADO_ALMACEN' } : null }));
  render(<CatalogForm categories={[category]} onSaved={vi.fn()} onPrepare={onPrepare} />);
  for (const [label, value] of [['Marca *', 'Acer'], ['Modelo *', 'Aspire 5'], ['Precio base (PEN) *', '1500']]) await user.type(screen.getByLabelText(label), value);
  await user.selectOptions(screen.getByLabelText('Categoría *'), category.id);
  await user.click(screen.getByRole('button', { name: 'Continuar con el ingreso' }));
  expect(onPrepare).toHaveBeenCalledWith({ brand: 'Acer', model: 'Aspire 5', categoryId: category.id, basePrice: 1500, minStockThreshold: 2, isSerialized: true, isSecondHand: false, active: true });
  expect(createCatalogItem).not.toHaveBeenCalled();
});
