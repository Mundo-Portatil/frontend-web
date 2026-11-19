import { Link } from 'react-router-dom';
import { ROUTES } from '../../../../router/routes';

/**
 * Access-denied screen for authenticated users who reach a route their
 * role is not allowed to open (FR-013 / FR-014).
 */
export function UnauthorizedPage() {
  return (
    <section className="flex flex-col items-center justify-center py-16 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Acceso denegado</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        No tienes autorización para acceder a esta sección.
      </p>
      <Link
        to={ROUTES.locations}
        className="mt-6 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
      >
        Volver a Ubicaciones
      </Link>
    </section>
  );
}
