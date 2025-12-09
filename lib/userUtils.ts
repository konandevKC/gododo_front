import { User } from './auth';

/**
 * Vérifie si un utilisateur a un rôle RBAC spécifique
 */
export function hasRole(user: User | null | undefined, roleName: string): boolean {
  if (!user) return false;
  
  // Vérifier les rôles RBAC
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.some(role => role.name === roleName);
  }
  
  // Fallback: vérifier le rôle legacy (pour rétrocompatibilité)
  return user.role === roleName;
}

/**
 * Vérifie si un utilisateur est un contrôleur (via RBAC)
 */
export function isController(user: User | null | undefined): boolean {
  return hasRole(user, 'controleur');
}

/**
 * Vérifie si un utilisateur est un admin ou super_admin (via RBAC ou legacy)
 * Note: exclut les contrôleurs même s'ils ont aussi le rôle admin
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  
  // Si c'est un contrôleur, ce n'est pas un admin (même s'il a le rôle admin)
  if (isController(user)) {
    return false;
  }
  
  // Vérifier les rôles RBAC
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.some(role => 
      role.name === 'admin' || role.name === 'super_admin'
    );
  }
  
  // Fallback: vérifier le rôle legacy
  return user.role === 'admin';
}

/**
 * Vérifie si un utilisateur est un super admin (via RBAC)
 */
export function isSuperAdmin(user: User | null | undefined): boolean {
  return hasRole(user, 'super_admin');
}

/**
 * Vérifie si un utilisateur est un admin, super_admin ou contrôleur
 */
export function isAdminOrController(user: User | null | undefined): boolean {
  if (!user) return false;
  return isAdmin(user) || isController(user);
}

