import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Can } from '../../../components/guards/Can';
import { ROUTES } from '../../../router/routes';
import { PRIMARY_BUTTON_CLASS } from '../../../utils/formStyles';

const AREAS = [
  {
    id: 'stock',
    label: 'Existencias',
    to: ROUTES.inventory,
    links: [
      { to: ROUTES.inventory, label: 'Por serie o código', end: true },
      { to: ROUTES.inventoryStock, label: 'Por cantidad', end: false },
    ],
  },
  {
    id: 'products',
    label: 'Productos',
    to: ROUTES.inventoryCatalog,
    links: [
      { to: ROUTES.inventoryCatalog, label: 'Productos y modelos', end: false },
      { to: ROUTES.inventoryCategories, label: 'Categorías', end: false },
    ],
  },
] as const;

/** Derive the visible area from the route so deep links and browser history stay in sync. */
export function InventoryLayout() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, '');
  const isProducts = path === ROUTES.inventoryCatalog || path === ROUTES.inventoryCategories;
  const selectedArea = AREAS[isProducts ? 1 : 0];

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Inventario</h1>
          {!isProducts && (
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
          )}
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-white">
          <nav aria-label="Áreas de inventario" className="border-b border-slate-200 px-3 pt-2 sm:px-4">
            <ul className="flex gap-2">
              {AREAS.map((area) => {
                const active = area.id === selectedArea.id;
                return (
                  <li key={area.id} className="min-w-0 flex-1 sm:flex-none">
                    <Link
                      to={area.to}
                      aria-current={active ? 'location' : undefined}
                      className={`flex min-h-11 items-center justify-center border-b-2 px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 sm:px-5 ${active ? 'border-brand-600 text-brand-800' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900'}`}
                    >
                      {area.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <nav aria-label="Secciones de inventario" className="p-3 sm:px-4">
            <ul className="flex flex-wrap gap-1.5">
              {selectedArea.links.map((link) => (
                <li key={link.to} className="min-w-0">
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${isActive ? 'bg-brand-50 text-brand-800 underline decoration-2 underline-offset-4' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <Outlet />
    </section>
  );
}
