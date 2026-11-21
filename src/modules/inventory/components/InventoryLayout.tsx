import { Outlet } from 'react-router-dom';

export function InventoryLayout() {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <Outlet />
    </section>
  );
}
