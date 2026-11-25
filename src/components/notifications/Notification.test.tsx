import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Notification } from './Notification';

describe('Notification', () => {
  it('renders success notifications as status messages', () => {
    render(<Notification kind="success">Operación completada.</Notification>);

    expect(screen.getByRole('status')).toHaveTextContent('Operación completada.');
  });

  it('renders warning notifications as status messages', () => {
    render(<Notification kind="warning">Revisa los datos.</Notification>);

    expect(screen.getByRole('status')).toHaveTextContent('Revisa los datos.');
  });

  it('renders error notifications as alerts', () => {
    render(<Notification kind="error">No se pudo completar la operación.</Notification>);

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo completar la operación.');
  });
});
