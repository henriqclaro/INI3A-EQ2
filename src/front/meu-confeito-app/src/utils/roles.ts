export type UserRole = 'ADMIN' | 'MODERATOR' | 'BAKER' | 'CUSTOMER';

/**
 * Checks whether the user has baker privileges.
 * In Meu Confeito, MODERATOR and ADMIN are also elevated BAKERs with full baker access.
 */
export function isBaker(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toUpperCase();
  return normalized === 'BAKER' || normalized === 'MODERATOR' || normalized === 'ADMIN';
}

/**
 * Checks whether the user has staff privileges (ADMIN or MODERATOR).
 */
export function isStaff(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toUpperCase();
  return normalized === 'ADMIN' || normalized === 'MODERATOR';
}

/**
 * Checks whether the user is strictly an ADMIN.
 */
export function isAdmin(role?: string | null): boolean {
  if (!role) return false;
  return role.trim().toUpperCase() === 'ADMIN';
}

/**
 * Checks whether the user is strictly a MODERATOR.
 */
export function isModerator(role?: string | null): boolean {
  if (!role) return false;
  return role.trim().toUpperCase() === 'MODERATOR';
}

/**
 * Checks whether the user is a CUSTOMER.
 */
export function isCustomer(role?: string | null): boolean {
  if (!role) return false;
  return role.trim().toUpperCase() === 'CUSTOMER';
}

/**
 * Returns a human-friendly role label in Portuguese.
 */
export function getRoleLabel(role?: string | null): string {
  if (!role) return 'Usuário';
  const normalized = role.trim().toUpperCase();
  switch (normalized) {
    case 'ADMIN':
      return 'Administrador';
    case 'MODERATOR':
      return 'Moderador';
    case 'BAKER':
      return 'Confeiteiro(a)';
    case 'CUSTOMER':
      return 'Cliente';
    default:
      return role;
  }
}
