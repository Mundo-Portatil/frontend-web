import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDate } from '../../../../utils/formatDate';
import { AuditLogsPage } from './AuditLogsPage';
import * as auditLogService from '../services/auditLogService';
import * as userService from '../../users/services/userService';

vi.mock('../services/auditLogService', () => ({
  listAuditLogs: vi.fn(),
}));

vi.mock('../../users/services/userService', () => ({
  listUsers: vi.fn(),
}));

const USER_ID = '59673086-e125-4a1c-b549-f243e19e42d4';
const OTHER_USER_ID = '7d8e9f00-1234-4abc-8def-0123456789ab';

const SAMPLE_USER = {
  id: USER_ID,
  email: 'maria.auditora@mundoportatil.pe',
  name: 'María Auditora',
  role: 'ADMIN' as const,
  active: true,
  createdAt: '2026-11-14T20:00:00.000Z',
  updatedAt: '2026-11-14T20:00:00.000Z',
};

const OTHER_USER = {
  ...SAMPLE_USER,
  id: OTHER_USER_ID,
  email: 'ana.auditora@mundoportatil.pe',
  name: 'Ana Auditora',
};

const EMPTY_RESULT = { items: [], total: 0, page: 1, limit: 20 };

const SAMPLE_RESULT = {
  items: [
    {
      id: 'log-1',
      userId: USER_ID,
      action: 'CREATE_USER',
      module: 'users',
      payload: { id: 'user-1' },
      ipAddress: '127.0.0.1',
      createdAt: '2026-11-14T20:30:00.000Z',
    },
  ],
  total: 30,
  page: 1,
  limit: 20,
};

