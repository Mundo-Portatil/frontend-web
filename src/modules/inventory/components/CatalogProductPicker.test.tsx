import { render, screen, waitFor } from '@testing-library/react';
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

it('searches with Enter without submitting the surrounding stock form', async () => {
  const submit = vi.fn((event) => event.preventDefault());
  const select = vi.fn();
  const user = userEvent.setup();
  render(<form onSubmit={submit}><CatalogProductPicker id="product" serialized={false} onChange={vi.fn()} onSelect={select} /></form>);
  await screen.findByLabelText('Producto por cantidad');
  expect(screen.queryByRole('button', { name: 'Más productos' })).not.toBeInTheDocument();
  await user.type(screen.getByRole('searchbox'), 'Logitech{Enter}');
  await waitFor(() => expect(listCatalog).toHaveBeenLastCalledWith({ active: true, page: 1, limit: 50, search: 'Logitech' }, expect.any(AbortSignal)));
  expect(submit).not.toHaveBeenCalled();
  await user.selectOptions(await screen.findByLabelText('Producto por cantidad'), product.id);
  expect(select).toHaveBeenCalledWith(product);
});

it('keeps the chosen product when browsing more results and can clear it', async () => {
  vi.mocked(listCatalog)
    .mockResolvedValueOnce({ items: [product], total: 51, page: 1, limit: 50 })
    .mockResolvedValueOnce({ items: [{ ...product, id: 'other', name: 'Teclado' }], total: 51, page: 2, limit: 50 });
  const onChange = vi.fn();
  const onSelect = vi.fn();
  const user = userEvent.setup();
  render(<CatalogProductPicker id="product" serialized={false} onChange={onChange} onSelect={onSelect} />);
  await user.selectOptions(await screen.findByLabelText('Producto por cantidad'), product.id);
  await user.click(screen.getByRole('button', { name: 'Más productos' }));
  await screen.findByRole('option', { name: 'Teclado · M170' });
  expect(screen.getByLabelText('Producto por cantidad')).toHaveValue(product.id);
  expect(onChange).toHaveBeenCalledTimes(1);
  await user.selectOptions(screen.getByLabelText('Producto por cantidad'), '');
  expect(onChange).toHaveBeenLastCalledWith('');
  expect(onSelect).toHaveBeenLastCalledWith(null);
});

it('offers more results when the current matches use a different tracking type', async () => {
  vi.mocked(listCatalog).mockResolvedValueOnce({ items: [{ ...product, isSerialized: true }], total: 51, page: 1, limit: 50 });
  render(<CatalogProductPicker id="product" serialized={false} onChange={vi.fn()} />);
  expect(await screen.findByText(/No hay productos compatibles/)).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'Mouse Logitech · M170' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Más productos' })).toBeEnabled();
});
