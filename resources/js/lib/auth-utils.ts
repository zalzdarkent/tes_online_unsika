import { type User, type NavItem } from '@/types';

/**
 * Check if user has admin role
 */
export function isAdmin(user: User | null): boolean {
    return user?.role === 'admin';
}

/**
 * Check if user has teacher role
 */
export function isTeacher(user: User | null): boolean {
    return user?.role === 'teacher';
}

/**
 * Check if user has peserta role
 */
export function isPeserta(user: User | null): boolean {
    return user?.role === 'peserta';
}

/**
 * Check if user can access admin features (admin or teacher)
 */
export function canAccessAdminFeatures(user: User | null): boolean {
    return isAdmin(user) || isTeacher(user);
}

/**
 * Check if user has specific role(s)
 */
export function hasRole(user: User | null, roles: string | string[]): boolean {
    if (!user) return false;

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(user.role);
}

/**
 * Filter menu items based on user role
 */
export function filterMenuByRole(menuItems: NavItem[], user: User | null): NavItem[] {
    if (!user) return [];

    return menuItems.filter(item => {
        // Jika tidak ada role requirement, show untuk semua user
        if (!item.roles) return true;

        // Check apakah user memiliki role yang diperlukan
        return hasRole(user, item.roles);
    });
}
