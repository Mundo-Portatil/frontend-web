import { isAxiosError } from 'axios';

export type AppErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'server'
  | 'network'
  | 'unknown';

/**
 * Application-level error, ready to be consumed by the UI.
 * Messages are user-facing and written in Spanish.
 */
export interface AppError {
  kind: AppErrorKind;
  status?: number;
  message: string;
}

/** Global error payload structure returned by the backend. */
interface BackendErrorPayload {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

const KIND_MESSAGES: Record<AppErrorKind, string> = {
  validation: 'Datos inválidos. Revisa la información enviada.',
  unauthorized: 'Credenciales inválidas o sesión expirada.',
  forbidden: 'No tienes autorización para realizar esta operación.',
  notFound: 'El recurso solicitado no existe.',
  server: 'Error interno del servidor. Intenta nuevamente.',
  network: 'No se pudo establecer comunicación con el servidor. Verifica tu conexión.',
  unknown: 'Ha ocurrido un error inesperado. Intenta nuevamente.',
};

/**
 * Extracts the backend `message` field, accepting both shapes of the global
 * error contract: a plain string or an array of validation strings (the first
 * meaningful entry is used).
 */
function readBackendMessage(payload: BackendErrorPayload | undefined): string | undefined {
  if (!payload || payload.message === undefined || payload.message === null) {
    return undefined;
  }
  if (Array.isArray(payload.message)) {
    return payload.message.find((item) => typeof item === 'string' && item.trim() !== '');
  }
  return typeof payload.message === 'string' && payload.message.trim() !== ''
    ? payload.message
    : undefined;
}

function kindForStatus(status: number): AppErrorKind {
  if (status === 400 || status === 422) {
    return 'validation';
  }
  if (status === 401) {
    return 'unauthorized';
  }
  if (status === 403) {
    return 'forbidden';
  }
  if (status === 404) {
    return 'notFound';
  }
  if (status >= 500) {
    return 'server';
  }
  return 'unknown';
}

/**
 * Converts any thrown error (Axios or otherwise) into a typed AppError with a
 * Spanish, user-friendly message. Internal backend details are never exposed.
 */
export function mapAxiosError(error: unknown): AppError {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === undefined) {
      // No response at all: network failure, timeout or aborted request.
      return { kind: 'network', message: KIND_MESSAGES.network };
    }
    const kind = kindForStatus(status);
    const backendMessage = readBackendMessage(error.response?.data as BackendErrorPayload | undefined);
    return {
      kind,
      status,
      // Validation and conflict-style messages from the contract are written
      // for end users and add actionable context. Known statuses without a
      // backend message and every server error use curated Spanish messages,
      // so internal details are never exposed.
      message:
        (kind === 'validation' || kind === 'unknown') && backendMessage
          ? backendMessage
          : KIND_MESSAGES[kind],
    };
  }
  return { kind: 'unknown', message: KIND_MESSAGES.unknown };
}

/**
 * Returns the error as an AppError when it already has the expected shape
 * (e.g. rejected by the response interceptor), otherwise maps it.
 */
export function asAppError(error: unknown): AppError {
  if (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    typeof (error as { kind: unknown }).kind === 'string' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return error as AppError;
  }
  return mapAxiosError(error);
}
