import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BarcodeLabelsPanel } from './BarcodeLabelsPanel';
import { getBatchLabels } from '../services/barcodeLabelService';
vi.mock('../services/barcodeLabelService', () => ({ getBatchLabels: vi.fn() }));
describe('label data panel', () => {
  it('validates IDs and shows contracted label fields without physical printing', async () => {
    const user = userEvent.setup();
    vi.mocked(getBatchLabels).mockResolvedValue([{ hardwareItemId: 'id', barcodeValue: 'SN1', title: 'Laptop', specsSummary: '16GB', locationName: 'Central', price: 1200 }]);
    render(<BarcodeLabelsPanel />);
    await user.type(screen.getByLabelText('IDs de hardware para etiquetas'), 'invalid');
    await user.click(screen.getByRole('button', { name: 'Consultar etiquetas' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('UUIDv4');
    expect(getBatchLabels).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText('IDs de hardware para etiquetas'));
    await user.type(screen.getByLabelText('IDs de hardware para etiquetas'), '123e4567-e89b-42d3-a456-426614174000');
    await user.click(screen.getByRole('button', { name: 'Consultar etiquetas' }));
    expect(await screen.findByText('SN1')).toBeInTheDocument();
    expect(screen.getByText('16GB')).toBeInTheDocument();
    expect(screen.getByText('Precio: 1200')).toBeInTheDocument();
  });
});
