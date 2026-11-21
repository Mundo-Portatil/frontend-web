import { useEffect, useState } from 'react';
import { asAppError } from '../../../services/api/errors';
import { downloadLabelsPdf, openLabelsPdf } from '../../../services/printer/labelPdfService';
import type { CatalogItem } from '../catalogModels';
import type { BarcodeLabelItem, HardwareItem } from '../hardwareModels';
import { isUuidV4 } from '../hardwareValidation';
import { getBatchLabels } from '../services/barcodeLabelService';
import { listHardwareItems } from '../services/hardwareItemService';
import { getBarcodeLabelsByModel } from '../services/inventoryService';

export function useBarcodeLabels() {
  const [mode, setMode] = useState<'model' | 'serials'>('model');

  // Mode 1: By Model (Copies)
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null);
  const [copies, setCopies] = useState<number>(1);

  // Mode 2: By Registered Serials
  const [selectedSerializedProduct, setSelectedSerializedProduct] = useState<CatalogItem | null>(null);
  const [availableSerials, setAvailableSerials] = useState<HardwareItem[]>([]);
  const [loadingSerials, setLoadingSerials] = useState<boolean>(false);
  const [selectedSerialIds, setSelectedSerialIds] = useState<string[]>([]);
  const [rawSerialsInput, setRawSerialsInput] = useState<string>('');

  // Generated state
  const [labels, setLabels] = useState<BarcodeLabelItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // When a serialized product is selected in Mode 2, fetch its available serials
  useEffect(() => {
    let active = true;
    if (!selectedSerializedProduct) {
      setAvailableSerials([]);
      setSelectedSerialIds([]);
      return;
    }

    setLoadingSerials(true);
    void listHardwareItems({
      catalogItemId: selectedSerializedProduct.id,
      status: 'EN_STOCK',
      limit: 100,
    })
      .then((items) => {
        if (active) {
          setAvailableSerials(items);
          setSelectedSerialIds(items.map((i) => i.id)); // select all by default
        }
      })
      .catch((e) => {
        if (active) setError(asAppError(e).message);
      })
      .finally(() => {
        if (active) setLoadingSerials(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSerializedProduct]);

  const generateByModel = async () => {
    if (!selectedProduct) {
      setError('Selecciona un producto para generar etiquetas.');
      return;
    }
    if (copies <= 0) {
      setError('La cantidad de copias debe ser al menos 1.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // NOTE: No locationId sent per user specification
      const result = await getBarcodeLabelsByModel({
        catalogId: selectedProduct.id,
        copies,
      });
      setLabels(result);
    } catch (e) {
      setError(asAppError(e).message);
    } finally {
      setLoading(false);
    }
  };

  const generateByRegisteredSerials = async () => {
    if (selectedSerialIds.length === 0) {
      setError('Selecciona al menos un equipo en stock para generar etiquetas.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getBatchLabels(selectedSerialIds);
      setLabels(result);
    } catch (e) {
      setError(asAppError(e).message);
    } finally {
      setLoading(false);
    }
  };

  const generateBySerials = async () => {
    const ids = [...new Set(rawSerialsInput.split(/[\s,]+/).filter(Boolean))];
    if (ids.length === 0) {
      setError('Ingresa al menos un identificador UUID de equipo.');
      return;
    }

    const invalid = ids.filter((id) => !isUuidV4(id));
    if (invalid.length > 0) {
      setError(`Se requieren IDs válidos (UUID v4). Inválidos: ${invalid.slice(0, 3).join(', ')}`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getBatchLabels(ids);
      setLabels(result);
    } catch (e) {
      setError(asAppError(e).message);
    } finally {
      setLoading(false);
    }
  };

  const printPdf = () => {
    if (labels.length === 0) return;
    openLabelsPdf(labels);
  };

  const downloadPdf = () => {
    if (labels.length === 0) return;
    downloadLabelsPdf(labels);
  };

  const clearLabels = () => {
    setLabels([]);
    setError(null);
  };

  const toggleSelectAllSerials = () => {
    if (selectedSerialIds.length === availableSerials.length) {
      setSelectedSerialIds([]);
    } else {
      setSelectedSerialIds(availableSerials.map((s) => s.id));
    }
  };

  const toggleSelectSerial = (id: string) => {
    setSelectedSerialIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return {
    mode,
    setMode,
    selectedProduct,
    setSelectedProduct,
    copies,
    setCopies,
    selectedSerializedProduct,
    setSelectedSerializedProduct,
    availableSerials,
    loadingSerials,
    selectedSerialIds,
    toggleSelectAllSerials,
    toggleSelectSerial,
    rawSerialsInput,
    setRawSerialsInput,
    labels,
    loading,
    error,
    generateByModel,
    generateByRegisteredSerials,
    generateBySerials,
    printPdf,
    downloadPdf,
    clearLabels,
  };
}
