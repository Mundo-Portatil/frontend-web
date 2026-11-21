import {
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
} from '../../../utils/formStyles';
import { CatalogProductPicker } from '../components/CatalogProductPicker';
import { useBarcodeLabels } from '../hooks/useBarcodeLabels';

export function InventoryLabelsPage() {
  const {
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
  } = useBarcodeLabels();

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-slate-900">Centro de Etiquetas 1D (Códigos de Barras)</h2>
        <p className="mt-1 text-sm text-slate-500">
          Genere e imprima etiquetas térmicas con código de barras Code 128 por modelo o por números de serie registrados.
        </p>
      </header>

      {/* Mode selection tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setMode('model')}
          className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-colors ${
            mode === 'model'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Modo 1: Por Modelo / Cantidad (Cód. Etiqueta)
        </button>
        <button
          type="button"
          onClick={() => setMode('serials')}
          className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-colors ${
            mode === 'serials'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Modo 2: Por Series Registradas
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Modo 1: Por Modelo / Cantidad */}
      {mode === 'model' && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-base font-semibold text-slate-900">
            Configuración de Etiquetas por Modelo
          </h3>
          <div>
            <label className={LABEL_CLASS}>Seleccionar Producto del Catálogo</label>
            <CatalogProductPicker
              id="label-product-picker"
              serialized={false}
              onSelect={setSelectedProduct}
              onChange={() => {}}
              label="Buscar modelo o código de etiqueta…"
            />
          </div>

          <div className="max-w-xs">
            <label htmlFor="label-copies" className={LABEL_CLASS}>
              Cantidad de copias a generar <span className="text-red-500">*</span>
            </label>
            <input
              id="label-copies"
              type="number"
              min={1}
              step={1}
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
              disabled={loading}
              className={TEXT_INPUT_CLASS}
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={loading || !selectedProduct}
              onClick={() => void generateByModel()}
              className={PRIMARY_BUTTON_CLASS}
            >
              {loading ? 'Generando etiquetas…' : 'Generar Etiquetas por Modelo'}
            </button>
          </div>
        </section>
      )}

      {/* Modo 2: Por Series Registradas */}
      {mode === 'serials' && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-base font-semibold text-slate-900">
            Configuración de Etiquetas por Series Registradas
          </h3>
          <p className="text-xs text-slate-500">
            Seleccione un modelo con serie individual para listar y seleccionar los equipos activos en stock.
          </p>

          <div>
            <label className={LABEL_CLASS}>Seleccionar Modelo Serializado</label>
            <CatalogProductPicker
              id="label-serialized-picker"
              serialized={true}
              onSelect={(item) => {
                setSelectedSerializedProduct(item);
              }}
              onChange={() => {}}
              label="Buscar modelo con número de serie…"
            />
          </div>

          {selectedSerializedProduct && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Equipos en Stock ({availableSerials.length})
                  </h4>
                  {availableSerials.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleSelectAllSerials}
                      className="text-xs font-medium text-brand-600 hover:text-brand-800"
                    >
                      {selectedSerialIds.length === availableSerials.length
                        ? 'Deseleccionar todas'
                        : 'Seleccionar todas'}
                    </button>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  {selectedSerialIds.length} seleccionadas para imprimir
                </span>
              </div>

              {loadingSerials ? (
                <p className="text-center text-xs text-slate-400 py-3">Cargando series en stock…</p>
              ) : availableSerials.length === 0 ? (
                <p className="text-center text-xs italic text-slate-400 py-3">
                  No hay equipos en estado EN_STOCK para este modelo en ningún almacén.
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-200 pr-1">
                  {availableSerials.map((item) => {
                    const isChecked = selectedSerialIds.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className="flex items-center justify-between py-2 text-xs hover:bg-slate-100/70 px-2 rounded cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectSerial(item.id)}
                            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                          <span className="font-mono font-semibold text-slate-900">
                            {item.serialNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                          {item.locationName && <span>{item.locationName}</span>}
                          {item.salePrice !== null && (
                            <span className="font-semibold text-slate-900">
                              S/ {item.salePrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Fallback textarea for UUIDs */}
          <details className="rounded-lg border border-slate-200 p-3 text-xs">
            <summary className="cursor-pointer font-medium text-slate-700">
              Ingreso manual alternativo por lista de UUIDs
            </summary>
            <div className="mt-3 space-y-2">
              <label htmlFor="raw-serials-input" className={LABEL_CLASS}>
                Identificadores de equipos (UUID)
              </label>
              <textarea
                id="raw-serials-input"
                rows={3}
                value={rawSerialsInput}
                onChange={(e) => setRawSerialsInput(e.target.value)}
                disabled={loading}
                className={`${TEXT_INPUT_CLASS} resize-none font-mono text-xs`}
                placeholder="550e8400-e29b-41d4-a716-446655440000…"
              />
              <button
                type="button"
                disabled={loading || !rawSerialsInput.trim()}
                onClick={() => void generateBySerials()}
                className={`${SECONDARY_BUTTON_CLASS} text-xs`}
              >
                Generar desde lista UUID
              </button>
            </div>
          </details>

          <div className="pt-2">
            <button
              type="button"
              disabled={loading || selectedSerialIds.length === 0}
              onClick={() => void generateByRegisteredSerials()}
              className={PRIMARY_BUTTON_CLASS}
            >
              {loading ? 'Generando etiquetas…' : 'Generar Etiquetas por Series'}
            </button>
          </div>
        </section>
      )}

      {/* Generated Labels Preview & PDF Actions */}
      {labels.length > 0 && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Vista Previa de Etiquetas ({labels.length})
              </h3>
              <p className="text-xs text-slate-500">
                Etiquetas 1D listas para imprimir en cuadrícula limpia o descargar en PDF.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={clearLabels} className={SECONDARY_BUTTON_CLASS}>
                Limpiar
              </button>
              <button type="button" onClick={downloadPdf} className={SECONDARY_BUTTON_CLASS}>
                Descargar PDF
              </button>
              <button type="button" onClick={printPdf} className={PRIMARY_BUTTON_CLASS}>
                Abrir PDF para Impresión
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {labels.map((lbl, idx) => (
              <article
                key={idx}
                className="flex flex-col justify-between rounded-lg border-2 border-dashed border-slate-300 p-4 bg-slate-50 text-slate-800"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-900 truncate">{lbl.title}</h4>
                  {lbl.specsSummary && (
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{lbl.specsSummary}</p>
                  )}
                </div>

                <div className="my-3 text-center">
                  <div className="inline-block bg-white px-3 py-1.5 rounded border border-slate-200 font-mono font-bold text-sm tracking-wider">
                    ||| | || |||| | | |||
                  </div>
                  <p className="font-mono text-xs font-semibold text-slate-800 mt-1">
                    {lbl.barcodeValue}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-2 font-medium">
                  <span className="font-semibold text-slate-900">
                    {lbl.price !== null && lbl.price !== undefined
                      ? `S/ ${Number(lbl.price).toFixed(2)}`
                      : 'S/ —'}
                  </span>
                  {lbl.totalCopies && lbl.copyNumber && (
                    <span className="text-slate-400">
                      Copia {lbl.copyNumber} / {lbl.totalCopies}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
