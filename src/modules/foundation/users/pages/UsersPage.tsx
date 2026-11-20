import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Can } from '../../../../components/guards/Can';
import { useAuthStore } from '../../../../stores/authStore';
import { ROLE_LABELS } from '../../auth/roleLabels';
import type { Role } from '../../auth/models';
import { asAppError } from '../../../../services/api/errors';
import type { AppError } from '../../../../services/api/errors';
import { formatDate } from '../../../../utils/formatDate';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { ErrorState } from '../../../../components/feedback/ErrorState';
import { InlineSpinner } from '../../../../components/feedback/InlineSpinner';
import { LoadingState } from '../../../../components/feedback/LoadingState';
import {
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
  TEXT_INPUT_INVALID_CLASS,
} from '../../../../utils/formStyles';
import { createUser, listUsers, updateUser } from '../services/userService';
import { getAccessToken } from '../../../../config/authToken';
import type { UpdateUserInput, User } from '../models';
import { isValidEmail, isValidPassword, MIN_PASSWORD_LENGTH } from '../../../../utils/validation';
import { Notification } from '../../../../components/notifications/Notification';
import type { NotificationKind } from '../../../../components/notifications/Notification';

const ROLE_OPTIONS: Role[] = ['ADMIN', 'VENDEDOR', 'TECNICO'];

interface Feedback {
  kind: NotificationKind;
  message: string;
}

interface UserFormState {
  email: string;
  name: string;
  role: Role;
  password: string;
  active: boolean;
}

interface UserFormErrors {
  email?: string;
  name?: string;
  role?: string;
  password?: string;
}

const EMPTY_FORM: UserFormState = {
  email: '',
  name: '',
  role: 'VENDEDOR',
  password: '',
  active: true,
};

function inputClass(hasError: boolean): string {
  return hasError ? `${TEXT_INPUT_CLASS} ${TEXT_INPUT_INVALID_CLASS}` : TEXT_INPUT_CLASS;
}

function validateCreateForm(form: UserFormState): UserFormErrors {
  const errors: UserFormErrors = {};

  if (form.email.trim() === '') {
    errors.email = 'El correo es obligatorio.';
  } else if (!isValidEmail(form.email.trim())) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  if (form.name.trim() === '') {
    errors.name = 'El nombre es obligatorio.';
  }

  if (!ROLE_OPTIONS.includes(form.role)) {
    errors.role = 'Selecciona un rol válido.';
  }

  if (form.password === '') {
    errors.password = 'La contraseña es obligatoria.';
  } else if (!isValidPassword(form.password)) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  return errors;
}

function validateEditForm(form: UserFormState): UserFormErrors {
  const errors: UserFormErrors = {};

  if (form.name.trim() === '') {
    errors.name = 'El nombre es obligatorio.';
  }

  if (!ROLE_OPTIONS.includes(form.role)) {
    errors.role = 'Selecciona un rol válido.';
  }

  if (form.password !== '' && !isValidPassword(form.password)) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  return errors;
}

function userFormFromEntity(user: User): UserFormState {
  return {
    email: user.email,
    name: user.name,
    role: user.role,
    password: '',
    active: user.active,
  };
}

/**
 * Users administration screen (ADMIN only): list users, create users,
 * update users and perform soft-delete via active=false.
 */
