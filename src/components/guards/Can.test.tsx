import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../../stores/authStore';
import { Can } from './Can';

const BASE_USER = {
  id: 'user-1',
  email: 'user@mundoportatil.pe',
  name: 'Usuario',
  role: 'ADMIN' as const,
  active: true,
};

describe('Can', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'authenticated', user: BASE_USER });
  });

  it('renders content when the authenticated role is allowed', () => {
    render(
      <Can roles={['ADMIN']}>
        <button type="button">Acción administrativa</button>
      </Can>,
    );

    expect(screen.getByRole('button', { name: 'Acción administrativa' })).toBeInTheDocument();
  });

  it('hides content when the authenticated role is not allowed', () => {
    useAuthStore.setState({ user: { ...BASE_USER, role: 'TECNICO' } });

    render(
      <Can roles={['ADMIN']}>
        <button type="button">Acción administrativa</button>
      </Can>,
    );

    expect(screen.queryByRole('button', { name: 'Acción administrativa' })).not.toBeInTheDocument();
  });

  it('renders the fallback when provided', () => {
    useAuthStore.setState({ user: { ...BASE_USER, role: 'VENDEDOR' } });

    render(
      <Can roles={['ADMIN']} fallback={<p>Sin permisos</p>}>
        <button type="button">Acción administrativa</button>
      </Can>,
    );

    expect(screen.getByText('Sin permisos')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acción administrativa' })).not.toBeInTheDocument();
  });
});
