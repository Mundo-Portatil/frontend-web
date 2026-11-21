import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as categoryService from '../services/categoryService';
import { InventoryCategoriesPage } from './InventoryCategoriesPage';

vi.mock('../services/categoryService', () => ({
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
}));

const mockCategories = [
  {
    id: 'cat-1',
    name: 'Laptops',
    description: 'Equipos portátiles',
    active: true,
    productsCount: 12,
    createdAt: '2026-01-01',
  },
  {
    id: 'cat-2',
    name: 'Memorias RAM',
    description: 'Módulos DDR4 y DDR5',
    active: false,
    productsCount: 4,
    createdAt: '2026-01-02',
  },
];

describe('InventoryCategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoryService.listCategories).mockResolvedValue(mockCategories);
  });

  it('renders categories list with counts and badges', async () => {
    render(<InventoryCategoriesPage />);

    expect(screen.getByRole('heading', { level: 2, name: 'Categorías' })).toBeInTheDocument();
    expect(await screen.findByText('Laptops')).toBeInTheDocument();
    expect(screen.getByText('12 productos')).toBeInTheDocument();
    expect(screen.getByText('Memorias RAM')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
    expect(screen.getByText('Inactiva')).toBeInTheDocument();
  });

  it('filters categories by search input', async () => {
    const user = userEvent.setup();
    render(<InventoryCategoriesPage />);

    expect(await screen.findByText('Laptops')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Buscar categoría…');
    await user.type(searchInput, 'DDR5');

    expect(screen.queryByText('Laptops')).not.toBeInTheDocument();
    expect(screen.getByText('Memorias RAM')).toBeInTheDocument();
  });

  it('opens modal to create a new category', async () => {
    const user = userEvent.setup();
    vi.mocked(categoryService.createCategory).mockResolvedValue({
      id: 'cat-3',
      name: 'Monitores',
      description: 'Pantallas LED',
      active: true,
      productsCount: 0,
      createdAt: '2026-01-03',
    });

    render(<InventoryCategoriesPage />);
    await screen.findByText('Laptops');

    const newBtn = screen.getByRole('button', { name: '+ Nueva Categoría' });
    await user.click(newBtn);

    expect(screen.getByRole('heading', { name: 'Nueva Categoría' })).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Nombre de la categoría/i);
    await user.type(nameInput, 'Monitores');

    const submitBtn = screen.getByRole('button', { name: 'Crear' });
    await user.click(submitBtn);

    expect(categoryService.createCategory).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Monitores' }),
    );
  });
});
