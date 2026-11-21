import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { getAccessToken } from '../../../config/authToken';
import { asAppError } from '../../../services/api/errors';
import { listActiveLocations } from '../../foundation/locations/services/locationService';
import type { Location } from '../../foundation/locations/models';
import { listCategories } from '../services/categoryService';
import { createCatalogItem } from '../services/catalogService';
import { validateSerials } from '../services/hardwareItemService';
import { receiveInventory } from '../services/inventoryInboundService';
import type { CatalogItem, CreateCatalogInput } from '../catalogModels';
import type { Category } from '../models';
import type { UnifiedInboundResult } from '../unifiedInboundModels';

export type IntakeModel = { kind: 'existing'; item: CatalogItem } | { kind: 'new'; input: CreateCatalogInput };
export interface IntakeReview {
  model: IntakeModel;
  warehouse: Location;
  quantity: number;
  serials: string[];
  costPrice?: number;
  salePrice?: number;
}
export type IntakeResult = UnifiedInboundResult;

function canReceive() {
  return ['ADMIN', 'ENCARGADO_ALMACEN'].includes(useAuthStore.getState().user?.role ?? '');
}

export function resolveCentralWarehouse(locations: Location[]): Location {
  const warehouses = locations.filter((location) => location.active && location.type === 'ALMACEN_CENTRAL');
  if (!warehouses.length) throw new Error('No hay un Almacén Central activo. Solicita su configuración antes de ingresar mercancía.');
  if (warehouses.length > 1) throw new Error('Hay varios almacenes centrales activos. Debe definirse uno principal antes de ingresar mercancía.');
  return warehouses[0];
}

export function intakeModelData(model: IntakeModel) {
  return model.kind === 'existing' ? model.item : model.input;
}

function optionalPrice(value: string, name: string): number | undefined {
  if (!value.trim()) return undefined;
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) throw new Error(`${name} debe ser un número igual o mayor que cero.`);
  return price;
}

