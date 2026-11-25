import type { Role } from '../foundation/auth/models';
// Original executor and reader role constants used by existing code
export const TRANSFER_EXECUTOR_ROLES: Role[] = ['ADMIN', 'ENCARGADO_ALMACEN'];
export const TRANSFER_READER_ROLES: Role[] = ['ADMIN', 'ENCARGADO_ALMACEN', 'VENDEDOR', 'TECNICO'];
// New aliases matching the spec naming (LOGISTICS_*)
export const LOGISTICS_EXECUTOR_ROLES: Role[] = TRANSFER_EXECUTOR_ROLES;
export const LOGISTICS_READER_ROLES: Role[] = TRANSFER_READER_ROLES;
export function canCreateTransfer(role: Role | undefined): boolean {
  return role !== undefined && TRANSFER_EXECUTOR_ROLES.includes(role);
}
