import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { CatalogProductPicker } from './CatalogProductPicker';
import { listCatalog } from '../services/catalogService';
import type { CatalogItem } from '../catalogModels';

vi.mock('../services/catalogService', () => ({ listCatalog: vi.fn() }));
const product = { id: 'mouse', name: 'Mouse Logitech', sku: 'M170', isSerialized: false, active: true } as CatalogItem;
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(listCatalog).mockResolvedValue({ items: [product], total: 1, page: 1, limit: 50 });
});

it.each(['Logitech', 'M170'])('searches %s and selects with keyboard without submitting the surrounding form', async (search) => {
  const submit = vi.fn((event) => event.preventDefault());
  const selected = vi.fn();
  const user = userEvent.setup();
  render(<form onSubmit={submit}><CatalogProductPicker id="product" serialized={false} onChange={vi.fn()} onSelect={selected} /></form>);
  const input = screen.getByRole('combobox', { name: 'Producto por cantidad' });
  await user.type(input, `${search}{Enter}`);
  await waitFor(() => expect(listCatalog).toHaveBeenLastCalledWith({ active: true, page: 1, limit: 50, search }, expect.any(AbortSignal)));
  await screen.findByRole('option', { name: 'Mouse Logitech · M170' });
  await user.keyboard('{ArrowDown}{Enter}');
  expect(selected).toHaveBeenCalledWith(product);
  expect(input).toHaveValue('Mouse Logitech · M170');
  expect(input).toHaveAttribute('aria-expanded', 'false');
  expect(submit).not.toHaveBeenCalled();
});

it('automatically skips pages containing only serialised products before announcing results', async () => {
  vi.mocked(listCatalog)
    .mockResolvedValueOnce({ items: [{ ...product, id: 'laptop', isSerialized: true }], total: 51, page: 1, limit: 50 })
    .mockResolvedValueOnce({ items: [product], total: 51, page: 2, limit: 50 });
  const user = userEvent.setup();
  render(<CatalogProductPicker id="product" serialized={false} onChange={vi.fn()} />);
  await user.click(screen.getByRole('combobox'));
  expect(await screen.findByRole('option', { name: 'Mouse Logitech · M170' })).toBeInTheDocument();
  expect(listCatalog).toHaveBeenLastCalledWith({ active: true, page: 2, limit: 50 }, expect.any(AbortSignal));
  expect(screen.queryByText(/No se encontraron productos/)).not.toBeInTheDocument();
});

it('explains serialised matches and does not offer them as quantity products', async () => {
  vi.mocked(listCatalog).mockResolvedValue({ items: [{ ...product, isSerialized: true }], total: 1, page: 1, limit: 50 });
  const user = userEvent.setup();
  render(<CatalogProductPicker id="product" serialized={false} onChange={vi.fn()} />);
  await user.click(screen.getByRole('combobox'));
  expect(await screen.findByText('Los productos encontrados se registran por serie o código.')).toBeInTheDocument();
  expect(screen.queryByRole('option')).not.toBeInTheDocument();
});

it('excludes inactive entry products but includes them when filtering existing stock', async () => {
  vi.mocked(listCatalog).mockResolvedValue({ items: [{ ...product, active: false }], total: 1, page: 1, limit: 50 });
  const user = userEvent.setup();
  const entry = render(<CatalogProductPicker id="entry" serialized={false} onChange={vi.fn()} />);
  await user.click(screen.getByRole('combobox'));
  expect(await screen.findByText(/están inactivos/)).toBeInTheDocument();
  expect(screen.queryByRole('option')).not.toBeInTheDocument();
  entry.unmount();
  render(<CatalogProductPicker id="filter" serialized={false} activeOnly={false} onChange={vi.fn()} />);
  await user.click(screen.getByRole('combobox'));
  expect(await screen.findByRole('option', { name: 'Mouse Logitech · M170 (inactivo)' })).toBeInTheDocument();
  expect(listCatalog).toHaveBeenLastCalledWith({ page: 1, limit: 50 }, expect.any(AbortSignal));
});

