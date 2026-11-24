import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogItem, HardwareItem } from '../inventory';
import type { Location } from '../foundation/locations/models';
import { emptyTransferDraft, transferDraftReducer, type TransferDraft } from './draftModels';
import { matchesTransferResponse, toTransferInput, validateTransferDraft } from './validation';
import { useAuthStore } from '../../stores/authStore';
import { saveAccessToken } from '../../config/authToken';
import { TransferCreatePage } from './pages/TransferCreatePage';
import { useCreateTransfer } from './hooks/useCreateTransfer';
import type { TransferDetail } from './models';

const mocks = vi.hoisted(() => ({ stock: vi.fn(), scan: vi.fn(), availableSerials: vi.fn(), locations: vi.fn(), create: vi.fn() }));
vi.mock('../inventory', () => ({
  listQuantityStock: mocks.stock,
  scanHardware: mocks.scan,
  getAvailableSerials: mocks.availableSerials,
  CatalogProductPicker: ({ onSelect, serialized }: { onSelect: (item: unknown) => void; serialized?: boolean }) => (
    <button
      type="button"
      onClick={() => onSelect(serialized
        ? { id: 'laptop', name: 'Laptop', model: 'Inspiron', brand: 'Dell', active: true, isSerialized: true }
        : { id: 'ram', name: 'Memoria RAM', model: 'RAM', brand: 'Kingston', active: true, isSerialized: false }
      )}
    >
      {serialized ? 'Elegir laptop serializada' : 'Elegir memoria'}
    </button>
  ),
}));
vi.mock('../foundation/locations/services/locationService', () => ({ listActiveLocations: mocks.locations }));
vi.mock('./services/transferService', () => ({ createDirectTransfer: mocks.create }));
const locations: Location[] = [
  { id: 'central', name: 'Almacén', type: 'ALMACEN_CENTRAL', active: true, createdAt: '' },
  { id: 'post', name: 'Puesto 212', type: 'PUESTO', active: true, createdAt: '' },
];
const catalog = { id: 'ram', name: 'Memoria RAM', model: 'RAM', brand: 'Kingston', active: true, isSerialized: false } as CatalogItem;
const serial = { id: 'unit', serialNumber: 'SN123', catalogId: 'laptop', catalogName: 'Laptop', status: 'EN_STOCK', locationId: 'central', parentChassisId: null } as HardwareItem;
function draft(): TransferDraft { return { ...emptyTransferDraft(), postId: 'post', quantities: [{ catalog, quantity: 2, available: 5 }] }; }
function receipt(): TransferDetail {
  return { id: 'transfer', code: 'TR-BACKEND', type: 'DIRECTO', status: 'COMPLETED', fromLocationId: 'central', fromLocationName: 'Almacén', toLocationId: 'post', toLocationName: 'Puesto 212', createdById: 'admin', createdByName: 'Admin', notes: null, createdAt: '', updatedAt: '', itemsCount: 1, items: [{ id: 'line', catalogId: 'ram', hardwareItemId: null, serialNumber: null, quantity: 2, sku: 'RAM', brand: 'Kingston', model: 'RAM' }] };
}
beforeEach(() => {
  vi.clearAllMocks();
  saveAccessToken('test-token');
  useAuthStore.setState({ status: 'authenticated', user: { id: 'admin', role: 'ADMIN', active: true, name: 'Admin', email: 'admin@example.test' } });
  mocks.locations.mockResolvedValue(locations);
  mocks.stock.mockImplementation((query: { locationId: string }) => Promise.resolve({ items: [{ catalogId: 'ram', locationId: query.locationId, quantity: 5 }], total: 1 }));
  mocks.scan.mockResolvedValue(serial);
  mocks.availableSerials.mockResolvedValue([{ id: 'unit', serialNumber: 'SN123', catalogId: 'laptop', locationId: 'central', salePrice: null, createdAt: '' }]);
  mocks.create.mockResolvedValue(receipt());
});
describe('borrador y contrato de traslados', () => {
  it('agrupa cantidades repetidas y evita seriales duplicados; cambiar ruta limpia incompatibles', () => {
    let state = transferDraftReducer(draft(), { type: 'quantity', line: { catalog, quantity: 1, available: 5 } });
    expect(state.quantities).toHaveLength(1); expect(state.quantities[0].quantity).toBe(3);
    state = transferDraftReducer(state, { type: 'serial', item: serial });
    expect(transferDraftReducer(state, { type: 'serial', item: serial }).serials).toHaveLength(1);
    expect(transferDraftReducer(state, { type: 'route', direction: 'return', postId: 'post' })).toEqual({ ...emptyTransferDraft(), direction: 'return', postId: 'post' });
  });
  it('mapea distribución y devolución sin campos inventados; notas opcionales', () => {
    expect(toTransferInput({ ...draft(), notes: '  Reposición  ' }, locations)).toEqual({ fromLocationId: 'central', toLocationId: 'post', quantities: [{ catalogId: 'ram', quantity: 2 }], notes: 'Reposición' });
    expect(toTransferInput({ ...draft(), direction: 'return' }, locations)).toEqual({ fromLocationId: 'post', toLocationId: 'central', quantities: [{ catalogId: 'ram', quantity: 2 }] });
  });
  it('bloquea stock desconocido, excedido, fraccionario, tipo incorrecto y rutas inválidas', () => {
    for (const line of [{ quantity: 6, available: 5 }, { quantity: 1.5, available: 5 }, { quantity: 1, available: null }, { quantity: 0, available: 5 }]) expect(validateTransferDraft({ ...draft(), quantities: [{ catalog, ...line }] }, locations)).toBeTruthy();
    expect(validateTransferDraft(draft(), [...locations, { ...locations[0], id: 'other-central' }])).toBeTruthy();
    expect(validateTransferDraft(draft(), locations.map(item => ({ ...item, active: false })))).toBeTruthy();
    expect(validateTransferDraft({ ...draft(), quantities: [{ catalog: { ...catalog, isSerialized: true }, quantity: 1, available: 5 }] }, locations)).toBeTruthy();
  });
  it('permite traslados serializados puros y mixtos hacia el backend', () => {
    const mixed = { ...draft(), serials: [serial] };
    expect(validateTransferDraft(mixed, locations)).toBeNull();
    expect(toTransferInput(mixed, locations)).toEqual({
      fromLocationId: 'central',
      toLocationId: 'post',
      hardwareItemIds: ['unit'],
      quantities: [{ catalogId: 'ram', quantity: 2 }],
    });
    expect(validateTransferDraft({ ...mixed, serials: [{ ...serial, status: 'VENDIDO' }] }, locations)).toBeTruthy();
  });
  it('rechaza respuestas inconsistentes sin inventar comprobante', () => {
    expect(matchesTransferResponse(receipt(), toTransferInput(draft(), locations))).toBe(true);
    expect(matchesTransferResponse({ ...receipt(), items: [] }, toTransferInput(draft(), locations))).toBe(false);
    expect(matchesTransferResponse({ ...receipt(), toLocationId: 'other' }, toTransferInput(draft(), locations))).toBe(false);
  });
});
describe('confirmación segura', () => {
  it('impide doble envío y conserva resultado real', async () => {
    let resolve!: (result: TransferDetail) => void;
    mocks.create.mockReturnValue(new Promise<TransferDetail>(done => { resolve = done; }));
    const hook = renderHook(() => useCreateTransfer());
    await act(async () => { void hook.result.current.submit(draft(), locations); void hook.result.current.submit(draft(), locations); });
    expect(mocks.create).toHaveBeenCalledTimes(1);
    await act(async () => resolve(receipt()));
    expect(hook.result.current.receipt?.code).toBe('TR-BACKEND');
  });
  it('resultado desconocido bloquea reenvío y reinicio', async () => {
    mocks.create.mockRejectedValue({ kind: 'server', status: 500, message: 'Error' });
    const hook = renderHook(() => useCreateTransfer());
    await act(async () => hook.result.current.submit(draft(), locations));
    expect(hook.result.current.phase).toBe('unknown');
    act(() => hook.result.current.reset());
    await act(async () => hook.result.current.submit(draft(), locations));
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(hook.result.current.receipt).toBeNull();
  });
  it('respeta permisos y cambio de sesión sin peticiones', async () => {
    const hook = renderHook(() => useCreateTransfer());
    useAuthStore.setState({ user: { ...useAuthStore.getState().user!, role: 'VENDEDOR' } });
    await act(async () => hook.result.current.submit(draft(), locations));
    expect(mocks.create).not.toHaveBeenCalled();
    saveAccessToken('other-session');
    await act(async () => hook.result.current.submit(draft(), locations));
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
async function selectQuantity(direction = 'supply') {
  render(<MemoryRouter><TransferCreatePage /></MemoryRouter>);
  await screen.findByRole('option', { name: 'Puesto 212' });
  fireEvent.change(screen.getByLabelText('Operación'), { target: { value: direction } });
  fireEvent.change(screen.getByLabelText('Puesto'), { target: { value: 'post' } });
  fireEvent.click(screen.getByRole('button', { name: 'Elegir memoria' }));
  await screen.findByText('Disponibles en origen: 5');
  fireEvent.change(screen.getByLabelText('Cantidad a trasladar'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Agregar producto' }));
}
describe('registro accesible de traslados', () => {
  it.each(['supply', 'return'])('revisa, permite cerrar y confirma %s con stock reciente', async direction => {
    if (direction === 'return') mocks.create.mockResolvedValue({ ...receipt(), fromLocationId: 'post', fromLocationName: 'Puesto 212', toLocationId: 'central', toLocationName: 'Almacén' });
    await selectQuantity(direction);
    fireEvent.click(screen.getByRole('button', { name: 'Revisar traslado' }));
    let dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Memoria RAM · 2 unidades')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Revisar traslado' }));
    dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar traslado' }));
    await screen.findByText('TR-BACKEND');
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledWith({ fromLocationId: direction === 'supply' ? 'central' : 'post', toLocationId: direction === 'supply' ? 'post' : 'central', quantities: [{ catalogId: 'ram', quantity: 2 }] });
    expect(mocks.stock.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
  it('stock cambiado antes de confirmar conserva guía y exige corrección', async () => {
    await selectQuantity();
    fireEvent.click(screen.getByRole('button', { name: 'Revisar traslado' }));
    const dialog = await screen.findByRole('dialog');
    mocks.stock.mockResolvedValue({ items: [{ catalogId: 'ram', locationId: 'central', quantity: 1 }], total: 1 });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar traslado' }));
    await screen.findByText('Revisa las cantidades y la disponibilidad en el origen.');
    expect(mocks.create).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Cantidad de Memoria RAM')).toHaveValue(2);
  });
  it('permite confirmar un traslado serializado o mixto directamente', async () => {
    mocks.create.mockResolvedValue({
      ...receipt(),
      items: [{ id: 'line-serial', catalogId: 'laptop', hardwareItemId: 'unit', serialNumber: 'SN123', quantity: 1, sku: 'LAP', brand: 'Dell', model: 'Inspiron' }],
    });
    render(<MemoryRouter><TransferCreatePage /></MemoryRouter>);
    await screen.findByRole('option', { name: 'Puesto 212' });
    fireEvent.change(screen.getByLabelText('Puesto'), { target: { value: 'post' } });
    fireEvent.change(screen.getByLabelText('Serie o código de unidad (escáner o teclado)'), { target: { value: 'SN123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar unidad' }));
    await screen.findByText('Laptop');
    expect(screen.getByText('SN123')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Revisar traslado' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Confirmar traslado' })).toBeEnabled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar traslado' }));
    await screen.findByText('TR-BACKEND');
    expect(mocks.create).toHaveBeenCalledWith({
      fromLocationId: 'central',
      toLocationId: 'post',
      hardwareItemIds: ['unit'],
    });
  });
  it('un rol lector no monta ni consulta el formulario', async () => {
    useAuthStore.setState({ user: { ...useAuthStore.getState().user!, role: 'TECNICO' } });
    render(<MemoryRouter><TransferCreatePage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No tienes autorización'));
    expect(mocks.locations).not.toHaveBeenCalled();
  });

  it('muestra el diálogo de confirmación personalizado al intentar salir con cambios pendientes', async () => {
    render(<MemoryRouter><TransferCreatePage /></MemoryRouter>);
    await screen.findByRole('option', { name: 'Puesto 212' });
    
    // Sin cambios: el enlace a /logistics no abre modal de confirmación
    const historyLink = screen.getByRole('link', { name: 'Historial de traslados' });
    fireEvent.click(historyLink);
    expect(screen.queryByRole('dialog', { name: '¿Salir del traslado?' })).not.toBeInTheDocument();

    // Seleccionar puesto para habilitar el formulario
    fireEvent.change(screen.getByLabelText('Puesto'), { target: { value: 'post' } });

    // Agregar observaciones para que el borrador tenga cambios (dirty)
    const notesInput = screen.getByLabelText('Observaciones (opcional)');
    fireEvent.change(notesInput, { target: { value: 'Traslado urgente de prueba' } });

    // Clic en enlace interno con cambios pendientes: se abre diálogo personalizado
    fireEvent.click(historyLink);
    const exitDialog = await screen.findByRole('dialog', { name: '¿Salir del traslado?' });
    expect(within(exitDialog).getByText('¿Salir del traslado?')).toBeInTheDocument();
    expect(within(exitDialog).getByText(/perderás los cambios del traslado que todavía no has registrado/)).toBeInTheDocument();

    // Pulsar "Seguir editando" cierra el diálogo y conserva el borrador
    fireEvent.click(within(exitDialog).getByRole('button', { name: 'Seguir editando' }));
    expect(screen.queryByRole('dialog', { name: '¿Salir del traslado?' })).not.toBeInTheDocument();
    expect(notesInput).toHaveValue('Traslado urgente de prueba');

    // Pulsar "Salir sin guardar" procede con la salida
    fireEvent.click(historyLink);
    const exitDialogReopen = await screen.findByRole('dialog', { name: '¿Salir del traslado?' });
    fireEvent.click(within(exitDialogReopen).getByRole('button', { name: 'Salir sin guardar' }));
    expect(screen.queryByRole('dialog', { name: '¿Salir del traslado?' })).not.toBeInTheDocument();
  });
});
