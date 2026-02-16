export type UserRole = 'admin' | 'office_user';

export const PERMISSIONS = {
  // Admin permissions
  UPLOAD_VOTERS: ['admin'],
  MANAGE_SERVICES: ['admin'],
  VIEW_ALL_REPORTS: ['admin'],
  VIEW_REPORTS: ['admin'],
  CREATE_CUSTOM_REPORTS: ['admin'],
  CONFIGURE_TEMPLATES: ['admin'],
  MANAGE_USERS: ['admin'],
  MANAGE_WORKERS: ['admin'],
  MANAGE_EMPLOYEES: ['admin'],
  
  // Office User permissions
  SEARCH_VOTERS: ['admin', 'office_user'],
  CREATE_SERVICE_REQUESTS: ['admin', 'office_user'],
  UPDATE_WORK_STATUS: ['admin', 'office_user'],
  VIEW_OWN_REQUESTS: ['admin', 'office_user'],
  
  // Form builder (currently for admin)
  CREATE_FORMS: ['admin'],
  FILL_FORMS: ['admin', 'office_user'],
  
  // Family management
  LINK_FAMILY: ['admin', 'office_user'],
} as const;

export function hasPermission(userRole: UserRole | null, permission: keyof typeof PERMISSIONS): boolean {
  if (!userRole) return false;
  return PERMISSIONS[permission].includes(userRole);
}

export function requireRole(userRole: UserRole | null, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}