describe('AuditLogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auditLogService.listAuditLogs).mockResolvedValue(EMPTY_RESULT);
    vi.mocked(userService.listUsers).mockResolvedValue([SAMPLE_USER]);
  });

  it('shows the loading state during the initial query', () => {
    vi.mocked(auditLogService.listAuditLogs).mockReturnValueOnce(new Promise(() => {}));
    vi.mocked(userService.listUsers).mockReturnValueOnce(new Promise(() => {}));

    render(<AuditLogsPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando registros...');
  });

  it('shows the empty state when there are no records', async () => {
    render(<AuditLogsPage />);

    expect(
      await screen.findByText('No existen registros de auditoría para los filtros aplicados.'),
    ).toBeInTheDocument();
  });

  it('shows an error state with retry when the query fails', async () => {
    vi.mocked(auditLogService.listAuditLogs)
      .mockRejectedValueOnce({
        kind: 'server',
        message: 'Error interno del servidor. Intenta nuevamente.',
      })
      .mockResolvedValueOnce(EMPTY_RESULT);

    render(<AuditLogsPage />);

    expect(
      await screen.findByText('Error interno del servidor. Intenta nuevamente.'),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(
      await screen.findByText('No existen registros de auditoría para los filtros aplicados.'),
    ).toBeInTheDocument();
    expect(auditLogService.listAuditLogs).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['Usuarios', 'users'],
    ['Autenticación', 'auth'],
    ['Ubicaciones', 'locations'],
    ['Categorías', 'categories'],
  ])('translates the visible module label %s to the API value %s', async (label, expectedModule) => {
    render(<AuditLogsPage />);
    const user = userEvent.setup();
    await screen.findByText('No existen registros de auditoría para los filtros aplicados.');

    await user.type(screen.getByLabelText('Módulo'), label);
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));

    await waitFor(() => {
      expect(auditLogService.listAuditLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ module: expectedModule }),
      );
    });
  });

  it('combines the module label filter with the user filter', async () => {
    render(<AuditLogsPage />);
    const user = userEvent.setup();
    await screen.findByText('No existen registros de auditoría para los filtros aplicados.');

    await user.type(screen.getByLabelText('Módulo'), 'Usuarios');
    await user.type(screen.getByLabelText('Usuario'), 'María Auditora');
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));

    await waitFor(() => {
      expect(auditLogService.listAuditLogs).toHaveBeenLastCalledWith({
        module: 'users',
        userId: USER_ID,
        page: 1,
        limit: 20,
      });
    });
  });

  it('filters by user name by resolving it to the contract userId', async () => {
    render(<AuditLogsPage />);
    const user = userEvent.setup();
    await screen.findByText('No existen registros de auditoría para los filtros aplicados.');

    await user.type(screen.getByLabelText('Módulo'), 'users');
    await user.type(screen.getByLabelText('Usuario'), 'María Auditora');
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));

    await waitFor(() => {
      expect(auditLogService.listAuditLogs).toHaveBeenLastCalledWith({
        module: 'users',
        userId: USER_ID,
        page: 1,
        limit: 20,
      });
    });
  });

  it('shows user suggestions with name and email and applies the selected user', async () => {
    render(<AuditLogsPage />);
    const user = userEvent.setup();
    await screen.findByText('No existen registros de auditoría para los filtros aplicados.');

    await user.type(screen.getByLabelText('Usuario'), 'maria');

    const option = await screen.findByRole('option', { name: /María Auditora/ });
    expect(option).toHaveTextContent('maria.auditora@mundoportatil.pe');

    await user.click(option);
    expect(screen.getByLabelText('Usuario')).toHaveValue('María Auditora');
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));

    await waitFor(() => {
      expect(auditLogService.listAuditLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ userId: USER_ID }),
      );
    });
  });

  it('asks the administrator to choose when the name matches several users', async () => {
    vi.mocked(userService.listUsers).mockResolvedValueOnce([SAMPLE_USER, OTHER_USER]);
    render(<AuditLogsPage />);
    const user = userEvent.setup();
    await screen.findByText('No existen registros de auditoría para los filtros aplicados.');

    await user.type(screen.getByLabelText('Usuario'), 'Auditora');
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));

    expect(
      screen.getByText('Selecciona un usuario de las coincidencias.'),
    ).toBeInTheDocument();
    expect(auditLogService.listAuditLogs).toHaveBeenCalledTimes(1);
  });

  it('validates that the typed name or email exists', async () => {
    render(<AuditLogsPage />);
    const user = userEvent.setup();
    await screen.findByText('No existen registros de auditoría para los filtros aplicados.');

    await user.type(screen.getByLabelText('Usuario'), 'Usuario inexistente');
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));

    expect(
      screen.getByText('No se encontró un usuario con ese nombre o correo.'),
    ).toBeInTheDocument();
    expect(auditLogService.listAuditLogs).toHaveBeenCalledTimes(1);
  });

  it('paginates records using the contract page and limit values', async () => {
    vi.mocked(auditLogService.listAuditLogs)
      .mockResolvedValueOnce(SAMPLE_RESULT)
      .mockResolvedValueOnce({ ...SAMPLE_RESULT, page: 2 });

    render(<AuditLogsPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Siguiente' }));

    await waitFor(() => {
      expect(auditLogService.listAuditLogs).toHaveBeenLastCalledWith({
        module: '',
        userId: '',
        page: 2,
        limit: 20,
      });
    });
  });

  it('uses the applied filters when paginating even after editing the form', async () => {
    vi.mocked(auditLogService.listAuditLogs)
      .mockResolvedValueOnce(EMPTY_RESULT)
      .mockResolvedValueOnce(SAMPLE_RESULT)
      .mockResolvedValueOnce({ ...SAMPLE_RESULT, page: 2 });

    render(<AuditLogsPage />);
    const user = userEvent.setup();
    await screen.findByText('No existen registros de auditoría para los filtros aplicados.');

    await user.type(screen.getByLabelText('Módulo'), 'users');
    await user.type(screen.getByLabelText('Usuario'), 'María Auditora');
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));
    await screen.findByText('Creó usuario');

    await user.clear(screen.getByLabelText('Usuario'));
    await user.type(screen.getByLabelText('Usuario'), 'Otro usuario');
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => {
      expect(auditLogService.listAuditLogs).toHaveBeenLastCalledWith({
        module: 'users',
        userId: USER_ID,
        page: 2,
        limit: 20,
      });
    });
  });

  it('retries the exact page that failed', async () => {
    vi.mocked(auditLogService.listAuditLogs)
      .mockResolvedValueOnce(SAMPLE_RESULT)
      .mockRejectedValueOnce({
        kind: 'server',
        message: 'Error interno del servidor. Intenta nuevamente.',
      })
      .mockResolvedValueOnce({ ...SAMPLE_RESULT, page: 2 });

    render(<AuditLogsPage />);
    const user = userEvent.setup();
    await screen.findByText('Creó usuario');

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(
      await screen.findByText('Error interno del servidor. Intenta nuevamente.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => {
      expect(auditLogService.listAuditLogs).toHaveBeenLastCalledWith({
        module: '',
        userId: '',
        page: 2,
        limit: 20,
      });
    });
  });

  it('describes update events from the real payload changes', async () => {
    vi.mocked(auditLogService.listAuditLogs).mockResolvedValueOnce({
      ...SAMPLE_RESULT,
      total: 8,
      items: [
        {
          ...SAMPLE_RESULT.items[0],
          id: 'log-deactivated',
          action: 'UPDATE_USER',
          payload: { id: 'user-1', changes: { active: false } },
        },
        {
          ...SAMPLE_RESULT.items[0],
          id: 'log-reactivated',
          action: 'UPDATE_USER',
          payload: { id: 'user-1', changes: { active: true } },
        },
        {
          ...SAMPLE_RESULT.items[0],
          id: 'log-role',
          action: 'UPDATE_USER',
          payload: { id: 'user-1', changes: { role: 'TECNICO' } },
        },
        {
          ...SAMPLE_RESULT.items[0],
          id: 'log-name',
          action: 'UPDATE_USER',
          payload: { id: 'user-1', changes: { name: 'María Actualizada' } },
        },
        {
          ...SAMPLE_RESULT.items[0],
          id: 'log-password',
          action: 'UPDATE_USER',
          payload: { id: 'user-1', changes: { passwordUpdated: true } },
        },
        {
          ...SAMPLE_RESULT.items[0],
          id: 'log-mixed',
          action: 'UPDATE_USER',
          payload: { id: 'user-1', changes: { name: 'María Actualizada', role: 'ADMIN' } },
        },
        {
          ...SAMPLE_RESULT.items[0],
          id: 'log-location',
          action: 'UPDATE_LOCATION',
          module: 'locations',
          payload: { id: 'location-1', changes: { active: true } },
        },
        {
          ...SAMPLE_RESULT.items[0],
          id: 'log-without-changes',
          action: 'UPDATE_USER',
          payload: { id: 'user-1' },
        },
      ],
    });

    render(<AuditLogsPage />);

    expect(await screen.findByText('Usuario desactivado')).toBeInTheDocument();
    expect(screen.getByText('Usuario reactivado')).toBeInTheDocument();
    expect(screen.getByText('Rol de usuario modificado')).toBeInTheDocument();
    expect(screen.getByText('Nombre de usuario actualizado')).toBeInTheDocument();
    expect(screen.getByText('Contraseña de usuario actualizada')).toBeInTheDocument();
    expect(
      screen.getByText('Rol de usuario modificado · Nombre de usuario actualizado'),
    ).toBeInTheDocument();
    expect(screen.getByText('Ubicación reactivada')).toBeInTheDocument();
    expect(screen.getByText('Usuario actualizado')).toBeInTheDocument();
  });

  it('shows category actions in Spanish and flags unknown actions', async () => {
    vi.mocked(auditLogService.listAuditLogs).mockResolvedValueOnce({
      ...SAMPLE_RESULT,
      total: 3,
      items: [
        {
          ...SAMPLE_RESULT.items[0],
          id: 'log-update-category',
          action: 'update category',
          module: 'categories',
          payload: { id: 'category-1' },
        },
        {
          ...SAMPLE_RESULT.items[0],
          id: 'log-create-category',
          action: 'create category',
          module: 'categories',
          payload: { id: 'category-2' },
        },
        {
          ...SAMPLE_RESULT.items[0],
          id: 'log-unknown',
          action: 'export report',
          module: 'reports',
          payload: {},
        },
      ],
    });

    render(<AuditLogsPage />);

    expect(await screen.findByText('Categoría actualizada')).toBeInTheDocument();
    expect(screen.getByText('Categoría creada')).toBeInTheDocument();
    expect(screen.getByText('Acción no traducida: export report')).toBeInTheDocument();
    expect(screen.getAllByText('Categorías')).toHaveLength(2);
  });

  it('shows Sistema when the event has no associated user', async () => {
    vi.mocked(auditLogService.listAuditLogs).mockResolvedValueOnce({
      ...SAMPLE_RESULT,
      total: 1,
      items: [{ ...SAMPLE_RESULT.items[0], id: 'log-system', userId: null }],
    });

    render(<AuditLogsPage />);

    expect(await screen.findByText('Sistema')).toBeInTheDocument();
  });

  it('shows the administrative user name instead of the UUID', async () => {
    vi.mocked(auditLogService.listAuditLogs).mockResolvedValueOnce(SAMPLE_RESULT);

    render(<AuditLogsPage />);

    expect(await screen.findByText('María Auditora')).toBeInTheDocument();
    expect(screen.getByText('maria.auditora@mundoportatil.pe')).toBeInTheDocument();
    expect(screen.queryByText(USER_ID)).not.toBeInTheDocument();
    expect(userService.listUsers).toHaveBeenCalledTimes(1);
  });

  it('does not expose IP addresses or technical identifiers in the table', async () => {
    vi.mocked(auditLogService.listAuditLogs).mockResolvedValueOnce(SAMPLE_RESULT);

    render(<AuditLogsPage />);

    expect(await screen.findByText('Creó usuario')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'IP' })).not.toBeInTheDocument();
    expect(screen.queryByText('127.0.0.1')).not.toBeInTheDocument();
    expect(screen.queryByText(USER_ID)).not.toBeInTheDocument();
  });

  it('keeps the date on one readable line', async () => {
    vi.mocked(auditLogService.listAuditLogs).mockResolvedValueOnce(SAMPLE_RESULT);

    render(<AuditLogsPage />);

    const date = await screen.findByText(formatDate(SAMPLE_RESULT.items[0].createdAt));
    expect(date).toHaveClass('whitespace-nowrap');
  });

  it('labels records whose user no longer exists without exposing the UUID', async () => {
    vi.mocked(auditLogService.listAuditLogs).mockResolvedValueOnce(SAMPLE_RESULT);
    vi.mocked(userService.listUsers).mockResolvedValueOnce([]);

    render(<AuditLogsPage />);

    expect(await screen.findByText('Usuario desconocido')).toBeInTheDocument();
    expect(screen.queryByText(USER_ID)).not.toBeInTheDocument();
  });

  it('keeps the audit records visible when the user directory cannot be loaded', async () => {
    vi.mocked(auditLogService.listAuditLogs).mockResolvedValueOnce(SAMPLE_RESULT);
    vi.mocked(userService.listUsers).mockRejectedValueOnce({
      kind: 'server',
      message: 'Error interno del servidor. Intenta nuevamente.',
    });

    render(<AuditLogsPage />);

    expect(await screen.findByText('Creó usuario')).toBeInTheDocument();
    expect(await screen.findByText('No se pudieron cargar los nombres de usuario.')).toBeInTheDocument();
    expect(screen.queryByText(USER_ID)).not.toBeInTheDocument();
  });

  it('is a read-only screen without modification actions', async () => {
    vi.mocked(auditLogService.listAuditLogs).mockResolvedValueOnce(SAMPLE_RESULT);

    render(<AuditLogsPage />);

    expect(await screen.findByText('Creó usuario')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /crear|editar|eliminar/i })).not.toBeInTheDocument();
  });
});
