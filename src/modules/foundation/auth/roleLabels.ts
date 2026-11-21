import type { Role } from './models';

/** Spanish display names for user roles, for interface texts. */
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  ENCARGADO_ALMACEN: 'Encargado de almacén',
  VENDEDOR: 'Vendedor',
  TECNICO: 'Técnico',
};
