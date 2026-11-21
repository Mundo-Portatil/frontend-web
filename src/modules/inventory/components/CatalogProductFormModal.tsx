import { useState, type FormEvent } from 'react';
import { asAppError } from '../../../services/api/errors';
import {
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
} from '../../../utils/formStyles';
import { type CatalogItem, type Category, generateCategoryAutoSku } from '../catalogModels';
import { findDuplicateSerials } from '../hardwareValidation';
import { createCatalogItem, updateCatalogItem } from '../services/catalogService';
import { inboundInventory } from '../services/inventoryService';
import { SerialNumbersInputGrid } from './SerialNumbersInputGrid';

export { generateCategoryAutoSku };

interface CatalogProductFormModalProps {
  categories: Category[];
  initialItem?: CatalogItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function CatalogProductFormModal({
  categories,
  initialItem,
  onClose,
  onSaved,
}: CatalogProductFormModalProps) {
  const isEditing = Boolean(initialItem);

  const [brand, setBrand] = useState(initialItem?.brand ?? '');
  const [model, setModel] = useState(initialItem?.model ?? '');
  const [sku, setSku] = useState(initialItem?.sku ?? '');
  const [categoryId, setCategoryId] = useState(
    initialItem?.categoryId ?? (categories.length > 0 ? categories[0].id : ''),
  );
  const [basePrice, setBasePrice] = useState(
    initialItem?.basePrice !== undefined ? String(initialItem.basePrice) : '',
  );
  const [minStockThreshold, setMinStockThreshold] = useState(
    initialItem?.minStockThreshold !== undefined ? String(initialItem.minStockThreshold) : '2',
  );
  const [isSerialized, setIsSerialized] = useState(initialItem?.isSerialized ?? true);
  const [isSecondHand, setIsSecondHand] = useState(initialItem?.isSecondHand ?? false);
  const [active, setActive] = useState(initialItem?.active ?? true);

  // Technical specs
  const [processor, setProcessor] = useState(initialItem?.processor ?? '');
  const [ramCapacity, setRamCapacity] = useState(initialItem?.ramCapacity ?? '');
  const [storageCapacity, setStorageCapacity] = useState(initialItem?.storageCapacity ?? '');
  const [gpu, setGpu] = useState(initialItem?.gpu ?? '');
  const [screenSize, setScreenSize] = useState(initialItem?.screenSize ?? '');

  // Initial stock at Almacén Central (only for new products)
  const [initialQuantity, setInitialQuantity] = useState<number>(0);
  const [initialCostPrice, setInitialCostPrice] = useState<string>('');
  const [initialSerials, setInitialSerials] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSerialChange = (index: number, val: string) => {
    setInitialSerials((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleInitialQtyChange = (val: number) => {
    const qty = Math.max(0, val);
    setInitialQuantity(qty);
    setInitialSerials((prev) => {
      const next = [...prev];
      if (next.length < qty) {
        while (next.length < qty) next.push('');
      } else {
        next.length = qty;
      }
      return next;
    });
  };

  const duplicateSerials = findDuplicateSerials(initialSerials);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!brand.trim()) {
      setError('La marca es obligatoria.');
      return;
    }
    if (!model.trim()) {
      setError('El modelo es obligatorio.');
      return;
    }
    if (!categoryId) {
      setError('Debes seleccionar una categoría.');
      return;
    }
    const priceNum = Number(basePrice);
    if (!basePrice.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      setError('El precio base debe ser un número mayor o igual a 0.');
      return;
    }

    // Validation for initial stock if specified
    if (!isEditing && initialQuantity > 0) {
      if (initialCostPrice.trim() && (Number.isNaN(Number(initialCostPrice)) || Number(initialCostPrice) < 0)) {
        setError('El costo unitario inicial debe ser un número válido mayor o igual a 0.');
        return;
      }

      if (isSerialized) {
        const trimmedSerials = initialSerials.slice(0, initialQuantity).map((s) => s.trim());
        const hasEmpty = trimmedSerials.some((s) => !s);
        if (hasEmpty) {
          setError('Debe completar todos los números de serie para las unidades a ingresar.');
          return;
        }

        const duplicates = findDuplicateSerials(trimmedSerials);
        if (duplicates.length > 0) {
          setError(`Hay números de serie duplicados en el lote inicial: ${duplicates.join(', ')}`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      if (initialItem) {
        await updateCatalogItem(initialItem.id, {
          brand: brand.trim(),
          model: model.trim(),
          categoryId,
          basePrice: priceNum,
          minStockThreshold: Number(minStockThreshold) || 0,
          isSecondHand,
          active,
          processor: processor.trim() || undefined,
          ramCapacity: ramCapacity.trim() || undefined,
          storageCapacity: storageCapacity.trim() || undefined,
          gpu: gpu.trim() || undefined,
          screenSize: screenSize.trim() || undefined,
        });
      } else {
        // Resolve auto-sku if left blank by user
        let finalSku = sku.trim();
        if (!finalSku) {
          const selectedCat = categories.find((c) => c.id === categoryId);
          finalSku = generateCategoryAutoSku(selectedCat?.name ?? 'GEN');
        }

        const createdItem = await createCatalogItem({
          sku: finalSku,
          brand: brand.trim(),
          model: model.trim(),
          categoryId,
          basePrice: priceNum,
          minStockThreshold: Number(minStockThreshold) || 2,
          isSerialized,
          isSecondHand,
          active,
          processor: processor.trim() || undefined,
          ramCapacity: ramCapacity.trim() || undefined,
          storageCapacity: storageCapacity.trim() || undefined,
          gpu: gpu.trim() || undefined,
          screenSize: screenSize.trim() || undefined,
        });

        // Register initial stock at Central Warehouse if quantity > 0
        if (initialQuantity > 0) {
          const trimmedSerials = initialSerials.slice(0, initialQuantity).map((s) => s.trim());
          await inboundInventory({
            items: [
              {
                catalogId: createdItem.id,
                quantity: initialQuantity,
                hasSerialNumbers: isSerialized,
                serialNumbers: isSerialized ? trimmedSerials : undefined,
                costPrice: initialCostPrice.trim() ? Number(initialCostPrice) : undefined,
                salePrice: priceNum,
              },
            ],
            notes: 'Stock inicial al registrar modelo',
          });
        }
      }
      onSaved();
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
      aria-labelledby="product-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
        <header className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="product-form-title" className="text-lg font-semibold text-slate-900">
                {isEditing ? 'Editar Modelo en Catálogo' : 'Nuevo Modelo en Catálogo'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Los productos se identifican unívocamente por su Marca y Modelo.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="prod-brand" className={LABEL_CLASS}>
                Marca <span className="text-red-500">*</span>
              </label>
              <input
                id="prod-brand"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                disabled={submitting}
                className={TEXT_INPUT_CLASS}
                placeholder="Ej: Acer, HP, Logitech…"
                required
              />
            </div>

            <div>
              <label htmlFor="prod-model" className={LABEL_CLASS}>
                Modelo <span className="text-red-500">*</span>
              </label>
              <input
                id="prod-model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={submitting}
                className={TEXT_INPUT_CLASS}
                placeholder="Ej: Aspire 5, Pavilion 15, M170…"
                required
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="prod-category" className={LABEL_CLASS}>
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                id="prod-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={submitting}
                className={TEXT_INPUT_CLASS}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {!c.active ? '(inactiva)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prod-sku" className={LABEL_CLASS}>
                Código de Etiqueta {isEditing ? '(inmutable)' : '(opcional)'}
              </label>
              <input
                id="prod-sku"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                disabled={submitting || isEditing}
                className={TEXT_INPUT_CLASS}
                placeholder={
                  isEditing
                    ? 'Código de etiqueta'
                    : 'Dejar vacío para generar automático según categoría (ej. LAP-8F3A2C)'
                }
              />
              {!isEditing && (
                <p className="mt-1 text-[0.6875rem] text-slate-500">
                  Dejar vacío para generar automático según categoría (ej. LAP-8F3A2C).
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="prod-base-price" className={LABEL_CLASS}>
                Precio Base Referencial (S/) <span className="text-red-500">*</span>
              </label>
              <input
                id="prod-base-price"
                type="number"
                min="0"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                disabled={submitting}
                className={TEXT_INPUT_CLASS}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label htmlFor="prod-min-stock" className={LABEL_CLASS}>
                Umbral Stock Mínimo (Alerta)
              </label>
              <input
                id="prod-min-stock"
                type="number"
                min="0"
                step="1"
                value={minStockThreshold}
                onChange={(e) => setMinStockThreshold(e.target.value)}
                disabled={submitting}
                className={TEXT_INPUT_CLASS}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isSerialized}
                onChange={(e) => setIsSerialized(e.target.checked)}
                disabled={submitting || isEditing}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Requiere número de serie individual (Equipo/Pieza única)
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isSecondHand}
                onChange={(e) => setIsSecondHand(e.target.checked)}
                disabled={submitting}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Segunda mano
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                disabled={submitting}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Producto activo
            </label>
          </div>

          {/* Section: Stock Inicial en Almacén Central (Only on creation) */}
          {!isEditing && (
            <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 space-y-3">
              <div className="border-b border-brand-100 pb-2">
                <h4 className="text-sm font-semibold text-slate-900">
                  Stock Inicial en Almacén Central (Opcional)
                </h4>
                <p className="text-xs text-slate-500">
                  Permite ingresar unidades inmediatamente al crear este nuevo modelo en el inventario.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="prod-initial-qty" className={LABEL_CLASS}>
                    Cantidad inicial a ingresar
                  </label>
                  <input
                    id="prod-initial-qty"
                    type="number"
                    min="0"
                    step="1"
                    value={initialQuantity}
                    onChange={(e) => handleInitialQtyChange(parseInt(e.target.value, 10) || 0)}
                    disabled={submitting}
                    className={TEXT_INPUT_CLASS}
                  />
                </div>

                <div>
                  <label htmlFor="prod-initial-cost" className={LABEL_CLASS}>
                    Costo unitario de compra (S/ - opcional)
                  </label>
                  <input
                    id="prod-initial-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={initialCostPrice}
                    onChange={(e) => setInitialCostPrice(e.target.value)}
                    disabled={submitting}
                    placeholder="0.00"
                    className={TEXT_INPUT_CLASS}
                  />
                </div>
              </div>

              {/* Dynamic serials grid if serialized and qty > 0 */}
              {isSerialized && initialQuantity > 0 && (
                <div className="mt-2">
                  <SerialNumbersInputGrid
                    quantity={initialQuantity}
                    serialNumbers={initialSerials}
                    onChange={handleSerialChange}
                    disabled={submitting}
                    duplicateSerials={duplicateSerials}
                  />
                </div>
              )}
            </div>
          )}

          <details className="rounded-lg border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">
              Especificaciones Técnicas Opcionales
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="prod-processor" className={LABEL_CLASS}>
                  Procesador
                </label>
                <input
                  id="prod-processor"
                  type="text"
                  value={processor}
                  onChange={(e) => setProcessor(e.target.value)}
                  disabled={submitting}
                  className={TEXT_INPUT_CLASS}
                  placeholder="Ej: Intel Core i5-12450H, AMD Ryzen 5…"
                />
              </div>

              <div>
                <label htmlFor="prod-ram" className={LABEL_CLASS}>
                  Memoria RAM
                </label>
                <input
                  id="prod-ram"
                  type="text"
                  value={ramCapacity}
                  onChange={(e) => setRamCapacity(e.target.value)}
                  disabled={submitting}
                  className={TEXT_INPUT_CLASS}
                  placeholder="Ej: 8GB DDR4, 16GB DDR5…"
                />
              </div>

              <div>
                <label htmlFor="prod-storage" className={LABEL_CLASS}>
                  Almacenamiento
                </label>
                <input
                  id="prod-storage"
                  type="text"
                  value={storageCapacity}
                  onChange={(e) => setStorageCapacity(e.target.value)}
                  disabled={submitting}
                  className={TEXT_INPUT_CLASS}
                  placeholder="Ej: 512GB NVMe SSD, 1TB HDD…"
                />
              </div>

              <div>
                <label htmlFor="prod-gpu" className={LABEL_CLASS}>
                  Tarjeta Gráfica (GPU)
                </label>
                <input
                  id="prod-gpu"
                  type="text"
                  value={gpu}
                  onChange={(e) => setGpu(e.target.value)}
                  disabled={submitting}
                  className={TEXT_INPUT_CLASS}
                  placeholder="Ej: Intel Iris Xe, RTX 3050 4GB…"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="prod-screen" className={LABEL_CLASS}>
                  Tamaño de Pantalla
                </label>
                <input
                  id="prod-screen"
                  type="text"
                  value={screenSize}
                  onChange={(e) => setScreenSize(e.target.value)}
                  disabled={submitting}
                  className={TEXT_INPUT_CLASS}
                  placeholder="Ej: 15.6' FHD IPS 144Hz…"
                />
              </div>
            </div>
          </details>

          <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className={SECONDARY_BUTTON_CLASS}
            >
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className={PRIMARY_BUTTON_CLASS}>
              {submitting ? 'Guardando…' : isEditing ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
