import type { Role } from '../foundation/auth/models';
export const TRANSFER_EXECUTOR_ROLES: Role[] = ['ADMIN', 'ENCARGADO_ALMACEN'];
export const TRANSFER_READER_ROLES: Role[] = ['ADMIN', 'ENCARGADO_ALMACEN', 'VENDEDOR', 'TECNICO'];
export function canCreateTransfer(role: Role | undefined): boolean {
  return role !== undefined && TRANSFER_EXECUTOR_ROLES.includes(role);
}
