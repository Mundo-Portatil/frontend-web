import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { asAppError } from '../../../../services/api/errors';
import type { AppError } from '../../../../services/api/errors';
import { LABEL_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../../utils/formStyles';
import { formatDate } from '../../../../utils/formatDate';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { ErrorState } from '../../../../components/feedback/ErrorState';
import { InlineSpinner } from '../../../../components/feedback/InlineSpinner';
import { LoadingState } from '../../../../components/feedback/LoadingState';
import type { AuditLogPage } from '../models';
import { formatAuditAction } from '../actionTranslations';
import { formatAuditModule, resolveModuleFilter } from '../moduleTranslations';
import { listAuditLogs } from '../services/auditLogService';
import { listUsers } from '../../users/services/userService';
import type { User } from '../../users/models';

const EMPTY_RESULT: AuditLogPage = { items: [], total: 0, page: 1, limit: 20 };
const MAX_SUGGESTIONS = 8;

interface AppliedFilters {
  module: string;
  userId: string;
}

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Read-only audit log query with administrative-friendly filters. */
export function AuditLogsPage() {
  const [result, setResult] = useState<AuditLogPage>(EMPTY_RESULT);
  const [module, setModule] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({ module: '', userId: '' });
  const lastRequestRef = useRef<{ page: number; filters: AppliedFilters }>({
    page: 1,
    filters: { module: '', userId: '' },
  });
  const userInputRef = useRef<HTMLInputElement>(null);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [highlightedUserIndex, setHighlightedUserIndex] = useState(0);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [areUsersLoading, setAreUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(false);

  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const matchingUsers = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(userQuery);
    const matches = normalizedQuery
      ? users.filter(
          (user) =>
            normalizeSearchValue(user.name).includes(normalizedQuery) ||
            normalizeSearchValue(user.email).includes(normalizedQuery),
        )
      : users;
    return matches.slice(0, MAX_SUGGESTIONS);
  }, [userQuery, users]);

  const appliedUser = appliedFilters.userId ? usersById.get(appliedFilters.userId) : undefined;

  async function load(page = 1, filters: AppliedFilters = appliedFilters) {
    lastRequestRef.current = { page, filters };
    setIsLoading(true);
    setError(null);
    try {
      setResult(
        await listAuditLogs({
          module: filters.module,
          userId: filters.userId,
          page,
          limit: 20,
        }),
      );
    } catch (reason) {
      setError(asAppError(reason));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Data loading requires state updates after the async request finishes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(1, { module: '', userId: '' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isCurrent = true;
    void listUsers()
      .then((data) => {
        if (isCurrent) setUsers(data);
      })
      .catch(() => {
        if (isCurrent) setUsersError(true);
      })
      .finally(() => {
        if (isCurrent) setAreUsersLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  function chooseUser(user: User) {
    setUserQuery(user.name);
    setSelectedUserId(user.id);
    setFilterError(null);
    setIsUserListOpen(false);
  }

  function resolveUserFilter(): string | undefined {
    const query = userQuery.trim();
    if (query === '') {
      return '';
    }
    if (selectedUserId) {
      return selectedUserId;
    }
    if (areUsersLoading) {
      setFilterError('Espera a que terminen de cargarse los usuarios.');
      return undefined;
    }
    if (usersError) {
      setFilterError('No se pudieron cargar los usuarios para aplicar el filtro.');
      return undefined;
    }

    const normalizedQuery = normalizeSearchValue(query);
    const exactMatches = users.filter(
      (user) =>
        normalizeSearchValue(user.name) === normalizedQuery ||
        normalizeSearchValue(user.email) === normalizedQuery,
    );
    if (exactMatches.length === 1) {
      chooseUser(exactMatches[0]);
      return exactMatches[0].id;
    }

    const matches = users.filter(
      (user) =>
        normalizeSearchValue(user.name).includes(normalizedQuery) ||
        normalizeSearchValue(user.email).includes(normalizedQuery),
    );
    if (matches.length === 1) {
      chooseUser(matches[0]);
      return matches[0].id;
    }
    if (matches.length > 1) {
      setFilterError('Selecciona un usuario de las coincidencias.');
      setHighlightedUserIndex(0);
      setIsUserListOpen(true);
      userInputRef.current?.focus();
      return undefined;
    }

    setFilterError('No se encontró un usuario con ese nombre o correo.');
    return undefined;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const filterUserId = resolveUserFilter();
    if (filterUserId === undefined) {
      return;
    }
    const filters = { module: resolveModuleFilter(module), userId: filterUserId };
    setAppliedFilters(filters);
    setIsUserListOpen(false);
    void load(1, filters);
  }

  function clearFilters() {
    setModule('');
    setUserQuery('');
    setSelectedUserId('');
    setFilterError(null);
    setAppliedFilters({ module: '', userId: '' });
    setIsUserListOpen(false);
    void load(1, { module: '', userId: '' });
  }

  function handleUserKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setIsUserListOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!isUserListOpen) {
        setIsUserListOpen(true);
        return;
      }
      if (matchingUsers.length === 0) {
        return;
      }
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setHighlightedUserIndex((index) => (index + direction + matchingUsers.length) % matchingUsers.length);
      return;
    }
    if (event.key === 'Enter' && isUserListOpen && matchingUsers.length > 0) {
      event.preventDefault();
      chooseUser(matchingUsers[highlightedUserIndex] ?? matchingUsers[0]);
    }
  }

  const canRetry = error !== null;

  function renderUser(userId: string | null) {
    if (!userId) {
      return <span className="text-slate-500">Sistema</span>;
    }
    if (areUsersLoading) {
      return <span className="text-slate-500">Cargando usuario…</span>;
    }
    if (usersError) {
      return <span className="text-slate-500">No disponible</span>;
    }

    const user = usersById.get(userId);
    if (!user) {
      return <span className="text-slate-500">Usuario desconocido</span>;
    }

    return (
      <span className="block min-w-44">
        <span className="block font-medium text-slate-900">{user.name}</span>
        <span className="block text-xs text-slate-500">{user.email}</span>
      </span>
    );
  }

  const hasActiveFilters =
    module.trim() !== '' ||
    userQuery.trim() !== '' ||
    selectedUserId !== '' ||
    appliedFilters.module !== '' ||
    appliedFilters.userId !== '';
  const optionId = (userId: string) => `audit-user-option-${userId}`;

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Bitácora</h1>
        <p className="mt-2 text-sm text-slate-500">Consulta de solo lectura de los eventos del sistema.</p>
      </header>

      <form
        onSubmit={submit}
        className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-start"
      >
        <div className="min-w-0 sm:w-52">
          <label htmlFor="audit-module" className={LABEL_CLASS}>Módulo</label>
          <input
            id="audit-module"
            className={TEXT_INPUT_CLASS}
            value={module}
            onChange={(event) => setModule(event.target.value)}
            placeholder="Ej. users o Usuarios"
          />
        </div>

        <div
          className="relative min-w-0 flex-1"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsUserListOpen(false);
            }
          }}
        >
          <label htmlFor="audit-user" className={LABEL_CLASS}>Usuario</label>
          <input
            id="audit-user"
            ref={userInputRef}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isUserListOpen}
            aria-controls={isUserListOpen ? 'audit-user-options' : undefined}
            aria-activedescendant={
              isUserListOpen && matchingUsers[highlightedUserIndex]
                ? optionId(matchingUsers[highlightedUserIndex].id)
                : undefined
            }
            aria-invalid={filterError ? true : undefined}
            aria-describedby={filterError ? 'audit-user-error' : 'audit-user-help'}
            className={`${TEXT_INPUT_CLASS} pr-9`}
            value={userQuery}
            onChange={(event) => {
              setUserQuery(event.target.value);
              setSelectedUserId('');
              setFilterError(null);
              setHighlightedUserIndex(0);
              setIsUserListOpen(true);
            }}
            onFocus={() => setIsUserListOpen(true)}
            onKeyDown={handleUserKeyDown}
            placeholder="Nombre o correo"
            autoComplete="off"
          />
          <span aria-hidden="true" className="pointer-events-none absolute right-3 top-[2.35rem] text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </span>

          {appliedUser && (
            <p id="audit-user-help" className="mt-1 text-xs text-slate-500">
              Filtro aplicado: {appliedUser.email}
            </p>
          )}
          {!appliedUser && !filterError && (
            <p id="audit-user-help" className="mt-1 text-xs text-slate-500">
              Escribe un nombre o correo y selecciona una coincidencia.
            </p>
          )}
          {filterError && (
            <p id="audit-user-error" role="alert" className="mt-1 text-sm text-red-600">
              {filterError}
            </p>
          )}

          {isUserListOpen && (
            <ul
              id="audit-user-options"
              role="listbox"
              aria-label="Usuarios disponibles"
              className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            >
              {areUsersLoading ? (
                <li className="px-3 py-2 text-sm text-slate-500">Cargando usuarios…</li>
              ) : usersError ? (
                <li className="px-3 py-2 text-sm text-slate-500">
                  No se pudieron cargar los usuarios.
                </li>
              ) : matchingUsers.length === 0 ? (
                <li className="px-3 py-2 text-sm text-slate-500">Sin coincidencias.</li>
              ) : (
                matchingUsers.map((user, index) => (
                  <li
                    key={user.id}
                    id={optionId(user.id)}
                    role="option"
                    aria-selected={user.id === selectedUserId}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseUser(user)}
                    className={`cursor-pointer px-3 py-2 text-sm ${
                      index === highlightedUserIndex ? 'bg-brand-50 text-brand-900' : 'text-slate-700'
                    }`}
                  >
                    <span className="block font-medium">{user.name}</span>
                    <span className="block text-xs text-slate-500">{user.email}</span>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2 sm:pt-6">
          <button className={`${PRIMARY_BUTTON_CLASS} inline-flex items-center gap-2`} disabled={isLoading}>
            {isLoading && <InlineSpinner className="border-white" />}
            {isLoading ? 'Consultando...' : 'Filtrar'}
          </button>
          {hasActiveFilters && (
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={clearFilters} disabled={isLoading}>
              Limpiar
            </button>
          )}
        </div>
      </form>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Registros</h2>
          <span className="text-sm text-slate-500">{result.total} resultado(s)</span>
        </div>

        {usersError && !isLoading && !error && result.items.length > 0 && (
          <p role="status" className="mb-3 text-sm text-amber-700">
            No se pudieron cargar los nombres de usuario.
          </p>
        )}

        {error ? (
          <ErrorState
            error={error}
            onRetry={
              canRetry
                ? () => void load(lastRequestRef.current.page, lastRequestRef.current.filters)
                : undefined
            }
          />
        ) : isLoading ? (
          <LoadingState message="Cargando registros..." />
        ) : result.items.length === 0 ? (
          <EmptyState message="No existen registros de auditoría para los filtros aplicados." />
        ) : (
          <div
            role="region"
            aria-label="Registros de auditoría"
            tabIndex={0}
            className="overflow-x-auto rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
          >
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b text-left text-slate-600">
                  <th scope="col" className="p-2">Fecha</th>
                  <th scope="col" className="p-2">Acción</th>
                  <th scope="col" className="p-2">Módulo</th>
                  <th scope="col" className="p-2">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 align-top">
                    <td className="whitespace-nowrap p-2 py-3 text-slate-700">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="p-2 py-3 text-slate-900">{formatAuditAction(item)}</td>
                    <td className="p-2 py-3 text-slate-700">{formatAuditModule(item.module)}</td>
                    <td className="p-2 py-3">{renderUser(item.userId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && result.total > result.limit && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className={SECONDARY_BUTTON_CLASS}
              disabled={result.page <= 1}
              onClick={() => void load(result.page - 1, appliedFilters)}
            >
              Anterior
            </button>
            <button
              type="button"
              className={SECONDARY_BUTTON_CLASS}
              disabled={result.page * result.limit >= result.total}
              onClick={() => void load(result.page + 1, appliedFilters)}
            >
              Siguiente
            </button>
          </div>
        )}
      </section>
    </section>
  );
}
