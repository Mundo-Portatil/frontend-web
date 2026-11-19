import { useEffect, useState, type FormEvent } from 'react';
import { Can } from '../../../../components/guards/Can';
import { asAppError } from '../../../../services/api/errors';
import type { AppError } from '../../../../services/api/errors';
import { DANGER_BUTTON_CLASS, LABEL_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS, TEXT_INPUT_INVALID_CLASS } from '../../../../utils/formStyles';
import { formatDate } from '../../../../utils/formatDate';
import { Notification } from '../../../../components/notifications/Notification';
import type { NotificationKind } from '../../../../components/notifications/Notification';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { ErrorState } from '../../../../components/feedback/ErrorState';
import { InlineSpinner } from '../../../../components/feedback/InlineSpinner';
import { LoadingState } from '../../../../components/feedback/LoadingState';
import type { Location, LocationType } from '../models';
import { createLocation, listLocations, updateLocation } from '../services/locationService';
import { useLocationStore } from '../../../../stores/locationStore';

const LOCATION_TYPES: readonly LocationType[] = ['ALMACEN_CENTRAL', 'PUESTO'];
const TYPE_LABELS: Record<LocationType, string> = { ALMACEN_CENTRAL: 'Almacén central', PUESTO: 'Puesto' };

interface Feedback {
  kind: NotificationKind;
  message: string;
}

/** Locations listing and administration. Editing is restricted visually to ADMIN. */
export function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenError, setScreenError] = useState<AppError | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>('PUESTO');
  const [nameError, setNameError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Location | null>(null);

  async function loadLocations() {
    setIsLoading(true);
    setScreenError(null);
    try {
      const data = await listLocations();
      setLocations(data);

      // Keep the global selector in sync and never keep an inactive
      // location as the operative context.
      useLocationStore.getState().setAvailableLocations(data);
    } catch (reason) {
      setScreenError(asAppError(reason));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Data loading requires state updates after the async request finishes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLocations();
  }, []);

  function resetForm() {
    setName('');
    setType('PUESTO');
    setNameError(null);
    setEditing(null);
  }

  function startEdit(location: Location) {
    setEditing(location);
    setName(location.name);
    setType(location.type);
    setNameError(null);
    setFeedback(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const trimmedName = name.trim();
    if (trimmedName === '') {
      setNameError('El nombre es obligatorio.');
      return;
    }

    setNameError(null);
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (editing) {
        const updated = await updateLocation(editing.id, { name: trimmedName });
        setLocations((items) => items.map((item) => (item.id === updated.id ? updated : item)));
        useLocationStore.getState().upsertLocation(updated);
        setFeedback({ kind: 'success', message: 'Ubicación actualizada correctamente.' });
      } else {
        const created = await createLocation({ name: trimmedName, type });
        setLocations((items) => [created, ...items]);
        useLocationStore.getState().upsertLocation(created);
        setFeedback({ kind: 'success', message: 'Ubicación creada correctamente.' });
      }
      resetForm();
    } catch (reason) {
      setFeedback({ kind: 'error', message: asAppError(reason).message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deactivate(location: Location) {
    if (!location.active || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const updated = await updateLocation(location.id, { active: false });
      setLocations((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      useLocationStore.getState().upsertLocation(updated);
      setFeedback({ kind: 'success', message: 'Ubicación desactivada correctamente.' });
    } catch (reason) {
      setFeedback({ kind: 'error', message: asAppError(reason).message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Ubicaciones</h1>
        <p className="mt-2 text-sm text-slate-500">Administra los almacenes y puestos operativos.</p>
      </header>

      <Can roles={['ADMIN']}>
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">{editing ? 'Editar ubicación' : 'Registrar ubicación'}</h2>
          <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={submit} noValidate>
            <div className="min-w-56 flex-1">
              <label htmlFor="location-name" className={LABEL_CLASS}>Nombre</label>
              <input
                id="location-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (nameError) setNameError(null);
                }}
                disabled={isSubmitting}
                className={nameError ? `${TEXT_INPUT_CLASS} ${TEXT_INPUT_INVALID_CLASS}` : TEXT_INPUT_CLASS}
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? 'location-name-error' : undefined}
                required
              />
              {nameError && (
                <p id="location-name-error" className="mt-1 text-sm text-red-600">
                  {nameError}
                </p>
              )}
            </div>
            {!editing && (
              <div>
                <label htmlFor="location-type" className={LABEL_CLASS}>Tipo</label>
                <select
                  id="location-type"
                  value={type}
                  onChange={(event) => setType(event.target.value as LocationType)}
                  disabled={isSubmitting}
                  className={TEXT_INPUT_CLASS}
                >
                  {LOCATION_TYPES.map((item) => (
                    <option key={item} value={item}>{TYPE_LABELS[item]}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              className={`${PRIMARY_BUTTON_CLASS} inline-flex items-center gap-2`}
              disabled={isSubmitting}
            >
              {isSubmitting && <InlineSpinner className="border-white" />}
              {isSubmitting ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear ubicación'}
            </button>
            {editing && (
              <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={resetForm} disabled={isSubmitting}>
                Cancelar
              </button>
            )}
          </form>
        </section>
      </Can>

      {feedback && (
        <div className="mb-4">
          <Notification kind={feedback.kind}>{feedback.message}</Notification>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex justify-between">
          <h2 className="text-lg font-semibold">Listado de ubicaciones</h2>
          <button className={SECONDARY_BUTTON_CLASS} type="button" onClick={() => void loadLocations()} disabled={isLoading}>
            Recargar
          </button>
        </div>

        {screenError ? (
          <ErrorState error={screenError} onRetry={() => void loadLocations()} />
        ) : isLoading ? (
          <LoadingState message="Cargando ubicaciones..." />
        ) : locations.length === 0 ? (
          <EmptyState message="No hay ubicaciones disponibles." />
        ) : (
          <div
            role="region"
            aria-label="Listado de ubicaciones"
            tabIndex={0}
            className="overflow-x-auto rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
          >
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-600">
                  <th scope="col" className="p-2">Nombre</th>
                  <th scope="col" className="p-2">Tipo</th>
                  <th scope="col" className="p-2">Estado</th>
                  <th scope="col" className="p-2">Creada</th>
                  <th scope="col" className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((location) => (
                  <tr key={location.id} className="border-b border-slate-100">
                    <td className="p-2">{location.name}</td>
                    <td className="p-2">{TYPE_LABELS[location.type]}</td>
                    <td className="p-2">{location.active ? 'Activa' : 'Inactiva'}</td>
                    <td className="p-2">{formatDate(location.createdAt)}</td>
                    <td className="p-2">
                      <Can roles={['ADMIN']}>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className={SECONDARY_BUTTON_CLASS}
                            onClick={() => startEdit(location)}
                            disabled={isSubmitting}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={DANGER_BUTTON_CLASS}
                            disabled={!location.active || isSubmitting}
                            onClick={() => void deactivate(location)}
                          >
                            Dar de baja
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