export function UsersPage() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSave, setPendingSave] = useState<{ user: User; payload: UpdateUserInput } | null>(null);
  const savingRef = useRef(false);
  const confirmationHeadingRef = useRef<HTMLHeadingElement>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<UserFormErrors>({});
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const [screenError, setScreenError] = useState<AppError | null>(null);
  const [formError, setFormError] = useState<AppError | null>(null);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
  const [operationFeedback, setOperationFeedback] = useState<Feedback | null>(null);

  const isEditing = selectedUser !== null;
  const formDisabled = isSubmitting || pendingSave !== null;

  useEffect(() => {
    if (pendingSave) confirmationHeadingRef.current?.focus();
    else if (selectedUser) document.getElementById('user-name')?.focus();
  }, [pendingSave, selectedUser]);

  async function loadUsers() {
    setIsLoading(true);
    setScreenError(null);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (error) {
      setScreenError(asAppError(error));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Data loading requires state updates after the async request finishes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUsers();
  }, []);

  const activeUsersCount = useMemo(() => users.filter((user) => user.active).length, [users]);

  function resetForm() {
    setPendingSave(null);
    setSelectedUser(null);
    setForm({ ...EMPTY_FORM });
    setFormErrors({});
    setFormError(null);
    // Remount the form after a successful operation. This also clears values
    // restored by browser autofill while keeping input state controlled.
    setFormKey((key) => key + 1);
    formRef.current?.reset();
  }

  function startEdit(user: User) {
    if (savingRef.current || pendingSave) return;
    setSelectedUser(user);
    setForm(userFormFromEntity(user));
    setFormErrors({});
    setFormError(null);
    setFormSuccessMessage(null);
    setOperationFeedback(null);
  }

  async function saveEditedUser(user: User, payload: UpdateUserInput) {
    if (savingRef.current || useAuthStore.getState().user?.role !== 'ADMIN') return;
    savingRef.current = true;
    const accountId = useAuthStore.getState().user?.id;
    const token = getAccessToken();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const updated = await updateUser(user.id, payload);
      if (getAccessToken() !== token || useAuthStore.getState().user?.id !== accountId) return;
      setUsers((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
      if (updated.id === currentUserId) {
        await refreshProfile();
        // A confirmed own-account deactivation also ends the session if the profile refresh cannot reach the server.
        if (!updated.active && getAccessToken() === token && useAuthStore.getState().user?.id === accountId) {
          useAuthStore.getState().handleSessionExpired();
        }
      }
      setOperationFeedback({
        kind: 'success',
        message: updated.active !== user.active
          ? updated.active ? 'Usuario reactivado correctamente.' : 'Usuario desactivado correctamente.'
          : 'Usuario actualizado correctamente.',
      });
      resetForm();
    } catch (error) {
      if (getAccessToken() === token && useAuthStore.getState().user?.id === accountId) setFormError(asAppError(error));
    } finally {
      savingRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current || pendingSave || useAuthStore.getState().user?.role !== 'ADMIN') return;
    const errors = isEditing ? validateEditForm(form) : validateCreateForm(form);
    setFormErrors(errors);
    setFormError(null);
    setFormSuccessMessage(null);
    setOperationFeedback(null);
    if (Object.keys(errors).length > 0) return;
    if (selectedUser) {
      const payload: UpdateUserInput = { name: form.name.trim(), role: form.role };
      if (form.active !== selectedUser.active) payload.active = form.active;
      if (form.password.trim() !== '') payload.password = form.password;
      if (payload.active !== undefined || form.role !== selectedUser.role || payload.password !== undefined) {
        setPendingSave({ user: selectedUser, payload });
      } else {
        await saveEditedUser(selectedUser, payload);
      }
      return;
    }
    savingRef.current = true;
    const accountId = useAuthStore.getState().user?.id;
    const token = getAccessToken();
    setIsSubmitting(true);
    try {
      const created = await createUser({ email: form.email.trim(), name: form.name.trim(), password: form.password, role: form.role });
      if (getAccessToken() !== token || useAuthStore.getState().user?.id !== accountId) return;
      setUsers((previous) => [created, ...previous]);
      setFormSuccessMessage('Usuario creado correctamente.');
      resetForm();
    } catch (error) {
      if (getAccessToken() === token && useAuthStore.getState().user?.id === accountId) setFormError(asAppError(error));
    } finally {
      savingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Usuarios</h1>
        <p className="mt-2 text-sm text-slate-500">
          Administra las cuentas, roles y estado de acceso del personal.
        </p>
      </header>

      <div className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <article>
          <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{users.length}</p>
        </article>
        <article>
          <p className="text-xs uppercase tracking-wide text-slate-500">Activos</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{activeUsersCount}</p>
        </article>
        <article>
          <p className="text-xs uppercase tracking-wide text-slate-500">Inactivos</p>
          <p className="mt-1 text-2xl font-semibold text-slate-700">{users.length - activeUsersCount}</p>
        </article>
      </div>

      <Can roles={['ADMIN']}>
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditing ? 'Editar usuario' : 'Registrar usuario'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isEditing
              ? 'Actualiza los datos y el estado de acceso del usuario.'
              : 'Crea una nueva cuenta de acceso para el sistema.'}
          </p>

          {formSuccessMessage && (
            <div className="mt-4"><Notification kind="success">{formSuccessMessage}</Notification></div>
          )}

          {formError && (
            <div className="mt-4"><Notification kind="error">{formError.message}</Notification></div>
          )}

          <form
            key={formKey}
            ref={formRef}
            className="mt-4 grid gap-4 md:grid-cols-2"
            onSubmit={handleSubmit}
            noValidate
          >
            <div>
              <label className={LABEL_CLASS} htmlFor="user-email">
                Correo electrónico
              </label>
              <input
                id="user-email"
                type="email"
                value={form.email}
                disabled={isEditing || formDisabled}
                onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
                className={inputClass(Boolean(formErrors.email))}
                aria-invalid={Boolean(formErrors.email)}
                aria-describedby={formErrors.email ? 'user-email-error' : undefined}
                autoComplete="off"
                spellCheck={false}
              />
              {formErrors.email && (
                <p id="user-email-error" className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className={LABEL_CLASS} htmlFor="user-name">
                Nombre completo
              </label>
              <input
                id="user-name"
                type="text"
                value={form.name}
                disabled={formDisabled}
                onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                className={inputClass(Boolean(formErrors.name))}
                aria-invalid={Boolean(formErrors.name)}
                aria-describedby={formErrors.name ? 'user-name-error' : undefined}
                autoComplete="off"
              />
              {formErrors.name && (
                <p id="user-name-error" className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className={LABEL_CLASS} htmlFor="user-role">
                Rol
              </label>
              <select
                id="user-role"
                value={form.role}
                disabled={formDisabled}
                onChange={(event) => setForm((previous) => ({ ...previous, role: event.target.value as Role }))}
                className={inputClass(Boolean(formErrors.role))}
                aria-invalid={Boolean(formErrors.role)}
                aria-describedby={formErrors.role ? 'user-role-error' : undefined}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              {formErrors.role && (
                <p id="user-role-error" className="mt-1 text-sm text-red-600">{formErrors.role}</p>
              )}
            </div>

            <div>
              <label className={LABEL_CLASS} htmlFor="user-password">
                {isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              </label>
              <input
                id="user-password"
                type="password"
                value={form.password}
                disabled={formDisabled}
                onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
                className={inputClass(Boolean(formErrors.password))}
                aria-invalid={Boolean(formErrors.password)}
                aria-describedby={formErrors.password ? 'user-password-error' : undefined}
                autoComplete="new-password"
              />
              {formErrors.password && (
                <p id="user-password-error" className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>

            {isEditing && (
              <div>
                <label className={LABEL_CLASS} htmlFor="user-active">Estado de acceso</label>
                <select id="user-active" value={String(form.active)} disabled={formDisabled} onChange={(event) => setForm((previous) => ({ ...previous, active: event.target.value === 'true' }))} className={TEXT_INPUT_CLASS}>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            )}

            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={formDisabled} className={`${PRIMARY_BUTTON_CLASS} inline-flex items-center gap-2`}>
                {isSubmitting && <InlineSpinner className="border-white" />}
                {isSubmitting
                  ? isEditing
                    ? 'Guardando cambios...'
                    : 'Creando usuario...'
                  : isEditing
                    ? 'Guardar cambios'
                    : 'Crear usuario'}
              </button>
              {isEditing && (
                <button type="button" disabled={formDisabled} onClick={resetForm} className={SECONDARY_BUTTON_CLASS}>
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
          {pendingSave && (
            <section aria-labelledby="user-confirmation-heading" className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 ref={confirmationHeadingRef} id="user-confirmation-heading" tabIndex={-1} className="rounded font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Confirmar cambios del usuario</h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Usuario</dt><dd className="break-words font-medium">{pendingSave.payload.name} · {pendingSave.user.email}</dd></div>
                <div><dt className="text-slate-500">Rol</dt><dd className="font-medium">{ROLE_LABELS[pendingSave.payload.role ?? pendingSave.user.role]}</dd></div>
                <div><dt className="text-slate-500">Estado de acceso</dt><dd className="font-medium">{(pendingSave.payload.active ?? pendingSave.user.active) ? 'Activo' : 'Inactivo'}</dd></div>
                {pendingSave.payload.password !== undefined && <div><dt className="text-slate-500">Contraseña</dt><dd>Se actualizará la contraseña.</dd></div>}
              </dl>
              {pendingSave.payload.active === false && <p className="text-sm text-slate-700">Este usuario dejará de tener acceso al sistema.{pendingSave.user.id === currentUserId ? ' Tu sesión se cerrará.' : ''}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={PRIMARY_BUTTON_CLASS} disabled={isSubmitting} onClick={() => void saveEditedUser(pendingSave.user, pendingSave.payload)}>{isSubmitting ? 'Guardando cambios…' : 'Confirmar cambios'}</button>
                <button type="button" className={SECONDARY_BUTTON_CLASS} disabled={isSubmitting} onClick={() => { setPendingSave(null); setFormError(null); }}>Volver a editar</button>
              </div>
            </section>
          )}
        </section>
      </Can>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Listado de usuarios</h2>
          <button type="button" onClick={() => void loadUsers()} disabled={isLoading || formDisabled} className={SECONDARY_BUTTON_CLASS}>
            Recargar
          </button>
        </div>

        {operationFeedback && (
          <div className="mb-4">
            <Notification kind={operationFeedback.kind}>{operationFeedback.message}</Notification>
          </div>
        )}

        {screenError && (
          <ErrorState error={screenError} onRetry={() => void loadUsers()} />
        )}

        {!screenError && isLoading && <LoadingState message="Cargando usuarios..." />}

        {!screenError && !isLoading && users.length === 0 && (
          <EmptyState message="No hay usuarios registrados." />
        )}

        {!screenError && !isLoading && users.length > 0 && (
          <div
            role="region"
            aria-label="Listado de usuarios"
            tabIndex={0}
            className="overflow-x-auto rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
          >
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-slate-600">Nombre</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-slate-600">Correo</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-slate-600">Rol</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-slate-600">Estado</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-slate-600">Actualizado</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 py-2 text-slate-900">{user.name}</td>
                    <td className="px-3 py-2 text-slate-700">{user.email}</td>
                    <td className="px-3 py-2 text-slate-700">{ROLE_LABELS[user.role]}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          user.active
                            ? 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700'
                            : 'rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700'
                        }
                      >
                        {user.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{formatDate(user.updatedAt)}</td>
                    <td className="px-3 py-2">
                      <Can roles={['ADMIN']}>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(user)}
                            className={SECONDARY_BUTTON_CLASS}
                            disabled={formDisabled}
                          >
                            Editar
                          </button>

                        </div>
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
