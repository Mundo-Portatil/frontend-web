import { useEffect, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Can } from '../../../components/guards/Can';
import { LABEL_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import { useAuthStore } from '../../../stores/authStore';
import { TRANSFER_EXECUTOR_ROLES } from '../permissions';
import { emptyTransferDraft, transferDraftReducer, type TransferDraft } from '../draftModels';
import { getTransferRoute, SERIAL_TRANSFER_BLOCK, validateTransferDraft } from '../validation';
import { useTransferLocations } from '../hooks/useTransferResources';
import { useCreateTransfer } from '../hooks/useCreateTransfer';
import { useRefreshTransferStock } from '../hooks/useRefreshTransferStock';
import { QuantityItemPicker, SerializedItemPicker } from '../components/TransferItemPickers';
import { TransferLinesList } from '../components/TransferLinesList';
import { TransferSummaryDialog } from '../components/TransferSummaryDialog';
import { TransferReceipt } from '../components/TransferReceipt';

function TransferCreateForm() {
  const [draft, dispatch] = useReducer(transferDraftReducer, undefined, emptyTransferDraft);
  const [reviewing, setReviewing] = useState(false);
  const [validationError, setValidationError] = useState('');
  const resources = useTransferLocations();
  const creation = useCreateTransfer();
  const stock = useRefreshTransferStock();
  const refreshLock = useRef(false);
  const user = useAuthStore(state => state.user);
  const owner = useRef(user?.id);
  const route = getTransferRoute(draft, resources.data);
  const hasLines = draft.serials.length > 0 || draft.quantities.length > 0;
  const dirty = hasLines || Boolean(draft.notes.trim());
  const busy = creation.phase === 'submitting' || stock.loading;
  const frozen = busy || creation.phase === 'unknown';
  const centers = resources.data.filter(location => location.active && location.type === 'ALMACEN_CENTRAL');
  const posts = resources.data.filter(location => location.active && location.type === 'PUESTO');
  useEffect(() => {
    if (!dirty || creation.phase === 'completed') return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, creation.phase]);
  // Session changes unmount this account's draft rather than carrying it forward.
  if (owner.current !== user?.id) return <p role="alert">La sesión cambió. Vuelve a abrir el formulario.</p>;
  function changeRoute(direction: TransferDraft['direction'], postId: string) {
    if (frozen) return;
    if (hasLines && !window.confirm('¿Cambiar la ruta y quitar los productos agregados?')) return;
    dispatch({ type: 'route', direction, postId }); setValidationError(''); setReviewing(false);
  }
  async function refreshAndReview(openReview: boolean) {
    if (!route || refreshLock.current || frozen) return;
    refreshLock.current = true;
    try {
      const values = await stock.refresh(route.from.id, draft.quantities);
      if (!values) return;
      const checked = transferDraftReducer(draft, { type: 'availability', values });
      dispatch({ type: 'availability', values });
      const error = validateTransferDraft(checked, resources.data);
      setValidationError(error || '');
      if (openReview && !error) setReviewing(true);
    } finally { refreshLock.current = false; }
  }
  async function confirm() {
    // Read availability immediately before sending; the server remains authoritative.
    if (!route || creation.phase === 'submitting') return;
    const values = await stock.refresh(route.from.id, draft.quantities);
    if (!values) return;
    const checked = transferDraftReducer(draft, { type: 'availability', values });
    dispatch({ type: 'availability', values });
    const error = validateTransferDraft(checked, resources.data, true);
    if (error) { setReviewing(false); setValidationError(error); return; }
    await creation.submit(checked, resources.data);
    setReviewing(false);
  }
  if (creation.receipt) return <TransferReceipt receipt={creation.receipt} onNew={() => { creation.reset(); dispatch({ type: 'reset' }); setValidationError(''); }} />;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-bold text-slate-900">Nuevo traslado</h1><Link className={SECONDARY_BUTTON_CLASS} to="/logistics" onClick={event => { if (dirty && !window.confirm('¿Salir sin guardar este traslado?')) event.preventDefault(); }}>Historial de traslados</Link></div>
    {creation.phase === 'unknown' && <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">No pudimos confirmar el resultado. Revisa el historial antes de volver a registrar el traslado.<Link to="/logistics" className="ml-2 font-semibold underline">Revisar historial</Link></div>}
    {resources.loading && <p role="status">Cargando ubicaciones…</p>}
    {resources.error && <p role="alert" className="text-red-700">{resources.error}</p>}
    {!resources.loading && !resources.error && centers.length !== 1 && <p role="alert" className="text-amber-800">Debe haber un único almacén central activo para registrar traslados.</p>}
    {!resources.loading && !resources.error && !posts.length && <p role="alert" className="text-amber-800">No hay puestos activos disponibles.</p>}
    <fieldset disabled={frozen || resources.loading || Boolean(resources.error) || centers.length !== 1 || !posts.length} className="space-y-5 disabled:opacity-75">
      <legend className="sr-only">Datos del traslado</legend>
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <label><span className={LABEL_CLASS}>Operación</span><select className={TEXT_INPUT_CLASS} value={draft.direction} onChange={event => changeRoute(event.target.value as TransferDraft['direction'], draft.postId)}><option value="supply">Enviar del almacén a un puesto</option><option value="return">Devolver de un puesto al almacén</option></select></label>
        <label><span className={LABEL_CLASS}>Puesto</span><select className={TEXT_INPUT_CLASS} value={draft.postId} onChange={event => changeRoute(draft.direction, event.target.value)}><option value="">Selecciona un puesto</option>{posts.map(post => <option key={post.id} value={post.id}>{post.name}</option>)}</select></label>
        {route && <p className="text-sm font-medium text-slate-700 sm:col-span-2">{route.from.name} → {route.to.name}</p>}
      </div>
      {route && <>
        <QuantityItemPicker key={route.from.id} originId={route.from.id} existing={draft.quantities} onAdd={line => dispatch({ type: 'quantity', line })} />
        <SerializedItemPicker key={`serial-${route.from.id}`} originId={route.from.id} serials={draft.serials} enabled={!reviewing && !frozen} onAdd={item => dispatch({ type: 'serial', item })} />
        <TransferLinesList draft={draft} dispatch={dispatch} />
        {draft.serials.length > 0 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{SERIAL_TRANSFER_BLOCK}</p>}
        <label className="block"><span className={LABEL_CLASS}>Notas (opcional)</span><textarea rows={2} className={`${TEXT_INPUT_CLASS} resize-none`} value={draft.notes} onChange={event => dispatch({ type: 'notes', value: event.target.value })} /></label>
        <div className="flex flex-wrap gap-2"><button type="button" className={PRIMARY_BUTTON_CLASS} disabled={!hasLines} onClick={() => { void refreshAndReview(true); }}>Revisar traslado</button><button type="button" className={SECONDARY_BUTTON_CLASS} disabled={!hasLines} onClick={() => { void refreshAndReview(false); }}>Actualizar disponibilidad</button></div>
      </>}
    </fieldset>
    {(validationError || creation.error) && <p role="alert" className="text-sm text-red-700">{validationError || creation.error}</p>}
    {reviewing && route && creation.phase !== 'unknown' && <TransferSummaryDialog draft={draft} origin={route.from.name} destination={route.to.name} busy={busy} onClose={() => setReviewing(false)} onConfirm={() => { void confirm(); }} />}
  </div>;
}
export function TransferCreatePage() {
  return <Can roles={TRANSFER_EXECUTOR_ROLES} fallback={<p role="alert">No tienes autorización para registrar traslados.</p>}><TransferCreateForm /></Can>;
}
