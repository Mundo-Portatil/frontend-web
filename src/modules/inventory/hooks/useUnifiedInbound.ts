import { useEffect, useState } from 'react';
import { asAppError } from '../../../services/api/errors';
import {
  generateCategoryAutoSku,
  type CatalogItem,
  type Category,
  type CreateCatalogInput,
} from '../catalogModels';
import { newDraftBatchItem, type DraftBatchItem } from '../hardwareDraft';
import type { UnifiedInboundPayload, UnifiedInboundResponse } from '../hardwareModels';
import { findDuplicateSerials, validateBatchItem } from '../hardwareValidation';
import { createCatalogItem } from '../services/catalogService';
import { listCategories } from '../services/categoryService';
import { validateSerials } from '../services/hardwareItemService';
import { inboundInventory } from '../services/inventoryService';

export function useUnifiedInbound() {
  const [inboundMode, setInboundMode] = useState<'existing' | 'new'>('existing');
  const [categories, setCategories] = useState<Category[]>([]);

  // Existing product draft
  const [batchItems, setBatchItems] = useState<DraftBatchItem[]>([]);
  const [currentItem, setCurrentItem] = useState<DraftBatchItem>(() => newDraftBatchItem());

  // New model draft
  const [newBrand, setNewBrand] = useState<string>('');
  const [newModel, setNewModel] = useState<string>('');
  const [newCategoryId, setNewCategoryId] = useState<string>('');
  const [newSku, setNewSku] = useState<string>('');
  const [newBasePrice, setNewBasePrice] = useState<string>('');
  const [newMinStockThreshold, setNewMinStockThreshold] = useState<string>('2');
  const [newRequiresSerials, setNewRequiresSerials] = useState<boolean>(true);
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [newCostPrice, setNewCostPrice] = useState<string>('');
  const [newSerials, setNewSerials] = useState<string[]>(['']);

  // Optional specs for new model
  const [newProcessor, setNewProcessor] = useState<string>('');
  const [newRam, setNewRam] = useState<string>('');
  const [newStorage, setNewStorage] = useState<string>('');
  const [newGpu, setNewGpu] = useState<string>('');
  const [newScreenSize, setNewScreenSize] = useState<string>('');

  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [validatingSerials, setValidatingSerials] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [response, setResponse] = useState<UnifiedInboundResponse | null>(null);

  // Load categories
  useEffect(() => {
    let active = true;
    void listCategories({ active: true })
      .then((cats) => {
        if (active) {
          setCategories(cats);
          if (cats.length > 0 && !newCategoryId) {
            setNewCategoryId(cats[0].id);
          }
        }
      })
      .catch((e) => {
        if (active) setError(asAppError(e).message);
      });
    return () => {
      active = false;
    };
  }, []);

  // Sync category default if categories load later
  useEffect(() => {
    if (categories.length > 0 && !newCategoryId) {
      setNewCategoryId(categories[0].id);
    }
  }, [categories, newCategoryId]);

  // Existing product selection
  const selectCatalogProduct = (product: CatalogItem | null) => {
    if (!product) {
      setCurrentItem((prev) => ({
        ...prev,
        catalogId: '',
        catalog: null,
      }));
      return;
    }

    setCurrentItem((prev) => {
      const isSerialized = Boolean(product.isSerialized);
      const qty = prev.quantity > 0 ? prev.quantity : 1;
      const serials = isSerialized
        ? Array.from({ length: qty }, (_, i) => prev.serialNumbers[i] ?? '')
        : [];

      return {
        ...prev,
        catalogId: product.id,
        catalog: product,
        hasSerialNumbers: isSerialized,
        serialNumbers: serials,
        salePrice: product.basePrice > 0 ? String(product.basePrice) : prev.salePrice,
      };
    });
    setFieldErrors([]);
    setError(null);
  };

  const setQuantity = (quantity: number) => {
    const qty = Math.max(1, quantity);
    setCurrentItem((prev) => {
      let serials = prev.serialNumbers;
      if (prev.hasSerialNumbers) {
        serials = Array.from({ length: qty }, (_, i) => prev.serialNumbers[i] ?? '');
      }
      return {
        ...prev,
        quantity: qty,
        serialNumbers: serials,
      };
    });
  };

  const setHasSerialNumbers = (hasSerialNumbers: boolean) => {
    setCurrentItem((prev) => {
      const serials = hasSerialNumbers
        ? Array.from({ length: prev.quantity }, (_, i) => prev.serialNumbers[i] ?? '')
        : [];
      return {
        ...prev,
        hasSerialNumbers,
        serialNumbers: serials,
      };
    });
  };

  const updateSerialNumber = (index: number, value: string) => {
    setCurrentItem((prev) => {
      const updated = [...prev.serialNumbers];
      updated[index] = value;
      return {
        ...prev,
        serialNumbers: updated,
      };
    });
  };

  const updateCostPrice = (costPrice: string) => {
    setCurrentItem((prev) => ({ ...prev, costPrice }));
  };

  const updateSalePrice = (salePrice: string) => {
    setCurrentItem((prev) => ({ ...prev, salePrice }));
  };

  // New model setters
  const setNewQuantityWithSerials = (qty: number) => {
    const q = Math.max(1, qty);
    setNewQuantity(q);
    setNewSerials((prev) => Array.from({ length: q }, (_, i) => prev[i] ?? ''));
  };

  const setNewRequiresSerialsWithSerials = (requires: boolean) => {
    setNewRequiresSerials(requires);
    if (requires) {
      setNewSerials((prev) => Array.from({ length: newQuantity }, (_, i) => prev[i] ?? ''));
    }
  };

  const updateNewSerialNumber = (index: number, value: string) => {
    setNewSerials((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const resetNewModelForm = () => {
    setNewBrand('');
    setNewModel('');
    setNewSku('');
    setNewBasePrice('');
    setNewMinStockThreshold('2');
    setNewRequiresSerials(true);
    setNewQuantity(1);
    setNewCostPrice('');
    setNewSerials(['']);
    setNewProcessor('');
    setNewRam('');
    setNewStorage('');
    setNewGpu('');
    setNewScreenSize('');
  };

  const addItemToBatch = async () => {
    setError(null);
    setFieldErrors([]);

    if (inboundMode === 'existing') {
      const errors = validateBatchItem(currentItem);
      if (errors.length > 0) {
        setFieldErrors(errors);
        return false;
      }

      if (currentItem.hasSerialNumbers) {
        const currentSerials = currentItem.serialNumbers.map((s) => s.trim()).filter(Boolean);

        // Check duplicates against already added items in batch
        const alreadyInBatchSerials = batchItems.flatMap((item) =>
          item.hasSerialNumbers ? item.serialNumbers.map((s) => s.trim()).filter(Boolean) : [],
        );

        const crossDuplicates = currentSerials.filter((s) =>
          alreadyInBatchSerials.some((b) => b.toUpperCase() === s.toUpperCase()),
        );

        if (crossDuplicates.length > 0) {
          setFieldErrors([`Series ya ingresadas en otros productos del lote: ${crossDuplicates.join(', ')}`]);
          return false;
        }

        // Check remote database validation
        setValidatingSerials(true);
        try {
          const valRes = await validateSerials(currentSerials);
          if (!valRes.allValid && valRes.existingSerials?.length > 0) {
            setFieldErrors([
              `Series que ya existen en el sistema: ${valRes.existingSerials.join(', ')}`,
            ]);
            return false;
          }
        } catch (err) {
          setError(`Error validando series con el servidor: ${asAppError(err).message}`);
          return false;
        } finally {
          setValidatingSerials(false);
        }
      }

      setBatchItems((prev) => [...prev, currentItem]);
      setCurrentItem(newDraftBatchItem());
      return true;
    }

    // inboundMode === 'new'
    const newErrors: string[] = [];
    if (!newBrand.trim()) newErrors.push('La marca del producto es obligatoria.');
    if (!newModel.trim()) newErrors.push('El modelo del producto es obligatorio.');
    if (!newCategoryId) newErrors.push('Debe seleccionar una categoría para el nuevo modelo.');

    const priceNum = Number(newBasePrice);
    if (!newBasePrice.trim() || !Number.isFinite(priceNum) || priceNum <= 0) {
      newErrors.push('El precio base / venta debe ser un número mayor a cero.');
    }

    if (newQuantity <= 0 || !Number.isInteger(newQuantity)) {
      newErrors.push('La cantidad debe ser un entero mayor o igual a 1.');
    }

    if (newCostPrice.trim() !== '') {
      const c = Number(newCostPrice);
      if (!Number.isFinite(c) || c < 0) {
        newErrors.push('El costo unitario debe ser un número mayor o igual a cero.');
      }
    }

    if (newRequiresSerials) {
      const filled = newSerials.map((s) => s.trim()).filter(Boolean);
      if (filled.length !== newQuantity) {
        newErrors.push(
          `Se requieren exactamente ${newQuantity} números de serie (${filled.length} ingresados).`,
        );
      }
      const duplicates = findDuplicateSerials(filled);
      if (duplicates.length > 0) {
        newErrors.push(`Series duplicadas en este producto: ${duplicates.join(', ')}`);
      }
    }

    if (newErrors.length > 0) {
      setFieldErrors(newErrors);
      return false;
    }

    // Resolve SKU (auto-generated if empty)
    const selectedCategory = categories.find((c) => c.id === newCategoryId);
    const categoryName = selectedCategory?.name || 'GEN';
    const finalSku = newSku.trim() !== '' ? newSku.trim() : generateCategoryAutoSku(categoryName);

    const newModelData: CreateCatalogInput = {
      brand: newBrand.trim(),
      model: newModel.trim(),
      categoryId: newCategoryId,
      sku: finalSku,
      basePrice: priceNum,
      minStockThreshold: Number(newMinStockThreshold) || 2,
      isSerialized: newRequiresSerials,
      isSecondHand: false,
      active: true,
      processor: newProcessor.trim() || undefined,
      ramCapacity: newRam.trim() || undefined,
      storageCapacity: newStorage.trim() || undefined,
      gpu: newGpu.trim() || undefined,
      screenSize: newScreenSize.trim() || undefined,
    };

    if (newRequiresSerials) {
      const currentSerials = newSerials.map((s) => s.trim()).filter(Boolean);
      const alreadyInBatchSerials = batchItems.flatMap((item) =>
        item.hasSerialNumbers ? item.serialNumbers.map((s) => s.trim()).filter(Boolean) : [],
      );

      const crossDuplicates = currentSerials.filter((s) =>
        alreadyInBatchSerials.some((b) => b.toUpperCase() === s.toUpperCase()),
      );

      if (crossDuplicates.length > 0) {
        setFieldErrors([`Series ya ingresadas en otros productos del lote: ${crossDuplicates.join(', ')}`]);
        return false;
      }

      setValidatingSerials(true);
      try {
        const valRes = await validateSerials(currentSerials);
        if (!valRes.allValid && valRes.existingSerials?.length > 0) {
          setFieldErrors([
            `Series que ya existen en el sistema: ${valRes.existingSerials.join(', ')}`,
          ]);
          return false;
        }
      } catch (err) {
        setError(`Error validando series con el servidor: ${asAppError(err).message}`);
        return false;
      } finally {
        setValidatingSerials(false);
      }
    }

    const newBatchItem: DraftBatchItem = {
      draftId: Date.now() + Math.random(),
      isNewModel: true,
      newModelData,
      catalogId: '',
      catalog: {
        id: 'pending-catalog-creation',
        brand: newBrand.trim(),
        model: newModel.trim(),
        sku: finalSku,
        categoryId: newCategoryId,
        basePrice: priceNum,
        minStockThreshold: Number(newMinStockThreshold) || 2,
        isSerialized: newRequiresSerials,
        isSecondHand: false,
        active: true,
        processor: newProcessor.trim() || null,
        ramCapacity: newRam.trim() || null,
        storageCapacity: newStorage.trim() || null,
        gpu: newGpu.trim() || null,
        screenSize: newScreenSize.trim() || null,
        createdAt: '',
      },
      quantity: newQuantity,
      hasSerialNumbers: newRequiresSerials,
      serialNumbers: newRequiresSerials ? newSerials : [],
      costPrice: newCostPrice,
      salePrice: newBasePrice,
    };

    setBatchItems((prev) => [...prev, newBatchItem]);
    resetNewModelForm();
    return true;
  };

  const removeItemFromBatch = (draftId: number) => {
    setBatchItems((prev) => prev.filter((item) => item.draftId !== draftId));
  };

  const submitBatch = async () => {
    if (batchItems.length === 0) {
      setError('Debes agregar al menos un producto al lote antes de confirmar.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // 1. Create catalog items for items marked as new models
      const resolvedItems: DraftBatchItem[] = [];
      for (const item of batchItems) {
        if (item.isNewModel && item.newModelData) {
          const created = await createCatalogItem(item.newModelData);
          resolvedItems.push({
            ...item,
            catalogId: created.id,
            catalog: created,
          });
        } else {
          resolvedItems.push(item);
        }
      }

      // 2. Submit unified inbound
      const payload: UnifiedInboundPayload = {
        items: resolvedItems.map((item) => ({
          catalogId: item.catalogId,
          quantity: item.quantity,
          hasSerialNumbers: item.hasSerialNumbers,
          ...(item.hasSerialNumbers
            ? { serialNumbers: item.serialNumbers.map((s) => s.trim()).filter(Boolean) }
            : {}),
          ...(item.costPrice.trim() !== '' ? { costPrice: Number(item.costPrice) } : {}),
          ...(item.salePrice.trim() !== '' ? { salePrice: Number(item.salePrice) } : {}),
        })),
        notes: notes.trim() ? notes.trim() : undefined,
      };

      const res = await inboundInventory(payload);
      setResponse(res);
      setBatchItems([]);
      setNotes('');
      setCurrentItem(newDraftBatchItem());
      resetNewModelForm();
    } catch (e) {
      setError(asAppError(e).message);
    } finally {
      setSubmitting(false);
    }
  };

  const clearResponse = () => setResponse(null);

  return {
    inboundMode,
    setInboundMode,
    categories,
    batchItems,
    currentItem,
    newBrand,
    setNewBrand,
    newModel,
    setNewModel,
    newCategoryId,
    setNewCategoryId,
    newSku,
    setNewSku,
    newBasePrice,
    setNewBasePrice,
    newMinStockThreshold,
    setNewMinStockThreshold,
    newRequiresSerials,
    setNewRequiresSerialsWithSerials,
    newQuantity,
    setNewQuantityWithSerials,
    newCostPrice,
    setNewCostPrice,
    newSerials,
    updateNewSerialNumber,
    newProcessor,
    setNewProcessor,
    newRam,
    setNewRam,
    newStorage,
    setNewStorage,
    newGpu,
    setNewGpu,
    newScreenSize,
    setNewScreenSize,
    notes,
    setNotes,
    submitting,
    validatingSerials,
    error,
    fieldErrors,
    response,
    selectCatalogProduct,
    setQuantity,
    setHasSerialNumbers,
    updateSerialNumber,
    updateCostPrice,
    updateSalePrice,
    addItemToBatch,
    removeItemFromBatch,
    submitBatch,
    clearResponse,
  };
}
