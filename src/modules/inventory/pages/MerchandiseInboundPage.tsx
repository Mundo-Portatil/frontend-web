import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Can } from '../../../components/guards/Can';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Notification } from '../../../components/notifications/Notification';
import { LABEL_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import { ROUTES } from '../../../router/routes';
import { CatalogForm } from '../components/CatalogForm';
import { CatalogProductPicker } from '../components/CatalogProductPicker';
import { getCatalogDisplayName } from '../catalogModels';
import { intakeModelData, useMerchandiseInbound } from '../hooks/useMerchandiseInbound';

export function MerchandiseInboundPage() {
  return <Can roles={['ADMIN', 'ENCARGADO_ALMACEN']}><MerchandiseInboundForm /></Can>;
}

function MerchandiseInboundForm() {
  const intake = useMerchandiseInbound();
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [editingNew, setEditingNew] = useState(true);
  const [formKey, setFormKey] = useState(0);
  const [serialValues, setSerialValues] = useState<string[]>([]);
  const [serialError, setSerialError] = useState<string | null>(null);
  const seriesInputs = useRef<(HTMLInputElement | null)[]>([]);
  const serialCount = Number.isSafeInteger(Number(intake.quantity)) && Number(intake.quantity) > 0 ? Number(intake.quantity) : 0;

  function changeQuantity(value: string) {
    intake.setQuantity(value);
    const count = Number(value);
    if (Number.isSafeInteger(count) && count > 0) intake.setSerialText(serialValues.slice(0, count).join('\n'));
    setSerialError(null);
  }

  function changeSerial(index: number, value: string) {
    const next = [...serialValues];
    next[index] = value;
    setSerialValues(next);
    intake.setSerialText(Array.from({ length: serialCount }, (_, i) => next[i] ?? '').join('\n'));
    setSerialError(null);
  }

  function reviewIntake() {
    if (modelData?.isSerialized !== false && serialCount > 0) {
      const seen = new Set<string>();
      for (let index = 0; index < serialCount; index += 1) {
        const serial = (serialValues[index] ?? '').trim().toUpperCase();
        if (!serial || seen.has(serial)) {
          setSerialError(!serial ? `Completa la serie de la unidad ${index + 1}.` : `La serie de la unidad ${index + 1} está repetida.`);
          seriesInputs.current[index]?.focus();
          return;
        }
        seen.add(serial);
      }
    }
    setSerialError(null);
    void intake.prepare();
  }
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const errorNotice = useRef<HTMLDivElement>(null);
  const continueButton = useRef<HTMLButtonElement>(null);
  const returningToEdit = useRef(false);
  const modelData = intake.model ? intakeModelData(intake.model) : null;

  useEffect(() => {
    if (intake.review) reviewHeading.current?.focus();
    else if (returningToEdit.current) { returningToEdit.current = false; continueButton.current?.focus(); }
  }, [intake.review]);
  useEffect(() => { if (intake.error) errorNotice.current?.focus(); }, [intake.error]);

  function changeMode(next: 'existing' | 'new') {
    intake.setModel(null);
    setSerialValues([]);
    setSerialError(null);
    setMode(next);
    setEditingNew(true);
  }
  function startAnother() {
    intake.reset();
    setSerialValues([]);
    setSerialError(null);
    setMode('existing');
    setEditingNew(true);
    setFormKey((value) => value + 1);
  }

  return (
    <section className="min-w-0 space-y-5">
      <header>
        <h2 className="text-lg font-semibold text-slate-900">Registrar mercancía</h2>
        {intake.warehouse && <p className="mt-1 text-sm text-slate-600">Destino: {intake.warehouse.name} · Almacén Central</p>}
      </header>
      {intake.loading && <LoadingState message="Preparando el ingreso…" />}
      {intake.referenceError && (
        <div className="space-y-3"><Notification kind="error">{intake.referenceError}</Notification><button type="button" className={SECONDARY_BUTTON_CLASS} onClick={intake.reloadReferences}>Reintentar configuración</button></div>
      )}
      {intake.error && <div ref={errorNotice} tabIndex={-1} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"><Notification kind="error">{intake.error}</Notification></div>}
      {intake.createdModel && !intake.result && <Notification kind="warning">El modelo {getCatalogDisplayName(intake.createdModel)} ya fue creado. Falta confirmar el ingreso de sus unidades.</Notification>}
      {intake.uncertain && <Link className={`${SECONDARY_BUTTON_CLASS} inline-flex`} to={ROUTES.inventory}>Consultar inventario</Link>}

      {intake.result ? (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <Notification kind="success">Ingreso registrado correctamente.</Notification>
          <p className="text-sm text-slate-700">{intake.result.totalUnits} unidades registradas en {intake.result.locationName}.</p>
          <ul className="space-y-3 text-sm text-slate-700">
            {intake.result.results.map((item) => (
              <li key={item.catalogId} className="min-w-0">
                <p className="break-words font-medium">{item.catalogBrand} {item.catalogModel} · {item.catalogSku}</p>
                <p>Saldo confirmado: {item.totalStockResulting} unidades.</p>
                {item.hasSerialNumbers && item.serialsCreated.length > 0 && (
                  <details open={item.serialsCreated.length <= 5}>
                    <summary className="cursor-pointer rounded text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Ver {item.serialsCreated.length} series registradas</summary>
                    <ul className="mt-2 list-inside list-disc">{item.serialsCreated.map((serial) => <li key={serial}>{serial}</li>)}</ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
          <button type="button" className={PRIMARY_BUTTON_CLASS} onClick={startAnother}>Registrar otro ingreso</button>
        </section>
      ) : (
        <>
          <div hidden={Boolean(intake.review)} className="space-y-5">
            <section className="min-w-0 space-y-4 rounded-xl border border-slate-200 bg-white p-4">
            <fieldset disabled={intake.busy || intake.loading || Boolean(intake.referenceError) || intake.uncertain || Boolean(modelData?.isSecondHand)} className="min-w-0">
              <legend className="px-1 font-medium text-slate-900">Mercancía recibida</legend>
              <div className="max-w-xs"><label htmlFor="intake-quantity" className={LABEL_CLASS}>Cantidad que ingresa</label><input id="intake-quantity" name="quantity" type="number" min="1" step="1" inputMode="numeric" value={intake.quantity} onChange={(event) => changeQuantity(event.target.value)} className={TEXT_INPUT_CLASS} required /></div>
            </fieldset>

            <fieldset disabled={intake.busy || intake.loading || Boolean(intake.referenceError) || Boolean(intake.createdModel) || intake.uncertain} className="min-w-0 border-t border-slate-100 pt-4">
              <legend className="px-1 font-medium text-slate-900">Modelo del producto</legend>
              <div className="mb-4 flex flex-wrap gap-4">
                <label className="flex min-h-10 items-center gap-2 text-sm"><input type="radio" name="intake-model-mode" checked={mode === 'existing'} onChange={() => changeMode('existing')} />Modelo existente</label>
                <label className="flex min-h-10 items-center gap-2 text-sm"><input type="radio" name="intake-model-mode" checked={mode === 'new'} onChange={() => changeMode('new')} />Modelo nuevo</label>
              </div>
              {mode === 'existing' && <CatalogProductPicker key={formKey} id="intake-model" label="Buscar modelo" onChange={() => undefined} onSelect={(item) => { intake.setModel(item ? { kind: 'existing', item } : null); setSerialValues([]); setSerialError(null); }} disabled={intake.busy || Boolean(intake.createdModel) || intake.uncertain} />}
              {mode === 'new' && (
                <>
                  <div hidden={!editingNew}>
                    <CatalogForm key={formKey} categories={intake.categories} onSaved={() => undefined} onPrepare={(input) => { intake.setModel({ kind: 'new', input }); intake.setSerialText(input.isSerialized === false ? '' : serialValues.slice(0, serialCount).join('\n')); setEditingNew(false); }} />
                  </div>
                  {!editingNew && modelData && <div className="flex flex-wrap items-center justify-between gap-3"><p className="break-words text-sm font-medium text-slate-900">{getCatalogDisplayName(modelData)}{modelData.sku ? ` · ${modelData.sku}` : ''}</p><button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => setEditingNew(true)}>Cambiar datos del modelo</button></div>}
                </>
              )}
            </fieldset>
            </section>

            {modelData?.isSecondHand && <Notification kind="warning">Las piezas usadas requieren aprobación administrativa antes de ingresar al stock.</Notification>}
            {modelData && (mode === 'existing' || !editingNew) && (
              <form onSubmit={(event) => { event.preventDefault(); reviewIntake(); }} noValidate className="rounded-xl border border-slate-200 bg-white p-4">
                <fieldset disabled={intake.busy || intake.loading || Boolean(intake.referenceError) || intake.uncertain || Boolean(modelData.isSecondHand)} className="min-w-0 space-y-4">
                  <legend className="mb-3 font-medium text-slate-900">Unidades recibidas</legend>
                  {modelData.isSerialized !== false && (
                    <fieldset className="min-w-0 space-y-3">
                      <legend className="mb-2 font-medium text-slate-900">Series de las unidades</legend>
                      {serialError && <Notification kind="error">{serialError}</Notification>}
                      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: serialCount }, (_, index) => (
                          <div key={index} className="min-w-0">
                            <label htmlFor={`intake-serial-${index}`} className={LABEL_CLASS}>Unidad {index + 1}: serie</label>
                            <input id={`intake-serial-${index}`} ref={(node) => { seriesInputs.current[index] = node; }} value={serialValues[index] ?? ''} onChange={(event) => changeSerial(index, event.target.value)} onKeyDown={(event) => {
                              if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
                              event.preventDefault();
                              (seriesInputs.current[index + 1] ?? continueButton.current)?.focus();
                            }} className={TEXT_INPUT_CLASS} autoComplete="off" spellCheck={false} required />
                          </div>
                        ))}
                      </div>
                    </fieldset>
                  )}
                  <details className="rounded-lg border border-slate-200 p-3">
                    <summary className="w-fit cursor-pointer rounded text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Precios por unidad (opcional)</summary>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div><label htmlFor="intake-cost" className={LABEL_CLASS}>Costo unitario</label><input id="intake-cost" name="costPrice" type="number" min="0" step="any" inputMode="decimal" value={intake.costPrice} onChange={(event) => intake.setCostPrice(event.target.value)} className={TEXT_INPUT_CLASS} /></div>
                      <div><label htmlFor="intake-sale" className={LABEL_CLASS}>Precio de venta por unidad</label><input id="intake-sale" name="salePrice" type="number" min="0" step="any" inputMode="decimal" value={intake.salePrice} onChange={(event) => intake.setSalePrice(event.target.value)} className={TEXT_INPUT_CLASS} /></div>
                    </div>
                  </details>
                  <button ref={continueButton} className={PRIMARY_BUTTON_CLASS}>{intake.busy ? 'Validando…' : 'Revisar ingreso'}</button>
                </fieldset>
              </form>
            )}
          </div>

          {intake.review && (
            <section aria-labelledby="merchandise-review" aria-busy={intake.busy} className="space-y-4 rounded-xl border border-brand-200 bg-white p-4">
              <h3 ref={reviewHeading} id="merchandise-review" tabIndex={-1} className="rounded text-lg font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Confirmar ingreso</h3>
              <dl className="grid min-w-0 gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Modelo</dt><dd className="break-words font-medium">{getCatalogDisplayName(intakeModelData(intake.review.model))}{intakeModelData(intake.review.model).sku ? ` · ${intakeModelData(intake.review.model).sku}` : ''}</dd></div>
                <div><dt className="text-slate-500">Marca y modelo</dt><dd className="break-words font-medium">{intakeModelData(intake.review.model).brand} · {intakeModelData(intake.review.model).model}</dd></div>
                <div><dt className="text-slate-500">Categoría</dt><dd className="font-medium">{intake.categories.find((category) => category.id === intakeModelData(intake.review!.model).categoryId)?.name ?? 'Categoría del modelo'}</dd></div>
                <div><dt className="text-slate-500">Precio base</dt><dd className="font-medium">{intakeModelData(intake.review.model).basePrice}</dd></div>
                <div><dt className="text-slate-500">Destino</dt><dd className="font-medium">{intake.review.warehouse.name} · Almacén Central</dd></div>
                <div><dt className="text-slate-500">Cantidad que ingresa</dt><dd className="font-medium">{intake.review.quantity}</dd></div>
                <div><dt className="text-slate-500">Control</dt><dd className="font-medium">{intakeModelData(intake.review.model).isSerialized === false ? 'Por cantidad' : 'Una serie por unidad'}</dd></div>
                {intake.review.costPrice !== undefined && <div><dt className="text-slate-500">Costo unitario</dt><dd>{intake.review.costPrice}</dd></div>}
                {intake.review.salePrice !== undefined && <div><dt className="text-slate-500">Precio de venta por unidad</dt><dd>{intake.review.salePrice}</dd></div>}
              </dl>
              {intake.review.serials.length > 0 && <ul className="divide-y divide-slate-100 text-sm">{intake.review.serials.map((serial) => <li key={serial} className="break-words py-2"><span className="font-medium">{serial}</span></li>)}</ul>}
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={intake.busy || intake.uncertain} className={PRIMARY_BUTTON_CLASS} onClick={() => void intake.confirm()}>{intake.busy ? 'Guardando…' : 'Confirmar ingreso'}</button>
                <button type="button" disabled={intake.busy || intake.uncertain} className={SECONDARY_BUTTON_CLASS} onClick={() => { returningToEdit.current = true; intake.editReview(); }}>Volver a editar</button>
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
