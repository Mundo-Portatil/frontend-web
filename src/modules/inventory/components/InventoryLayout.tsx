import { NavLink, Outlet } from 'react-router-dom';
import { Can } from '../../../components/guards/Can';
import { ROUTES } from '../../../router/routes';
import { PRIMARY_BUTTON_CLASS } from '../../../utils/formStyles';

const NAVIGATION_GROUPS = [
  {
    label: 'Consultar existencias',
    links: [
      { to: ROUTES.inventory, label: 'Por serie o código', end: true },
      { to: ROUTES.inventoryStock, label: 'Por cantidad', end: false },
    ],
  },
  {
    label: 'Organizar productos',
    links: [
      { to: ROUTES.inventoryCatalog, label: 'Productos y modelos', end: false },
      { to: ROUTES.inventoryCategories, label: 'Categorías', end: false },
    ],
  },
] as const;

/** Keep existing routes and permissions, grouped by the worker's purpose. */
export function InventoryLayout() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Inventario</h1>
          <Can roles={['ADMIN']}>
            <NavLink
              to={ROUTES.inventoryInbound}
              className={({ isActive }) =>
                `${PRIMARY_BUTTON_CLASS} inline-flex min-h-10 items-center ${isActive ? 'ring-2 ring-brand-500 ring-offset-2' : ''}`
              }
            >
              Ingresar equipos y piezas
            </NavLink>
          </Can>
        </div>

        <nav
          aria-label="Secciones de inventario"
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 sm:p-4"
        >
          {NAVIGATION_GROUPS.map((group) => (
            <div key={group.label} role="group" aria-label={group.label} className="min-w-0">
              <p className="mb-2 text-xs font-semibold text-slate-500">{group.label}</p>
              <ul className="flex flex-wrap gap-1.5">
                {group.links.map((link) => (
                  <li key={link.to} className="min-w-0">
                    <NavLink
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) =>
                        `inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
                          isActive
                            ? 'bg-brand-50 text-brand-800 underline decoration-2 underline-offset-4'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </header>

      <Outlet />
    </section>
  );
}
