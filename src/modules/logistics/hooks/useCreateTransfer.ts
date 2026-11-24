import { useRef, useState } from 'react';
import { getAccessToken } from '../../../config/authToken';
import { useAuthStore } from '../../../stores/authStore';
import { asAppError } from '../../../services/api/errors';
import type { Location } from '../../foundation/locations/models';
import type { TransferDraft } from '../draftModels';
import type { TransferDetail } from '../models';
import { canCreateTransfer } from '../permissions';
import { createDirectTransfer } from '../services/transferService';
import { draftToInput, mapTransferDetail } from '../services/transferMapper';
import { matchesTransferResponse } from '../validation';
export function useCreateTransfer() {
  const [phase, setPhase] = useState<'editing' | 'submitting' | 'completed' | 'rejected' | 'unknown'>('editing');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<TransferDetail | null>(null);
  const locked = useRef(false);
  const session = useRef({ token: getAccessToken(), id: useAuthStore.getState().user?.id });
  async function submit(draft: TransferDraft, locations: Location[]) {
    if (locked.current) return;
    const auth = useAuthStore.getState();
    if (auth.status !== 'authenticated' || !auth.user?.active || !canCreateTransfer(auth.user.role) || auth.user.id !== session.current.id || getAccessToken() !== session.current.token || !session.current.token) {
      setError('La sesión cambió. Vuelve a abrir el formulario.'); return;
    }
    let input;
    try { input = draftToInput(draft, locations); } catch (cause) { setError((cause as Error).message); return; }
    locked.current = true; setPhase('submitting'); setError('');
    try {
      const result = await createDirectTransfer(input);
      if (getAccessToken() !== session.current.token || useAuthStore.getState().user?.id !== session.current.id) { setPhase('unknown'); return; }
      if (!matchesTransferResponse(result, input)) { setPhase('unknown'); return; }
      setReceipt(mapTransferDetail(result)); setPhase('completed');
    } catch (cause) {
      const failure = asAppError(cause);
      if (failure.status !== undefined && failure.status >= 400 && failure.status < 500) {
        locked.current = false; setPhase('rejected'); setError(failure.message);
      } else { setPhase('unknown'); }
    }
  }
  function reset() {
    if (phase !== 'completed') return;
    locked.current = false; setReceipt(null); setError(''); setPhase('editing');
    session.current = { token: getAccessToken(), id: useAuthStore.getState().user?.id };
  }
  return { phase, error, receipt, submit, reset };
}
