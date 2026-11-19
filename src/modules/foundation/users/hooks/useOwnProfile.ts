import { useState } from 'react';
import { getAccessToken } from '../../../../config/authToken';
import { asAppError } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../stores/authStore';
import type { UpdateOwnProfileInput } from '../models';
import { updateOwnProfile } from '../services/userService';

export function useOwnProfile() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  async function save(payload: UpdateOwnProfileInput) {
    const token = getAccessToken();
    const accountId = useAuthStore.getState().user?.id;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const updated = await updateOwnProfile(payload);
      if (getAccessToken() !== token || useAuthStore.getState().user?.id !== accountId) return false;
      // Preserve the server's authoritative role/state; never take them from the form.
      useAuthStore.getState().updateProfileUser({ id: updated.id, name: updated.name, email: updated.email, role: updated.role, active: updated.active });
      setFeedback({ kind: 'success', message: 'Tu perfil se actualizó correctamente.' });
      return true;
    } catch (error) {
      setFeedback({ kind: 'error', message: asAppError(error).message });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }
  return { save, isSubmitting, feedback };
}
