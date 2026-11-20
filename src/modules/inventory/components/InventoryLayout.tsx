import { NavLink, Outlet } from 'react-router-dom';
import { Can } from '../../../components/guards/Can';
import { ROUTES } from '../../../router/routes';

interface InventoryTab {
  to: string;
  label: string;
  /** The index route must only be active on the exact path. */
  end?: boolean;
  adminOnly?: boolean;
}

const TABS: readonly InventoryTab[] = [
  { to: ROUTES.inventory, label: 'Consulta', end: true },
  { to: ROUTES.inventoryStock, label: 'Stock' },
  { to: ROUTES.inventoryCatalog, label: 'Catálogo' },
  { to: ROUTES.inventoryCategories, label: 'Categorías' },
  { to: ROUTES.inventoryInbound, label: 'Ingreso', adminOnly: true },
];

const TAB_BASE_CLASS =
  'inline-flex items-center whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1';

const TAB_ACTIVE_CLASS = 'border-brand-600 text-brand-700';
const TAB_INACTIVE_CLASS =
  'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900';

/**
 * Shared shell for the inventory module.
 *
 * The sidebar exposes a single "Inventario" entry; the module itself is
 * organized into tabs that map one-to-one to the routes defined by the phase.
 * Keeping the routes intact preserves deep links, guards and backend contracts
 * while removing the fragmented five-entry navigation.
 */
export function InventoryLayout() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Inventario</h1>
        <p className="mt-2 text-sm text-slate-500">
          Consulta equipos serializados, stock por cantidad, catálogo y categorías.
        </p>

        <nav aria-label="Secciones de inventario" className="mt-5 -mx-1 overflow-x-auto">
          <ul className="flex min-w-max items-center gap-1 border-b border-slate-200 px-1">
            {TABS.map((tab) => (
              <TabLink key={tab.to} tab={tab} />
            ))}
          </ul>
        </nav>
      </header>

      <Outlet />
    </section>
  );
}

function TabLink({ tab }: { tab: InventoryTab }) {
  const link = (
    <NavLink
      to={tab.to}
      end={tab.end}
      className={({ isActive }) =>
        `${TAB_BASE_CLASS} ${isActive ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS}`
      }
    >
      {tab.label}
    </NavLink>
  );

  if (tab.adminOnly) {
    return (
      <Can roles={['ADMIN']}>
        <li>{link}</li>
      </Can>
    );
  }

  return <li>{link}</li>;
}
