import {
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
} from '../../../utils/formStyles';
import { CatalogProductPicker } from '../components/CatalogProductPicker';
import { PostInboundPrintModal } from '../components/PostInboundPrintModal';
import { SerialNumbersInputGrid } from '../components/SerialNumbersInputGrid';
import { useUnifiedInbound } from '../hooks/useUnifiedInbound';

export function InventoryInboundPage() {
  const {
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
    updateSerialNumber,
    updateCostPrice,
    updateSalePrice,
    addItemToBatch,
    removeItemFromBatch,
    submitBatch,
    clearResponse,
  } = useUnifiedInbound();

  const totalUnits = batchItems.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ingreso de Mercadería al Almacén</h2>
          <p className="mt-1 text-sm text-slate-500">
            Registre ingresos de modelos existentes o cree nuevos modelos con series o por cantidad directamente al Almacén Central.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
          <span>Destino: Almacén Central</span>
        </div>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {fieldErrors.length > 0 && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 space-y-1">
          {fieldErrors.map((err, i) => (
            <p key={i}>• {err}</p>
          ))}
        </div>
      )}

      {/* 1. AGREGAR PRODUCTO AL LOTE */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-base font-semibold text-slate-900">
            1. Agregar Producto al Lote
          </h3>
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setInboundMode('existing')}
              className={`py-1 px-3 rounded-md text-xs font-semibold transition-colors ${
                inboundMode === 'existing'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Producto existente
            </button>
            <button
              type="button"
              onClick={() => setInboundMode('new')}
              className={`py-1 px-3 rounded-md text-xs font-semibold transition-colors ${
                inboundMode === 'new'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nuevo modelo
            </button>
          </div>
        </div>

        {/* MODO 1: PRODUCTO EXISTENTE */}
        {inboundMode === 'existing' && (
          <div className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>
                Modelo o Producto <span className="text-red-500">*</span>
              </label>
              <CatalogProductPicker
                id="inbound-product-picker"
                onSelect={selectCatalogProduct}
                onChange={() => {}}
                label="Buscar por marca, modelo o código de etiqueta…"
              />
            </div>

            {currentItem.catalog && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">
                  {currentItem.catalog.brand} {currentItem.catalog.model}
                </span>{' '}
                — Cód. Etiqueta: <span className="font-mono">{currentItem.catalog.sku}</span> | Precio ref: S/{' '}
                {currentItem.catalog.basePrice}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="inbound-qty" className={LABEL_CLASS}>
                  Cantidad a Ingresar <span className="text-red-500">*</span>
                </label>
                <input
                  id="inbound-qty"
                  type="number"
                  min={1}
                  step={1}
                  value={currentItem.quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                  disabled={submitting || validatingSerials}
                  className={TEXT_INPUT_CLASS}
                  required
                />
              </div>

              <div>
                <label htmlFor="inbound-cost" className={LABEL_CLASS}>
                  Costo Unitario (S/ - opcional)
                </label>
                <input
                  id="inbound-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentItem.costPrice}
                  onChange={(e) => updateCostPrice(e.target.value)}
                  disabled={submitting || validatingSerials}
                  placeholder="0.00"
                  className={TEXT_INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="inbound-price" className={LABEL_CLASS}>
                  Precio de Venta (S/ - opcional)
                </label>
                <input
                  id="inbound-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentItem.salePrice}
                  onChange={(e) => updateSalePrice(e.target.value)}
                  disabled={submitting || validatingSerials}
                  placeholder="0.00"
                  className={TEXT_INPUT_CLASS}
                />
              </div>
            </div>

            {/* Series inmediatas si el producto seleccionado es serializado */}
            {currentItem.catalog?.isSerialized && (
              <SerialNumbersInputGrid
                quantity={currentItem.quantity}
                serialNumbers={currentItem.serialNumbers}
                onChange={updateSerialNumber}
                disabled={submitting || validatingSerials}
              />
            )}
          </div>
        )}

        {/* MODO 2: NUEVO MODELO */}
        {inboundMode === 'new' && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="new-brand" className={LABEL_CLASS}>
                  Marca <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-brand"
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  disabled={submitting || validatingSerials}
                  placeholder="Ej. ASUS, HP, Kingston…"
                  className={TEXT_INPUT_CLASS}
                  required
                />
              </div>

              <div>
                <label htmlFor="new-model" className={LABEL_CLASS}>
                  Modelo <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-model"
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  disabled={submitting || validatingSerials}
                  placeholder="Ej. VivoBook 15, Fury 16GB…"
                  className={TEXT_INPUT_CLASS}
                  required
                />
              </div>

              <div>
                <label htmlFor="new-category" className={LABEL_CLASS}>
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  id="new-category"
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  disabled={submitting || validatingSerials}
                  className={TEXT_INPUT_CLASS}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="new-sku" className={LABEL_CLASS}>
                  Código de Etiqueta (opcional)
                </label>
                <input
                  id="new-sku"
                  type="text"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  disabled={submitting || validatingSerials}
                  placeholder="Vacío para generar ej. LAP-8F3A2C"
                  className={TEXT_INPUT_CLASS}
                />
                <p className="mt-1 text-[0.6875rem] text-slate-500">
                  Dejar vacío para generar automáticamente según la categoría.
                </p>
              </div>

              <div>
                <label htmlFor="new-price" className={LABEL_CLASS}>
                  Precio Base / Venta (S/) <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newBasePrice}
                  onChange={(e) => setNewBasePrice(e.target.value)}
                  disabled={submitting || validatingSerials}
                  placeholder="0.00"
                  className={TEXT_INPUT_CLASS}
                  required
                />
              </div>

              <div>
                <label htmlFor="new-threshold" className={LABEL_CLASS}>
                  Umbral Stock Mínimo
                </label>
                <input
                  id="new-threshold"
                  type="number"
                  min="0"
                  step="1"
                  value={newMinStockThreshold}
                  onChange={(e) => setNewMinStockThreshold(e.target.value)}
                  disabled={submitting || validatingSerials}
                  className={TEXT_INPUT_CLASS}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="new-qty" className={LABEL_CLASS}>
                  Cantidad a Ingresar <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-qty"
                  type="number"
                  min="1"
                  step="1"
                  value={newQuantity}
                  onChange={(e) => setNewQuantityWithSerials(parseInt(e.target.value, 10) || 1)}
                  disabled={submitting || validatingSerials}
                  className={TEXT_INPUT_CLASS}
                  required
                />
              </div>

              <div>
                <label htmlFor="new-cost" className={LABEL_CLASS}>
                  Costo Unitario (S/ - opcional)
                </label>
                <input
                  id="new-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newCostPrice}
                  onChange={(e) => setNewCostPrice(e.target.value)}
                  disabled={submitting || validatingSerials}
                  placeholder="0.00"
                  className={TEXT_INPUT_CLASS}
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={newRequiresSerials}
                  onChange={(e) => setNewRequiresSerialsWithSerials(e.target.checked)}
                  disabled={submitting || validatingSerials}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-semibold text-slate-800">
                  Requiere número de serie individual
                </span>
              </label>
            </div>

            <details className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <summary className="font-semibold text-slate-700 cursor-pointer">
                Especificaciones Técnicas (opcional)
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="new-proc" className={LABEL_CLASS}>Procesador</label>
                  <input
                    id="new-proc"
                    type="text"
                    value={newProcessor}
                    onChange={(e) => setNewProcessor(e.target.value)}
                    placeholder="Ej. Intel Core i7 12700H"
                    className={TEXT_INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="new-ram" className={LABEL_CLASS}>Memoria RAM</label>
                  <input
                    id="new-ram"
                    type="text"
                    value={newRam}
                    onChange={(e) => setNewRam(e.target.value)}
                    placeholder="Ej. 16GB DDR4 3200MHz"
                    className={TEXT_INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="new-storage" className={LABEL_CLASS}>Almacenamiento</label>
                  <input
                    id="new-storage"
                    type="text"
                    value={newStorage}
                    onChange={(e) => setNewStorage(e.target.value)}
                    placeholder="Ej. 512GB NVMe SSD"
                    className={TEXT_INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="new-gpu" className={LABEL_CLASS}>Tarjeta de video (GPU)</label>
                  <input
                    id="new-gpu"
                    type="text"
                    value={newGpu}
                    onChange={(e) => setNewGpu(e.target.value)}
                    placeholder="Ej. NVIDIA RTX 3050 4GB"
                    className={TEXT_INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="new-screen" className={LABEL_CLASS}>Tamaño de pantalla</label>
                  <input
                    id="new-screen"
                    type="text"
                    value={newScreenSize}
                    onChange={(e) => setNewScreenSize(e.target.value)}
                    placeholder="Ej. 15.6 FHD 144Hz"
                    className={TEXT_INPUT_CLASS}
                  />
                </div>
              </div>
            </details>

            {/* Series inmediatas si el nuevo modelo es serializado */}
            {newRequiresSerials && (
              <SerialNumbersInputGrid
                quantity={newQuantity}
                serialNumbers={newSerials}
                onChange={updateNewSerialNumber}
                disabled={submitting || validatingSerials}
              />
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={submitting || validatingSerials}
            onClick={() => void addItemToBatch()}
            className={PRIMARY_BUTTON_CLASS}
          >
            {validatingSerials ? 'Validando series…' : '+ Agregar al Lote'}
          </button>
        </div>
      </section>

      {/* 2. RESUMEN DEL LOTE */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <h3 className="text-base font-semibold text-slate-900">
            2. Resumen del Lote a Registrar ({batchItems.length} modelos | {totalUnits} unidades)
          </h3>
          {batchItems.length > 0 && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              Listo para confirmar ingreso
            </span>
          )}
        </div>

        {batchItems.length === 0 ? (
          <p className="text-center text-sm italic text-slate-400 py-6">
            Aún no has agregado productos a este lote. Utiliza el formulario superior para añadir modelos existentes o nuevos.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-3 py-2">PRODUCTO / MODELO</th>
                  <th className="px-3 py-2">CÓD. ETIQUETA</th>
                  <th className="px-3 py-2 text-center">CANTIDAD</th>
                  <th className="px-3 py-2">TIPO</th>
                  <th className="px-3 py-2 text-right">COSTO / VENTA</th>
                  <th className="px-3 py-2 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batchItems.map((item) => (
                  <tr key={item.draftId} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-900 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{item.catalog?.brand} {item.catalog?.model}</span>
                        {item.isNewModel ? (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[0.625rem] font-bold text-indigo-700">
                            Nuevo modelo
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.625rem] font-medium text-slate-600">
                            Existente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-600">{item.catalog?.sku}</td>
                    <td className="px-3 py-2 text-center font-bold text-slate-900">{item.quantity} uds.</td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {item.hasSerialNumbers
                        ? `Con series (${item.serialNumbers.filter(Boolean).length})`
                        : 'Por cantidad'}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-slate-600">
                      {item.costPrice ? `Costo: S/ ${Number(item.costPrice).toFixed(2)}` : 'Sin costo'}
                      {item.salePrice ? ` | Venta: S/ ${Number(item.salePrice).toFixed(2)}` : ''}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeItemFromBatch(item.draftId)}
                        disabled={submitting}
                        className={`${SECONDARY_BUTTON_CLASS} text-xs py-1 px-2.5 min-h-0 text-red-600 hover:text-red-700`}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div>
          <label htmlFor="inbound-notes" className={LABEL_CLASS}>
            Observaciones del lote (opcional)
          </label>
          <input
            id="inbound-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
            placeholder="Ej: Factura Proveedor F001-2045, importación lote noviembre…"
            className={TEXT_INPUT_CLASS}
          />
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={batchItems.length === 0 || submitting}
            onClick={() => void submitBatch()}
            className={`${PRIMARY_BUTTON_CLASS} bg-emerald-600 hover:bg-emerald-700 text-base py-2.5 px-6`}
          >
            {submitting ? 'Confirmando ingreso…' : 'Confirmar Ingreso al Almacén'}
          </button>
        </div>
      </section>

      {/* Post Inbound Print Modal */}
      {response && <PostInboundPrintModal response={response} onClose={clearResponse} />}
    </div>
  );
}