export function useMerchandiseInbound() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouse, setWarehouse] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [model, setModelState] = useState<IntakeModel | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [serialText, setSerialText] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<IntakeReview | null>(null);
  const [createdModel, setCreatedModel] = useState<CatalogItem | null>(null);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const operationPending = useRef(false);
  const createdModelRef = useRef<CatalogItem | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setReferenceError(null);
    setWarehouse(null);
    void Promise.all([listActiveLocations(), listCategories({ active: true })])
      .then(([locations, groups]) => {
        if (!current) return;
        setCategories(groups);
        setWarehouse(resolveCentralWarehouse(locations));
      })
      .catch((failure: unknown) => {
        if (current) setReferenceError(failure instanceof Error ? failure.message : asAppError(failure).message);
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [revision]);

  function setModel(next: IntakeModel | null) {
    if (operationPending.current || createdModelRef.current || uncertain) return;
    const sameNewDraft = next?.kind === 'new' && model?.kind === 'new'
      && (next.input.isSerialized !== false) === (model.input.isSerialized !== false);
    setModelState(next);
    if (!sameNewDraft) setSerialText('');
    setReview(null);
    setError(null);
  }

  async function prepare() {
    if (operationPending.current || uncertain || result || !canReceive()) return;
    operationPending.current = true;
    setError(null);
    const token = getAccessToken();
    const accountId = useAuthStore.getState().user?.id;
    setBusy(true);
    try {
      if (!warehouse || loading || referenceError) throw new Error('Es necesario un único Almacén Central activo.');
      if (!model) throw new Error('Selecciona un modelo existente o completa los datos de uno nuevo.');
      const product = intakeModelData(model);
      if (product.isSecondHand) throw new Error('Las piezas usadas requieren aprobación administrativa. Este ingreso no las incorpora al stock.');
      if (model.kind === 'existing' && !model.item.active) throw new Error('Selecciona un modelo activo.');
      const count = Number(quantity);
      if (!quantity.trim() || !Number.isSafeInteger(count) || count < 1) throw new Error('Indica una cantidad entera mayor que cero.');
      const serials = product.isSerialized === false ? [] : serialText.split(/[\r\n,]+/).map((value) => value.trim().toUpperCase()).filter(Boolean);
      if (product.isSerialized !== false && serials.length !== count) throw new Error('Ingresa una serie por cada unidad recibida.');
      if (new Set(serials).size !== serials.length) throw new Error('Hay números de serie repetidos en este ingreso.');
      const cost = optionalPrice(costPrice, 'El costo');
      const sale = optionalPrice(salePrice, 'El precio');
      if (serials.length) {
        const validation = await validateSerials(serials);
        if (!validation.allValid) throw new Error(`Series ya registradas: ${validation.existingSerials.join(', ')}`);
      }
      if (!mounted.current || getAccessToken() !== token || useAuthStore.getState().user?.id !== accountId || !canReceive()) return;
      setReview({ model, warehouse, quantity: count, serials, ...(cost === undefined ? {} : { costPrice: cost }), ...(sale === undefined ? {} : { salePrice: sale }) });
    } catch (failure) {
      if (mounted.current && getAccessToken() === token && useAuthStore.getState().user?.id === accountId) setError(failure instanceof Error ? failure.message : asAppError(failure).message);
    } finally {
      operationPending.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function confirm() {
    if (!review || operationPending.current || uncertain || result || !canReceive()) return;
    operationPending.current = true;
    setBusy(true);
    setError(null);
    const token = getAccessToken();
    const accountId = useAuthStore.getState().user?.id;
    const currentSession = () => mounted.current && getAccessToken() === token && useAuthStore.getState().user?.id === accountId && canReceive();
    let writeStarted = false;
    try {
      let product: CatalogItem;
      if (review.model.kind === 'existing') product = review.model.item;
      else if (createdModelRef.current) product = createdModelRef.current;
      else {
        writeStarted = true;
        product = await createCatalogItem({ ...review.model.input, active: true, isSecondHand: false });
        if (!currentSession()) return;
        createdModelRef.current = product;
        setCreatedModel(product);
      }
      if (!currentSession()) return;
      const prices = { ...(review.costPrice === undefined ? {} : { costPrice: review.costPrice }), ...(review.salePrice === undefined ? {} : { salePrice: review.salePrice }) };
      writeStarted = true;
      const saved = await receiveInventory({ items: [{
        catalogId: product.id,
        quantity: review.quantity,
        hasSerialNumbers: product.isSerialized,
        ...(product.isSerialized ? { serialNumbers: review.serials } : {}),
        ...prices,
      }] });
      if (!currentSession()) return;
      setResult(saved);
      setReview(null);
    } catch (failure) {
      if (!currentSession()) return;
      const appError = asAppError(failure);
      if (writeStarted && (appError.kind === 'network' || appError.kind === 'server' || appError.status === undefined && appError.kind === 'unknown')) {
        setUncertain(true);
        setError('No pudimos confirmar el resultado. Revisa el inventario antes de realizar otro ingreso; no se reenviará esta operación.');
      } else {
        setError(appError.message);
      }
    } finally {
      operationPending.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function editReview() {
    if (!operationPending.current && !uncertain) { setReview(null); setError(null); }
  }
  function reset() {
    if (operationPending.current || uncertain) return;
    createdModelRef.current = null;
    setCreatedModel(null); setModelState(null); setQuantity('1'); setSerialText('');
    setCostPrice(''); setSalePrice(''); setError(null); setReview(null); setResult(null);
  }

  return { categories, warehouse, loading, referenceError, reloadReferences: () => setRevision((value) => value + 1), model, setModel, quantity, setQuantity, serialText, setSerialText, costPrice, setCostPrice, salePrice, setSalePrice, busy, error, review, prepare, confirm, editReview, createdModel, result, uncertain, reset };
}