it('appends and deduplicates more products and clears the selection when changing it', async () => {
  const second = { ...product, id: 'keyboard', name: 'Teclado', sku: 'K120' };
  vi.mocked(listCatalog)
    .mockResolvedValueOnce({ items: [product], total: 51, page: 1, limit: 50 })
    .mockResolvedValueOnce({ items: [product, second], total: 51, page: 2, limit: 50 });
  const onChange = vi.fn();
  const onSelect = vi.fn();
  const user = userEvent.setup();
  render(<CatalogProductPicker id="product" serialized={false} onChange={onChange} onSelect={onSelect} />);
  await user.click(screen.getByRole('combobox'));
  await user.click(await screen.findByRole('button', { name: 'Más productos' }));
  await screen.findByRole('option', { name: 'Teclado · K120' });
  expect(screen.getAllByRole('option')).toHaveLength(2);
  await user.click(screen.getByRole('option', { name: 'Mouse Logitech · M170' }));
  expect(onChange).toHaveBeenLastCalledWith('mouse');
  await user.type(screen.getByRole('combobox'), 'X');
  expect(onChange).toHaveBeenLastCalledWith('');
  expect(onSelect).toHaveBeenLastCalledWith(null);
});

it('ignores an obsolete response after starting another search', async () => {
  let finish!: (value: Awaited<ReturnType<typeof listCatalog>>) => void;
  vi.mocked(listCatalog)
    .mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }))
    .mockResolvedValueOnce({ items: [product], total: 1, page: 1, limit: 50 });
  const user = userEvent.setup();
  render(<CatalogProductPicker id="product" serialized={false} onChange={vi.fn()} />);
  await user.type(screen.getByRole('combobox'), 'M170{Enter}');
  await screen.findByRole('option', { name: 'Mouse Logitech · M170' });
  finish({ items: [{ ...product, name: 'Resultado obsoleto' }], total: 1, page: 1, limit: 50 });
  await waitFor(() => expect(screen.queryByRole('option', { name: /obsoleto/ })).not.toBeInTheDocument());
  expect(screen.getByRole('option', { name: 'Mouse Logitech · M170' })).toBeInTheDocument();
});

it('closes with Escape and does not change values when disabled', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  const view = render(<CatalogProductPicker id="product" serialized={false} onChange={onChange} />);
  const input = screen.getByRole('combobox');
  await user.click(input);
  await screen.findByRole('option');
  await user.keyboard('{Escape}');
  expect(input).toHaveAttribute('aria-expanded', 'false');
  view.rerender(<CatalogProductPicker id="product" serialized={false} onChange={onChange} disabled />);
  expect(input).toBeDisabled();
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  expect(screen.queryByRole('option')).not.toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
});

it('does not offer old matches or their next page when a new search fails', async () => {
  vi.mocked(listCatalog)
    .mockResolvedValueOnce({ items: [product], total: 51, page: 1, limit: 50 })
    .mockRejectedValue({ kind: 'network', message: 'Sin conexión' });
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<CatalogProductPicker id="product" serialized={false} onChange={onChange} />);
  await user.click(screen.getByRole('combobox'));
  await screen.findByRole('option', { name: 'Mouse Logitech · M170' });
  expect(screen.getByRole('button', { name: 'Más productos' })).toBeInTheDocument();
  await user.type(screen.getByRole('combobox'), 'Otro producto{Enter}');
  expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión');
  expect(screen.queryByRole('option')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Más productos' })).not.toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
});

it.each([true, false])('offers every eligible product from the five-product catalogue (serialized=%s)', async (serialized) => {
  const items = [
    { ...product, id: 'asus', name: 'asus tuf', sku: '874598', isSerialized: true },
    { ...product, id: 'lenovo', name: 'lenovo v15', sku: '1346789', isSerialized: true },
    { ...product, id: 'other-series', name: 'Otro equipo', sku: 'OFF', isSerialized: true },
    product,
    { ...product, id: 'inactive', name: 'Equipo inactivo', sku: 'SER', isSerialized: true, active: false },
  ];
  vi.mocked(listCatalog).mockResolvedValue({ items, total: 5, page: 1, limit: 50 });
  const user = userEvent.setup();
  render(<CatalogProductPicker id="product" serialized={serialized} onChange={vi.fn()} />);
  const input = screen.getByRole('combobox');
  await user.click(input);
  await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(serialized ? 3 : 1));
  if (serialized) {
    expect(screen.getByRole('option', { name: 'asus tuf · 874598' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'lenovo v15 · 1346789' })).toBeInTheDocument();
  } else {
    expect(screen.getByRole('option', { name: 'Mouse Logitech · M170' })).toBeInTheDocument();
  }
  expect(screen.queryByRole('option', { name: /Equipo inactivo/ })).not.toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('option')).not.toBeInTheDocument();
  await user.click(input);
  expect(screen.getAllByRole('option')).toHaveLength(serialized ? 3 : 1);
});
