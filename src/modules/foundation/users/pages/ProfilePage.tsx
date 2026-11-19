import { useState, type FormEvent } from 'react';
import { Notification } from '../../../../components/notifications/Notification';
import { InlineSpinner } from '../../../../components/feedback/InlineSpinner';
import { useAuthStore } from '../../../../stores/authStore';
import { LABEL_CLASS, PRIMARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../../utils/formStyles';
import { useOwnProfile } from '../hooks/useOwnProfile';
import type { UpdateOwnProfileInput } from '../models';

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { save, isSubmitting, feedback } = useOwnProfile();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || isSubmitting) return;
    setError(null);
    if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Introduce un correo electrónico válido.'); return; }
    if (password && password.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
    if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return; }
    const payload: UpdateOwnProfileInput = {};
    if (name.trim() !== user.name) payload.name = name.trim();
    if (email.trim() !== user.email) payload.email = email.trim();
    if (password) payload.password = password;
    if (!Object.keys(payload).length) { setError('No hay cambios para guardar.'); return; }
    const succeeded = await save(payload);
    // Clear secrets after every attempt, including an API rejection.
    setPassword('');
    setConfirmation('');
    if (succeeded) {
      const savedUser = useAuthStore.getState().user;
      setName(savedUser?.name ?? '');
      setEmail(savedUser?.email ?? '');
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-semibold text-slate-900">Mi perfil</h1><p className="mt-1 text-sm text-slate-600">Actualiza tus datos personales.</p></div>
      {error && <Notification kind="error">{error}</Notification>}
      {!error && feedback && <Notification kind={feedback.kind}>{feedback.message}</Notification>}
      <form onSubmit={(event) => void submit(event)} noValidate className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <fieldset disabled={isSubmitting} className="space-y-5">
          <div><label htmlFor="profile-name" className={LABEL_CLASS}>Nombre</label><input id="profile-name" name="name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} className={TEXT_INPUT_CLASS} /></div>
          <div><label htmlFor="profile-email" className={LABEL_CLASS}>Correo electrónico</label><input id="profile-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={TEXT_INPUT_CLASS} /></div>
          <div><label htmlFor="profile-password" className={LABEL_CLASS}>Nueva contraseña</label><input id="profile-password" name="password" type="password" autoComplete="new-password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby="password-help" className={TEXT_INPUT_CLASS} /><p id="password-help" className="mt-1 text-sm text-slate-500">Opcional. Déjala vacía para conservar tu contraseña. Mínimo 6 caracteres.</p></div>
          <div><label htmlFor="profile-confirmation" className={LABEL_CLASS}>Confirmar nueva contraseña</label><input id="profile-confirmation" name="confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={TEXT_INPUT_CLASS} /></div>
          <button type="submit" disabled={isSubmitting} className={PRIMARY_BUTTON_CLASS}>{isSubmitting ? <><InlineSpinner /> Guardando…</> : 'Guardar cambios'}</button>
        </fieldset>
      </form>
    </section>
  );
}
