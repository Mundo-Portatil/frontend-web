import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Can } from '../../../components/guards/Can';
import { ROUTES } from '../../../router/routes';
import type { Role } from '../../foundation/auth/models';

interface AreaLink { to: string; label: string; end?: boolean; roles?: Role[] }
interface InventoryArea { label: string; description: string; links: readonly AreaLink[] }

const CONSULTATION: InventoryArea = {
  label: 'Consultar inventario',
  description: 'Busca modelos, series y existencias por ubicación.',
  links: [
    { to: ROUTES.inventory, label: 'Modelos y existencias', end: true },
    { to: ROUTES.inventoryStock, label: 'Cantidades por ubicación' },
  ],
};
const PRODUCTS: InventoryArea = {
  label: 'Productos y categorías',
  description: 'Modelos, características y clasificación de la mercancía.',
  links: [
    { to: ROUTES.inventoryCatalog, label: 'Productos y modelos' },
    { to: ROUTES.inventoryCategories, label: 'Categorías' },
  ],
};
const INBOUND: InventoryArea = {
  label: 'Ingreso de mercancía',
  description: 'Registra mercancía y administra sus unidades.',
  links: [
    { to: ROUTES.inventoryInbound, label: 'Ingresar mercancía', roles: ['ADMIN', 'ENCARGADO_ALMACEN'] },
    { to: ROUTES.inventoryAdjustments, label: 'Corregir existencias', roles: ['ADMIN', 'ENCARGADO_ALMACEN'] },
  ],
};
const LABELS: InventoryArea = {
  label: 'Etiquetas',
  description: 'Consulta y vuelve a solicitar etiquetas de equipos y piezas.',
  links: [],
};

/** The route determines its area, including direct links and browser history. */
export function InventoryLayout() {
  const path = useLocation().pathname.replace(/\/+$/, '');
  const area = path === ROUTES.inventoryCatalog || path === ROUTES.inventoryCategories ? PRODUCTS
    : path === ROUTES.inventoryInbound || path === ROUTES.inventoryAdjustments ? INBOUND
      : path === ROUTES.inventoryLabels ? LABELS : CONSULTATION;
  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="mb-6 space-y-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900">{area.label}</h1>
          <p className="mt-1 text-sm text-slate-600">{area.description}</p>
        </div>
        {area.links.length > 0 && (
          <nav aria-label="Secciones de inventario" className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:px-4">
            <ul className="flex flex-wrap gap-1.5">
              {area.links.map((link) => (
                <Can key={link.to} roles={link.roles ?? ['ADMIN', 'ENCARGADO_ALMACEN', 'VENDEDOR', 'TECNICO']}>
                  <li className="min-w-0">
                    <NavLink to={link.to} end={link.end} className={({ isActive }) => `inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${isActive ? 'bg-brand-50 text-brand-800 underline decoration-2 underline-offset-4' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                      {link.label}
                    </NavLink>
                  </li>
                </Can>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <Outlet />
    </section>
  );
}
