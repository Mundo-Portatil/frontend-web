import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../../stores/authStore';
import { useLocationStore } from '../../../stores/locationStore';
import type { Location } from '../../foundation/locations/models';
import type { CatalogItem } from '../catalogModels';
import { listCatalog } from '../services/catalogService';
import { adjustQuantityStock, inboundQuantityStock } from '../services/quantityStockService';
import type { QuantityStock } from '../quantityModels';
import { selectCatalogProduct } from '../../../test/selectCatalogProduct';
import { QuantityStockForm } from './QuantityStockForm';

vi.mock('../services/catalogService', () => ({ listCatalog: vi.fn() }));
vi.mock('../services/quantityStockService', () => ({ inboundQuantityStock: vi.fn(), adjustQuantityStock: vi.fn() }));

const place: Location = { id: 'place', name: 'Almacén central', active: true, type: 'ALMACEN_CENTRAL', createdAt: '' };
const product = { id: 'product', name: 'Mouse Logitech', sku: 'M170', isSerialized: false, active: true } as CatalogItem;
const stock = { id: 'stock', catalogId: product.id, locationId: place.id, quantity: 7 } as QuantityStock;

beforeEach(() => {
  vi.resetAllMocks();
  useAuthStore.setState({ status: 'authenticated', user: { id: 'admin', name: 'Ana', email: 'ana@mp.pe', role: 'ADMIN', active: true } });
  useLocationStore.setState({ activeLocation: place });
  vi.mocked(listCatalog).mockResolvedValue({ items: [product], total: 1, page: 1, limit: 50 });
});

async function selectProduct() {
  await selectCatalogProduct(userEvent.setup(), 'Producto por cantidad', 'Mouse Logitech · M170');
}

describe('QuantityStockForm review', () => {
  it('reviews the named product, location and prices, prevents duplicate saves and returns the confirmed stock', async () => {
    let resolve!: (value: QuantityStock) => void;
    vi.mocked(inboundQuantityStock).mockReturnValue(new Promise((done) => { resolve = done; }));
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(<QuantityStockForm locations={[place]} onSaved={onSaved} />);
    await selectProduct();
    await user.type(screen.getByLabelText('Cantidad que ingresa'), '5');
    await user.click(screen.getByText('Precios (opcional)'));
    await user.type(screen.getByLabelText('Costo unitario (opcional)'), '10');
    await user.type(screen.getByLabelText('Precio de venta (opcional)'), '20');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    const review = screen.getByRole('region', { name: 'Confirmar registro' });
    expect(within(review).getByText('Mouse Logitech')).toBeInTheDocument();
    expect(within(review).getByText('M170')).toBeInTheDocument();
    expect(within(review).getByText('Almacén central')).toBeInTheDocument();
    expect(within(review).getByText('Agregar 5 unidades')).toBeInTheDocument();
    expect(within(review).getByText('10')).toBeInTheDocument();
    expect(within(review).getByText('20')).toBeInTheDocument();
    expect(within(review).getByRole('heading')).toHaveFocus();
    expect(inboundQuantityStock).not.toHaveBeenCalled();
    const confirm = screen.getByRole('button', { name: 'Confirmar operación' });
    act(() => { fireEvent.click(confirm); fireEvent.click(confirm); });
    expect(inboundQuantityStock).toHaveBeenCalledTimes(1);
    expect(inboundQuantityStock).toHaveBeenCalledWith({ catalogId: product.id, locationId: place.id, quantity: 5, costPrice: 10, salePrice: 20 });
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
    await act(async () => resolve(stock));
    expect(onSaved).toHaveBeenCalledWith(stock);
  });

  it('focuses a missing reason and reviews an absolute zero count; an error preserves data for editing', async () => {
    vi.mocked(adjustQuantityStock).mockRejectedValue({ kind: 'validation', message: 'No se pudo guardar el conteo.' });
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(<QuantityStockForm locations={[place]} onSaved={onSaved} />);
    await selectProduct();
    await user.selectOptions(screen.getByLabelText('Operación'), 'adjust');
    await user.type(screen.getByLabelText('Nueva cantidad total'), '0');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByLabelText('Motivo del ajuste')).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent('motivo');
    await user.type(screen.getByLabelText('Motivo del ajuste'), 'Conteo físico');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Dejar 0 unidades en total')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Confirmar registro' })).getByText('Conteo físico')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar operación' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar el conteo.');
    expect(adjustQuantityStock).toHaveBeenCalledWith({ catalogId: product.id, locationId: place.id, newQuantity: 0, reason: 'Conteo físico' });
    expect(onSaved).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Volver a editar' }));
    expect(screen.getByLabelText('Motivo del ajuste')).toHaveValue('Conteo físico');
    expect(screen.getByLabelText('Nueva cantidad total')).toHaveValue(0);
    expect(screen.getByRole('button', { name: 'Continuar' })).toHaveFocus();
  });

  it('rejects confirmation when the account loses administrative permission', async () => {
    const user = userEvent.setup();
    render(<QuantityStockForm locations={[place]} onSaved={vi.fn()} />);
    await selectProduct();
    await user.type(screen.getByLabelText('Cantidad que ingresa'), '1');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    useAuthStore.setState((state) => ({ user: state.user ? { ...state.user, role: 'VENDEDOR' } : null }));
    await user.click(screen.getByRole('button', { name: 'Confirmar operación' }));
    expect(inboundQuantityStock).not.toHaveBeenCalled();
  });
});
