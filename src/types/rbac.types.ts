import { MemberRole } from './database.types';

export type Permission =
  | 'appointments:view'
  | 'appointments:create'
  | 'appointments:edit'
  | 'appointments:cancel'
  | 'appointments:checkin'
  | 'clients:view'
  | 'clients:create'
  | 'clients:edit'
  | 'clients:merge'
  | 'clients:view_confidential_notes'
  | 'services:manage'
  | 'inventory:view'
  | 'inventory:adjust'
  | 'sales:create'
  | 'sales:view_reports'
  | 'cash:open_close'
  | 'team:manage'
  | 'org:settings'
  | 'audit:view';

export const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  owner: [
    'appointments:view',
    'appointments:create',
    'appointments:edit',
    'appointments:cancel',
    'appointments:checkin',
    'clients:view',
    'clients:create',
    'clients:edit',
    'clients:merge',
    'clients:view_confidential_notes',
    'services:manage',
    'inventory:view',
    'inventory:adjust',
    'sales:create',
    'sales:view_reports',
    'cash:open_close',
    'team:manage',
    'org:settings',
    'audit:view',
  ],
  admin: [
    'appointments:view',
    'appointments:create',
    'appointments:edit',
    'appointments:cancel',
    'appointments:checkin',
    'clients:view',
    'clients:create',
    'clients:edit',
    'clients:merge',
    'clients:view_confidential_notes',
    'services:manage',
    'inventory:view',
    'inventory:adjust',
    'sales:create',
    'sales:view_reports',
    'cash:open_close',
    'team:manage',
    'org:settings',
    'audit:view',
  ],
  branch_manager: [
    'appointments:view',
    'appointments:create',
    'appointments:edit',
    'appointments:cancel',
    'appointments:checkin',
    'clients:view',
    'clients:create',
    'clients:edit',
    'services:manage',
    'inventory:view',
    'inventory:adjust',
    'sales:create',
    'sales:view_reports',
    'cash:open_close',
    'audit:view',
  ],
  receptionist: [
    'appointments:view',
    'appointments:create',
    'appointments:edit',
    'appointments:cancel',
    'appointments:checkin',
    'clients:view',
    'clients:create',
    'clients:edit',
    'inventory:view',
    'sales:create',
    'cash:open_close',
  ],
  professional: [
    'appointments:view',
    'appointments:checkin',
    'clients:view',
    'clients:view_confidential_notes',
  ],
  cashier: [
    'inventory:view',
    'sales:create',
    'cash:open_close',
  ],
  customer: [],
};

export function hasPermission(role: MemberRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
