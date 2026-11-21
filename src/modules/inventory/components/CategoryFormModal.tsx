import { useState, type FormEvent } from 'react';
import { asAppError } from '../../../services/api/errors';
import {
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
} from '../../../utils/formStyles';
import type { Category } from '../catalogModels';
import { createCategory, updateCategory } from '../services/categoryService';

interface CategoryFormModalProps {
  category?: Category | null;
  onClose: () => void;
  onSaved: (category: Category) => void;
}

export function CategoryFormModal({ category, onClose, onSaved }: CategoryFormModalProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [active, setActive] = useState(category?.active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (category) {
        const updated = await updateCategory(category.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          active,
        });
        onSaved(updated);
      } else {
        const created = await createCategory({
          name: name.trim(),
          description: description.trim() || undefined,
          active,
        });
        onSaved(created);
      }
      onClose();
    } catch (err) {
      setError(asAppError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <header className="mb-4">
          <h3 id="category-form-title" className="text-lg font-semibold text-slate-900">
            {category ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
        </header>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cat-name" className={LABEL_CLASS}>
              Nombre de la categoría <span className="text-red-500">*</span>
            </label>
            <input
              id="cat-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              className={TEXT_INPUT_CLASS}
              placeholder="Ej: Laptops, Memorias RAM, Teclados…"
              required
            />
          </div>

          <div>
            <label htmlFor="cat-desc" className={LABEL_CLASS}>
              Descripción (opcional)
            </label>
            <textarea
              id="cat-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              className={`${TEXT_INPUT_CLASS} resize-none`}
              placeholder="Descripción opcional…"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="cat-active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="cat-active" className="text-sm font-medium text-slate-700">
              Categoría activa
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" disabled={submitting} onClick={onClose} className={SECONDARY_BUTTON_CLASS}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className={PRIMARY_BUTTON_CLASS}>
              {submitting ? 'Guardando…' : category ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
